import angular from 'angular';

import availableTypesComponent from './availableTypes';

const moduleName = 'ngOvhPaymentMethodComponents';

angular
  .module(moduleName, [
    availableTypesComponent,
  ]);

export default moduleName;
