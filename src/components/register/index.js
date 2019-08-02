import angular from 'angular';
import iframeVantiv from './iframeVantiv';

import component from './component';

const moduleName = 'ngOvhPaymentMehtodRegister';

angular
  .module(moduleName, [
    iframeVantiv,
  ])
  .component(component.name, component);

export default moduleName;
