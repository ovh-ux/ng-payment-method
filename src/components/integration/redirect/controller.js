export default class OvhPaymentMethodIntegrationRedirectCtrl {
  constructor() {
  }

  /* ============================
  =            Hooks            =
  ============================= */

  $onInit() {
    this.integrationCtrl.onIntegrationInitialized();
  }

  /* -----  End of Hooks  ------ */

};
