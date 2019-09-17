export const PAYPAL_BUTTON_OPTIONS = {
  style: {
    color: 'blue',
    label: 'paypal',
    shape: 'rect',
    size: 'medium',
    tagline: false,
  },
};

export const PAYPAL_SCRIPT = {
  src: 'https://www.paypalobjects.com/api/checkout.js',
  id: 'paypal_checkout_script',
};

export default {
  PAYPAL_BUTTON_OPTIONS,
  PAYPAL_SCRIPT,
};
