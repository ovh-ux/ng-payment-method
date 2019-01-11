import _ from 'lodash';

import {
  DEFAULT_OPTIONS,
} from './payment-method.constant';

import OvhPaymentMethodLegacy from './payment-method-legacy';

export default class OvhPaymentMethodService {
  /* @ngInject */

  constructor($q, $translate, $window, OvhApiMe, target) {
    this.$q = $q;
    this.$translate = $translate;
    this.$window = $window;
    this.OvhApiMe = OvhApiMe;

    this.ovhPaymentMethodLegacy = new OvhPaymentMethodLegacy(
      $q, $translate, $window, OvhApiMe, target,
    );
  }

  /* =============================================
  =            LEGACY PAYMENT METHODS            =
  ============================================== */

  /**
   *  Check if connected user has a default payment method
   *  @return {Boolean}
   */
  hasDefaultPaymentMethod() {
    return this.getDefaultPaymentMethod()
      .then(method => (!!method));
  }

  /**
   *  Get the default payment method of the user.
   *  @return {Object} The default payment method of the connected user.
   */
  getDefaultPaymentMethod() {
    return this.getAllPaymentMethods({
      onlyValid: true,
      transform: true,
    }).then(paymentMethods => _.find(paymentMethods, {
      default: true,
    }) || null);
  }

  /* ----------  Payment types  ---------- */

  getAvailablePaymentMethodTypes() {
    return this.OvhApiMe.Payment().Method().v6().availableMethods().$promise
      .then((paymentTypes) => {
        const registerablePaymentTypes = _.filter(paymentTypes, {
          registerable: true,
        });

        return _.map(registerablePaymentTypes, (paymentTypeParam) => {
          const paymentType = paymentTypeParam;
          paymentType.paymentType = {
            value: paymentType.paymentType,
            text: this.$translate.instant(`ovh_payment_type_${_.snakeCase(paymentType.paymentType)}`),
          };
          return paymentType;
        });
      })
      .catch(error => (error.status === 404 ? [] : this.$q.reject(error)));
  }

  /**
   *  Get all the available payment method types
   *  @return {Promise} That returns a list of available payment method types
   */
  getAllAvailablePaymentMethodTypes() {
    return this.$q.all({
      legacyTypes: this.ovhPaymentMethodLegacy.getAvailablePaymentMethodTypes(),
      paymentMethodTypes: this.getAvailablePaymentMethodTypes(),
    }).then(({ legacyTypes, paymentMethodTypes }) => {
      _.remove(legacyTypes, ({ paymentType }) => {
        const hasIdentical = _.some(paymentMethodTypes, (paymentMethodType) => {
          const isSameValue = paymentMethodType.paymentType.value === paymentType.value;
          return isSameValue;
        });
        return hasIdentical;
      });

      return [].concat(legacyTypes, paymentMethodTypes);
    });
  }

  /* ----------  Action on paymentMethod  ---------- */

  /**
   *  Add an new payment method
   */
  addPaymentMethod(paymentMethodType, params = {}) {
    if (paymentMethodType.original) {
      return this.ovhPaymentMethodLegacy
        .addPaymentMethod(paymentMethodType.original.value, params);
    }

    const addParams = params;
    addParams.paymentType = paymentMethodType.paymentType.value;
    return this.OvhApiMe.Payment().Method().v6().save({}, addParams).$promise
      .then((response) => {
        this.$window.location = response.url;
        return response;
      });
  }

  /**
   *  Edit given payment method
   *  @param  {Object} paymentMethod The payment method to edit
   *  @param  {Object} params        The attributes of payment method to edit
   *  @return {Promise}
   */
  editPaymentMethod(paymentMethod, params) {
    // if original attribute is present, it means that it's an legacy payment method
    if (paymentMethod.original) {
      return this.ovhPaymentMethodLegacy
        .editPaymentMethod(paymentMethod.original, params);
    }

    return this.OvhApiMe.Payment().Method().v6().edit({
      paymentMethodId: paymentMethod.paymentMethodId,
    }, params).$promise;
  }

  /**
   *  Set given payment method as default
   *  @param  {Object} paymentMethod The payment method to set as default
   *  @return {Promise}
   */
  setPaymentMethodAsDefault(paymentMethod) {
    // if original attribute is present, it means that it's an legacy payment method
    if (paymentMethod.original) {
      return this.ovhPaymentMethodLegacy
        .setPaymentMethodAsDefault(paymentMethod.original);
    }

    return this.editPaymentMethod(paymentMethod, {
      default: true,
    });
  }

  /**
   *  Delete given payment method
   *  @param  {Object} paymentMethod The paymentMethod to delete
   *  @return {Promise}
   */
  deletePaymentMethod(paymentMethod) {
    // if original attribute is present, it means that it's an legacy payment method
    if (paymentMethod.original) {
      return this.ovhPaymentMethodLegacy
        .deletePaymentMethod(paymentMethod.original);
    }

    return this.OvhApiMe.Payment().Method().v6().delete({
      paymentMethodId: paymentMethod.paymentMethodId,
    }).$promise;
  }


  /* ----------  New payment methods  ---------- */

  /**
   *  Get the payment methods returned by /me/payment/method APIs
   *  @param  {Obejct}  options           Options to get the payment methods
   *  @return {Promise}                   That returns an Array of payment methods
   */
  getPaymentMethods(options = DEFAULT_OPTIONS) {
    return this.OvhApiMe.Payment().Method().v6()
      .query(options.onlyValid ? {
        status: 'VALID',
      } : {}).$promise
      .then(paymentMethodIds => this.$q
        .all(_.map(paymentMethodIds, paymentMethodId => this.OvhApiMe.Payment().Method().v6()
          .get({
            paymentMethodId,
          }).$promise.then((paymentMethodParam) => {
            const paymentMethod = paymentMethodParam;

            // set status object
            paymentMethod.status = {
              value: paymentMethod.status,
              text: this.$translate.instant(`ovh_payment_status_${_.snakeCase(paymentMethod.status)}`),
            };

            // set paymentType object
            paymentMethod.paymentType = {
              value: paymentMethod.paymentType,
              text: this.$translate.instant(`ovh_payment_type_${_.snakeCase(paymentMethod.paymentType)}`),
            };

            return paymentMethod;
          }))))
      .catch(error => (error.status === 404 ? [] : this.$q.reject(error)));
  }

  /**
   *  Get all payment methods, even the legacy one returned by /me/paymentMean/*
   *  and /me/paymentMethod APIs routes.
   *  @param  {Obejct}  options           Options to get the payment methods
   *  @param  {Boolean} options.onlyValid Gets only valid payment methods
   *  @param  {Boolean} options.transform Flag telling if legacy payment methods needs to be
   *                                      transformed to new payment method object
   *  @return {Promise}                   That returns an Array of payment methods merged
   *                                      with legacy payment methods.
   */
  getAllPaymentMethods(options = DEFAULT_OPTIONS) {
    return this.$q.all({
      legacies: this.ovhPaymentMethodLegacy.getPaymentMethods(options),
      paymentMethods: this.getPaymentMethods(),
    }).then(({ legacies, paymentMethods }) => {
      _.remove(legacies, ({ paymentMethodId }) => _.some(paymentMethods, {
        paymentMeanId: paymentMethodId,
      }));

      return [].concat(legacies, paymentMethods);
    });
  }
}
