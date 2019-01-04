import angular from 'angular';

import OvhPaymentMethodService from './payment-method.service';

export default class OvhPaymentMethodProvider {
  constructor() {
    this.target = 'EU';
  }

  setTarget(target) {
    if (angular.isString(target)) {
      this.target = target;
    }

    return target;
  }

  /* @ngInject */
  $get($q, $translate, OvhApiMe) {
    return new OvhPaymentMethodService($q, $translate, OvhApiMe, this.target);
  }
}
