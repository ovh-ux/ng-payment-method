import filter from 'lodash/filter';
import flatten from 'lodash/flatten';
import get from 'lodash/get';
import has from 'lodash/has';
import map from 'lodash/map';
import merge from 'lodash/merge';
import snakeCase from 'lodash/snakeCase';
import startCase from 'lodash/startCase';

import { DEFAULT_OPTIONS } from '../payment-method.constants';
import {
  AVAILABLE_PAYMENT_MEANS,
  PAYMENT_MEAN_TYPE_ENUM,
} from './mean/payment-mean.constants';

// legacies payment means classes
import OvhPaymentMeanBankAccount from './mean/payment-mean-bank-account.class';
import OvhPaymentMeanCreditCard from './mean/payment-mean-credit-card.class';
import OvhPaymentMeanDeferredPaymentAccount from './mean/payment-mean-deferred-payment-account.class';
import OvhPaymentMeanPaypal from './mean/payment-mean-paypal.class';

export default class OvhPaymentMethodLegacy {
  /* @ngInject */

  constructor($q, $translate, $window, OvhApiMe, target) {
    this.$q = $q;
    this.$translate = $translate;
    this.$window = $window;
    this.OvhApiMe = OvhApiMe;
    this.target = target;
  }

  /**
   *  [addPaymentMethod description]
   *  @param {[type]} paymentMethodType   [description]
   *  @param {[type]} paymentMethodParams [description]
   */
  addPaymentMethod(paymentMethodType, paymentMethodParams = {}) {
    if (this.target !== 'US') {
      return this.addPaymentMean(paymentMethodType, paymentMethodParams);
    }

    return this.addUSPaymentMethod(merge({
      paymentType: paymentMethodType,
    }, paymentMethodParams));
  }

  /**
   *  @deprecated - use editPaymentMean method instead
   *  Edit a legacy payment method
   *  @param  {Object} legacyPaymentMethod The legacy payment mean or US payment method to edit
   *  @return {Promise}
   */
  editPaymentMethod(legacyPaymentMethod, params) {
    return this.editPaymentMean(legacyPaymentMethod, params);
  }

  /**
   *  @deprecated - use setPaymentMeanAsDefault method instead
   *  Set a legacy payment method as default. Check the target to call the right API.
   *  @param  {Object} legacyPaymentMethod The legacy payment method to set as default
   *  @return {Promise}
   */
  setPaymentMethodAsDefault(legacyPaymentMethod) {
    return this.setPaymentMeanAsDefault(legacyPaymentMethod);
  }

  /**
   *  Challenge a legacy payment method. Check the target to call the right API.
   *  @param  {Object} legacyPaymentMethod The legacy payment method to set as default
   *  @param  {Object} challenge The challenge value
   *  @return {Promise}
   */
  challengePaymentMethod(legacyPaymentMethod, challenge) {
    if (this.target === 'US') {
      return this.$q.reject({
        status: 403,
        message: 'challengePaymentMean is not available for US world part',
      });
    }
    return this.challengePaymentMean(legacyPaymentMethod, challenge);
  }

  /**
   *  @deprecated - use deletePaymentMean method instead
   *  Delete a legacy payment method. Check the target to call the right API.
   *  @param  {Object} legacyPaymentMethod The legacy payment method to delete
   *  @return {Promise}
   */
  deletePaymentMethod(legacyPaymentMethod) {
    return this.deletePaymentMean(legacyPaymentMethod);
  }

  /**
   *  Get available payment mean types. This will regroup the infos provided by API
   *  with the infos from constants.
   *  @return {Promise} That returns an array of available payment means
   *                    transformed to payment method types.
   */
  getAvailablePaymentMethodTypes() {
    const availablePromise = this.$q.when(get(AVAILABLE_PAYMENT_MEANS, this.target));

    return this.$q.all({
      infos: availablePromise,
      availableMeans: this.OvhApiMe.AvailableAutomaticPaymentMeans().v6().get().$promise,
    }).then(({ infos, availableMeans }) => {
      const registerablePaymentMeans = filter(infos, (paymentMeanInfos) => {
        if (!get(availableMeans, paymentMeanInfos.value)) {
          return false;
        }

        if (!paymentMeanInfos.registerable) {
          return false;
        }

        return true;
      });

      return map(
        registerablePaymentMeans,
        this.transformLegacyPaymentMethodTypeToPaymentMethodType.bind(this),
      );
    });
  }

  /* =====================================
  =            Payment Means            =
  ===================================== */

  /**
   *  Get the right v6 resource for /me/paymentMean APIs.
   *
   *  @param  {String} paymentMeanType The type of payment mean that will be used to determine
   *                                   the API route (and so the right resource)
   *  @return {ngResource}
   */
  getPaymentMeanResource(paymentMeanType) {
    return this.OvhApiMe.PaymentMean()[startCase(paymentMeanType).split(' ').join('')]().v6();
  }

  /**
   *  Get all payment means of the logged user.
   *  This method is not available for US as the API doesn't exists.
   *
   *  @param  {Object} options Options for fetching payment methods
   *  @return {Promise}        That returns an array of payment means.
   */
  getPaymentMeans(options = DEFAULT_OPTIONS) {
    if (this.target === 'US') {
      return this.$q.reject({
        status: 403,
        data: {
          message: 'getPaymentMeans is not available for US world part',
        },
      });
    }

    const availablePaymentMeans = get(AVAILABLE_PAYMENT_MEANS, this.target);

    return this.$q
      .all(map(
        availablePaymentMeans,
        type => this.getPaymentMeansOfType(type.value, options),
      ))
      .then(paymentsOfType => flatten(paymentsOfType));
  }

  /**
   *  Get the payment means of given type.
   *
   *  @param  {String} paymentMeanType The type of payment mean to get
   *  @param  {Object} options         Options for fetching payment means
   *  @return {Promise}                That returns an Array with all the payment means of
   *                                   given type.
   */
  getPaymentMeansOfType(paymentMeanType, options = DEFAULT_OPTIONS) {
    if (this.target === 'US') {
      return this.$q.reject({
        status: 403,
        data: {
          message: 'getPaymentMethodOfType is not available for US world part',
        },
      });
    }

    const resource = this.getPaymentMeanResource(paymentMeanType);

    return resource
      .query(paymentMeanType === 'bankAccount' && options.onlyValid ? {
        state: 'valid',
      } : {}).$promise
      .then(paymentMeanIds => this.$q.all(map(
        paymentMeanIds,
        paymentMeanId => resource.get({
          id: paymentMeanId,
        }).$promise.then((mean) => {
          let paymentMean;
          switch (paymentMeanType) {
            case PAYMENT_MEAN_TYPE_ENUM.BANK_ACCOUNT:
              paymentMean = new OvhPaymentMeanBankAccount(mean);
              break;
            case PAYMENT_MEAN_TYPE_ENUM.CREDIT_CARD:
              paymentMean = new OvhPaymentMeanCreditCard(mean);
              break;
            case PAYMENT_MEAN_TYPE_ENUM.DEFERRED_PAYMENT_ACCOUNT:
              paymentMean = new OvhPaymentMeanDeferredPaymentAccount(mean);
              break;
            case PAYMENT_MEAN_TYPE_ENUM.PAYPAL:
              paymentMean = new OvhPaymentMeanPaypal(mean);
              break;
            default:
              break;
          }

          return options.transform ? paymentMean.toPaymentMethod() : paymentMean;
        }),
      )));
  }

  addPaymentMean(paymentMeanType, params = {}) {
    const addParams = params;

    if (has(addParams, 'default')) {
      addParams.setDefault = addParams.default;
      delete addParams.default;
    }

    return this.getPaymentMeanResource(paymentMeanType)
      .save({}, addParams)
      .$promise.then((result) => {
        if (result.url && paymentMeanType !== 'bankAccount') {
          if (!params.returnUrl) {
            this.$window.open(result.url, '_blank');
          } else {
            this.$window.location = result.url;
          }
        }

        return result;
      });
  }

  /**
   *  Edit the given payment mean.
   *  @param  {Object} paymentMean The payment mean to edit
   *  @return {Promise}
   */
  editPaymentMean(paymentMean, params) {
    return this.getPaymentMeanResource(paymentMean.meanType)
      .edit({
        id: paymentMean.id,
      }, params).$promise;
  }

  /**
   *  Set the given payment mean as default payment
   *  @param  {Object} paymentMean The paymentMean object to set as default
   *  @return {Promise}
   */
  setPaymentMeanAsDefault(paymentMean) {
    return this.getPaymentMeanResource(paymentMean.meanType)
      .chooseAsDefaultPaymentMean({
        id: paymentMean.id,
      }, null).$promise;
  }

  /**
   *  Delete the given payment mean
   *  @param  {Object} paymentMean The paymentMean object to delete
   *  @return {Promise}
   */
  deletePaymentMean(paymentMean) {
    return this.getPaymentMeanResource(paymentMean.meanType)
      .delete({
        id: paymentMean.id,
      }).$promise;
  }

  /**
   *  Challenge the given payment mean
   *  @param  {Object} paymentMean The paymentMean object to delete
   *  @param  {Object} challenge The challenge value
   *  @return {Promise}
   */
  challengePaymentMean(paymentMean, challenge) {
    return this.getPaymentMeanResource(paymentMean.paymentType)
      .challenge({
        id: paymentMean.id,
      }, { challenge }).$promise;
  }

  /* =====  End of Payment Means  ====== */

  /* ==========================================
  =            US Payment Methods            =
  ========================================== */

  /**
   *  @deprecated
   *  Should not be used anymore as legacy (original) payment methods
   *  are not returned anymore by the library in the US.
   *  Reject if method is still called before deleting it.
   */
  addUSPaymentMethod() {
    return this.$q.reject({
      status: 404,
      data: {
        message: 'POST /me/paymentMethod is no longer available.',
      },
    });
  }

  /**
   *  @deprecated
   *  Should not be used anymore as legacy (original) payment methods
   *  are not returned anymore by the library in the US.
   *  Reject if method is still called before deleting it.
   */
  editUSPaymentMethod() {
    return this.$q.reject({
      status: 404,
      data: {
        message: 'PUT /me/paymentMethod/{paymentMethodId} is no longer available.',
      },
    });
  }

  /**
   *  @deprecated
   *  Should not be used anymore as legacy (original) payment methods
   *  are not returned anymore by the library in the US.
   *  Reject if method is still called before deleting it.
   */
  deleteUSPaymentMethod() {
    return this.$q.reject({
      status: 404,
      data: {
        message: 'DELETE /me/paymentMethod/{paymentMethodId} is no longer available.',
      },
    });
  }

  /*= ====  End of US Payment Methods  ====== */


  /* =========================================
   =            Transform Methods            =
   ========================================= */

  getFullPaymentType(paymentType) {
    return {
      value: snakeCase(paymentType).toUpperCase(),
      text: this.$translate.instant(`ovh_payment_type_${snakeCase(paymentType)}`),
    };
  }

  getFullPaymentStatus(paymentStatus, paymentType) {
    return {
      value: snakeCase(paymentStatus).toUpperCase(),
      text: paymentType === 'bankAccount' && paymentStatus === 'pendingValidation'
        ? this.$translate.instant('ovh_payment_status_waiting_for_documents')
        : this.$translate.instant(`ovh_payment_status_${snakeCase(paymentStatus)}`),
    };
  }

  /**
   *  Transform payment mean to payment method.
   *  The goal is to have a coherent object structure between api calls
   *  (/me/payment/method and /me/paymentMean/*)
   */
  transformUSPaymentMethodToPaymentMethod(usPaymentMethod) {
    const paymentType = get(usPaymentMethod, 'paymentType', null);
    const paymentStatus = get(usPaymentMethod, 'status', null);

    return {
      paymentSubType: get(usPaymentMethod, 'paymentSubType', null),
      icon: {
        name: null,
        data: null,
      },
      status: this.getFullPaymentStatus(paymentStatus, paymentType),
      paymentMethodId: usPaymentMethod.id,
      default: get(usPaymentMethod, 'default', false),
      description: get(usPaymentMethod, 'description', null),
      paymentType: this.getFullPaymentType(paymentType),
      billingContactId: get(usPaymentMethod, 'billingContactId', null),
      creationDate: get(usPaymentMethod, 'creationDate', null),
      lastUpdate: null,
      label: get(usPaymentMethod, 'publicLabel', null),
      original: usPaymentMethod,
    };
  }

  transformPaymentMeanToPaymentMethod(paymentMean) {
    const paymentType = get(paymentMean, 'paymentType', null);
    const paymentStatus = get(paymentMean, 'state', null);
    let paymentLabel;

    switch (paymentType) {
      case 'paypal':
        paymentLabel = paymentMean.email;
        break;
      case 'creditCard':
        paymentLabel = paymentMean.number;
        break;
      case 'bankAccount':
        paymentLabel = paymentMean.iban;
        break;
      default:
        paymentLabel = paymentMean.label || null;
        break;
    }

    return {
      paymentSubType: get(paymentMean, 'type', null),
      icon: {
        name: null,
        data: null,
      },
      status: this.getFullPaymentStatus(paymentStatus, paymentType),
      paymentMethodId: paymentMean.id,
      default: get(paymentMean, 'defaultPaymentMean', false),
      description: get(paymentMean, 'description', null),
      paymentType: this.getFullPaymentType(paymentType),
      billingContactId: null,
      creationDate: get(paymentMean, 'creationDate', null),
      lastUpdate: null,
      label: paymentLabel,
      expirationDate: get(paymentMean, 'expirationDate', null),
      original: paymentMean,
    };
  }

  transformLegacyPaymentMethodTypeToPaymentMethodType(legacyPaymentMethod) {
    return {
      oneshot: true,
      icon: {
        name: null,
        data: null,
      },
      registerable: legacyPaymentMethod.registerable,
      paymentType: this.getFullPaymentType(legacyPaymentMethod.value),
      original: legacyPaymentMethod,
    };
  }

  /* =====  End of Transform Methods  ====== */
}
