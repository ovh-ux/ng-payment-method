import _ from 'lodash';

import {
  AVAILABLE_PAYMENT_MEANS,
  DEFAULT_OPTIONS,
} from './payment-method.constant';

import OvhPaymentMethodLegacy from './payment-method-legacy';

export default class OvhPaymentMethodService {
  /* @ngInject */

  constructor($q, $translate, OvhApiMe, target) {
    this.$q = $q;
    this.$translate = $translate;
    this.OvhApiMe = OvhApiMe;
    this.target = target;

    this.ovhPaymentMethodLegacy = new OvhPaymentMethodLegacy($q, $translate, OvhApiMe, target);
  }

  /* =============================================
  =            LEGACY PAYMENT METHODS            =
  ============================================== */

  getLegacyPaymentTypes() {
    if (this.target !== 'US') {
      return this.$q.when(_.chain(AVAILABLE_PAYMENT_MEANS)
        .filter({ canBeAdded: true })
        .map('value')
        .map(value => _.snakeCase(value).toUpperCase())
        .value());
    }

    return this.$q.when(['CREDIT_CARD']);
  }

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

  getAvailablePaymentTypes() {
    return this.$q.all({
      legacyTypes: this.getLegacyPaymentTypes(),
      paymentMethodTypes: this.OvhApiMe.Payment().Method().v6().availableMethods().$promise,
    }).then(({ legacyTypes, paymentMethodTypes }) => {
      console.log(legacyTypes, paymentMethodTypes);
    });

    // const paymentTypes = this.target !== 'US' ? AVAILABLE_PAYMENT_MEANS : [];

    // if (!translated) {
    //   return paymentTypes;
    // }

    // return _.map(paymentTypes, paymentType => ({
    //   value: paymentType,
    //   text: this.$translate.instant(`ovh_payment_type_${_.snakeCase(paymentType)}`),
    // }));
  }

  /* ----------  Action on paymentMethod  ---------- */

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
          }))));
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
      // paymentMethods: this.getPaymentMethods(),
      paymentMethods: this.$q.when([]),
    }).then(({ legacies, paymentMethods }) => {
      _.remove(legacies, ({ paymentMethodId }) => _.some(paymentMethods, {
        paymentMeanId: paymentMethodId,
      }));

      return [].concat(legacies, paymentMethods);
    });
  }
}
