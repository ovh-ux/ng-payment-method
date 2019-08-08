import get from 'lodash/get';
import set from 'lodash/set';

import controller from './controller';
import {
  THREAT_METRIC,
  VANTIV_IFRAME_CONFIGURATION,
  VANTIV_SCRIPT,
} from './constants';

const directiveName = 'ovhPaymentMethodRegisterIframeVantiv';

export default {
  name: directiveName,
  require: {
    vantivIframeCtrl: directiveName,
    registerCtrl: '^ovhPaymentMethodRegister',
  },
  controller,
  controllerAs: '$ctrl',
  bindToController: true,
  template: `<div id="${VANTIV_IFRAME_CONFIGURATION.div}"></div>`,
  link: (scope, iElement, iAttributes, iControllers) => {
    /**
     *  Insert a script with given attributes
     */
    const insertElement = (tagName, attributes = {}, onLoad = () => {}, styles = {}) => {
      const element = document.createElement(tagName);

      // set attributes of dom element
      Object.keys(attributes).forEach((key) => {
        element.setAttribute(key, get(attributes, key));
      });

      // set tyles of dom element
      Object.keys(styles).forEach((key) => {
        set(element.style, key, get(styles, key));
      });

      // define onload callback
      element.onload = onLoad;

      document.body.appendChild(element);
      console.log(element.attachEvent);
      return element;
    };

    // declare insertThreatMetric method that will load the script and iframe
    // that will handle Vantiv ThreatMetric mechanism
    iControllers.vantivIframeCtrl.insertThreatMetric = paymentMehtod => new Promise((resolve, reject) => {
      const threatMetricParams = `?org_id=OVHCLOUD&session_id=${new Date().getTime()}&pageid=${THREAT_METRIC.PAGE_ID}`;

      const onScriptLoaded = () =>
      // when script is loaded - add the invisble iframe
        insertElement('iframe', {
          id: THREAT_METRIC.IFRAME.id,
          src: `${THREAT_METRIC.IFRAME.src}${threatMetricParams}`,
        }, () => {
          console.log('iframe loaded ?');
          return resolve();
        }, {
          with: '100px',
          height: '100px',
          border: '0',
          position: 'absolute',
          top: '-5000px',
        });
      insertElement('script', {
        src: `${THREAT_METRIC.SCRIPT.src}${threatMetricParams}`,
        id: THREAT_METRIC.SCRIPT.id,
        type: 'text/javascript',
      }, onScriptLoaded);
    });

    // add vantiv script to document body
    // first check if script has already been added
    if (!document.getElementById(VANTIV_SCRIPT.id)) {
      insertElement('script', {
        src: VANTIV_SCRIPT.src,
        id: VANTIV_SCRIPT.id,
      }, iControllers.vantivIframeCtrl.init.bind(iControllers.vantivIframeCtrl));
    } else {
      iControllers.vantivIframeCtrl.init();
    }
  },
};
