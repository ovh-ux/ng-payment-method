import chunk from 'lodash/chunk';
import find from 'lodash/find';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import map from 'lodash/map';
import set from 'lodash/set';

import {
  DEFAULT_DISPLAY_PER_LINE,
  DEFAULT_ORDERED_PAYMENT_METHOD_TYPES,
  DEFAULT_SELECTED_PAYMENT_METHOD_TYPE,
  FALLBACK_IMAGES,
} from './availableTypes.constants';

export default class OvhPaymentMethodAvailableTypesCtrl {
  /* @ngInject */
  constructor(ovhPaymentMethod, ovhPaymentMethodHelper) {
    // dependencies injection
    this.ovhPaymentMethod = ovhPaymentMethod;
    this.ovhPaymentMethodHelper = ovhPaymentMethodHelper;

    // other attributes in view
    this.paymentMethodTypes = {
      list: null,
      chunks: null,
    };

    this.loading = {
      init: false,
    };

    // define model
    this.model = {};
    Object.defineProperties(this.model, {
      $selectedPaymentType: {
        enumerable: false,
        writable: true,
      },
      selectedPaymentType: {
        enumerable: true,
        get: () => this.model.$selectedPaymentType,
        set: (paymentType) => {
          console.log('set');
          this.model.$selectedPaymentType = paymentType;
          this.onPaymentMethodChange();
        },
      },
    });
  }

  /* =============================
  =            Events            =
  ============================== */

  onPaymentMethodChange() {
    // if it's a function reference ...
    // otherwise the call will be made passing an Object Literal
    // when testing if the callback function is a function ref or not
    if (isFunction(this.onSelectedPaymentTypeChange({
      paymentType: this.model.selectedPaymentType,
    }))) {
      // ... invoke it
      this.onSelectedPaymentTypeChange()(this.model.selectedPaymentType);
    }
  }

  /* -----  End of Events  ------ */

  /* =====================================
  =            Initialization            =
  ====================================== */

  setDefaultValues() {
    // paymentTypesOrder is an array with default ordered payment types
    if (!this.paymentTypesOrder) {
      this.paymentTypesOrder = DEFAULT_ORDERED_PAYMENT_METHOD_TYPES;
    }

    // paymentTypesPerLine set to DEFAULT_DISPLAY_PER_LINE
    if (!this.paymentTypesPerLine) {
      this.paymentTypesPerLine = DEFAULT_DISPLAY_PER_LINE;
    }

    // set default payment method type selected
    if (!this.defaultPaymentType) {
      this.defaultPaymentType = DEFAULT_SELECTED_PAYMENT_METHOD_TYPE;
    }
  }

  $onInit() {
    this.setDefaultValues();

    this.loading.init = true;

    return this.ovhPaymentMethod
      .getAllAvailablePaymentMethodTypes()
      .then((availableTypesPaymentMethodTypes) => {
        this.paymentMethodTypes.list = availableTypesPaymentMethodTypes.sort((typeA, typeB) => {
          const typeAIndex = this.paymentTypesOrder.indexOf(typeA.paymentType);
          const typeBIndex = this.paymentTypesOrder.indexOf(typeB.paymentType);
          return typeAIndex > typeBIndex;
        });

        this.paymentMethodTypes.list = map(this.paymentMethodTypes.list, (paymentTypeParam) => {
          const paymentType = paymentTypeParam;
          if (!get(paymentType, 'icon.data')) {
            set(
              paymentType,
              'icon.data',
              get(FALLBACK_IMAGES, paymentType.paymentType),
            );
          }
          return paymentType;
        });

        this.paymentMethodTypes.chunks = chunk(
          this.paymentMethodTypes.list,
          this.paymentTypesPerLine,
        );

        this.model.selectedPaymentType = find(this.paymentMethodTypes.list, {
          paymentType: this.defaultPaymentType,
        });

        // if it's a function reference ...
        // otherwise the call will be made passing an Object Literal
        // when testing if the callback function is a function ref or not
        if (isFunction(this.onLoaded({
          availableTypes: this.paymentMethodTypes.list,
        }))) {
          // ... invoke it
          this.onLoaded()(this.paymentMethodTypes.list);
        }
      })
      .catch((error) => {
        // if it's a function reference ...
        // otherwise the call will be made passing an Object Literal
        // when testing if the callback function is a function ref or not
        if (isFunction(this.onLoadError({
          error,
        }))) {
          // ... invoke it
          this.onLoadError()(error);
        }
      })
      .finally(() => {
        this.loading.init = false;
      });
  }

  /* -----  End of Initialization  ------ */
}
