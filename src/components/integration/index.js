import angular from 'angular';

import inContext from './inContext';
import redirect from './redirect';

import directive from './directive';

const moduleName = 'ngOvhPaymentMethodIntegration';

angular
  .module(moduleName, [
    inContext,
    redirect,
  ])
  .directive(directive.name, () => directive);

export default moduleName;
