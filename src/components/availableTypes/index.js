import angular from 'angular';

import component from './availableTypes.component';

const moduleName = 'ngOvhPaymentMehtodAvailableTypes';

angular
  .module(moduleName, [])
  .component(component.name, component);

export default moduleName;
