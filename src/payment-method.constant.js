export const AVAILABLE_PAYMENT_MEANS = [{
  value: 'bankAccount',
  canBeAdded: true,
}, {
  value: 'paypal',
  canBeAdded: true,
}, {
  value: 'creditCard',
  canBeAdded: true,
}, {
  value: 'deferredPaymentAccount',
  canBeAdded: false,
}];

export const DEFAULT_OPTIONS = {
  onlyValid: false,
  transform: false, // transform legacy payment methods to payment methods
};

export default {
  AVAILABLE_PAYMENT_MEANS,
  DEFAULT_OPTIONS,
};
