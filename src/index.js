import angular from 'angular';
import ngTranslate from 'angular-translate';

import 'ovh-api-services';

import paymentMethodProvider from './payment-method.provider';
import paymentMethodHelperService from './payment-method-helper.service';

const ovhAngularPaymentMethod = angular
  .module('ovh-angular-payment-method', [
    'ovh-api-services',
    ngTranslate,
  ])
  .run(/* @ngTranslationsInject ./translations */)
  .provider('ovhPaymentMethod', paymentMethodProvider)
  .service('ovhPaymentMethodHelper', paymentMethodHelperService)
  .name;

export default ovhAngularPaymentMethod;
