import isFunction from 'lodash/isFunction';

export default class OvhPaymentMethodRegisterCtrl {
  onRegisterComponentInitialized(componentInstance) {
    if (this.onInit && isFunction(this.onInit())) {
      this.onInit()(componentInstance);
    }
  }
}
