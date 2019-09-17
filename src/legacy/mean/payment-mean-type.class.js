import snakeCase from 'lodash/snakeCase';

import OvhPaymentMethodType from '../../payment-method-type.class.js';

export default class OvhPaymentMeanType {
  constructor(options = {}) {
    this.meanType = options.value;
    this.registerable = options.registerable;
  }

  toPaymentMethodType() {
    return new OvhPaymentMethodType({
      paymentType: snakeCase(this.meanType).toUpperCase(),
      registerable: this.registerable,
    });
  }
}
