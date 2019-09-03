import snakeCase from 'lodash/snakeCase';

export default class OvhPaymentMean {
  constructor(options = {}) {
    this.meanType = options.meanType;
    this.defaultPaymentMean = options.defaultPaymentMean;
    this.description = options.description;
    this.state = options.state;
    this.id = options.id;
  }

  toPaymentMethod() {
    return {
      paymentMethodId: this.id,
      paymentType: snakeCase(this.meanType).toUpperCase(),
      description: this.description,
      status: snakeCase(this.state).toUpperCase(),
      default: this.defaultPaymentMean,
    };
  }
}
