import angular from 'angular';

import component from './availableTypes.component';

// import styles
import './index.scss';

const moduleName = 'ngOvhPaymentMehtodAvailableTypes';

angular
  .module(moduleName, [])
  .component(component.name, component);

export default moduleName;
