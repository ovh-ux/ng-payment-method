import angular from 'angular';

import OvhPaymentMehtodService from './payment-method.service';

export default class OvhPaymentMethodProvider {
  /* @ngInject */

  constructor() {
    this.target = 'EU';
  }

  setTarget(target) {
    if (angular.isString(target)) {
      this.target = target;
    }

    return target;
  }

  $get($q, $translate, $window, OvhApiMe) {
    return new OvhPaymentMehtodService($q, $translate, $window, OvhApiMe, this.target);
  }
}
