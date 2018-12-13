export const AVAILABLE_PAYMENT_MEANS = [{
  value: 'bankAccount',
  registerable: true,
}, {
  value: 'paypal',
  registerable: true,
}, {
  value: 'creditCard',
  registerable: true,
}, {
  value: 'deferredPaymentAccount',
  registerable: false,
}];

export const DEFAULT_OPTIONS = {
  onlyValid: false,
  transform: false, // transform legacy payment methods to payment methods
};

export default {
  AVAILABLE_PAYMENT_MEANS,
  DEFAULT_OPTIONS,
};
