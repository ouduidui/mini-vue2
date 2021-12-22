import { mergeOptions } from '../util/options';
import { ASSET_TYPES } from '../shared/constants';
import { Vue } from '../instance/index';

export function initExtend(Vue) {
  Vue.cid = 0;
  let cid = 1;

  Vue.extend = function (extendOptions = {}) {
    const Super = this;
    const SuperId = Super.cid;
    const name = extendOptions.name || Super.options.name;

    const Sub = function VueComponent(options) {
      return new Vue({
        ...options,
        ...Sub.options
      }); // 初始化
    };

    // 继承
    Sub.prototype = Object.create(Super.prototype);
    Sub.prototype.constructor = Sub;
    Sub.cid = cid++;
    Sub.options = mergeOptions(Super.options, extendOptions);
    Sub['super'] = Super;

    Sub.extend = Super.extend;
    Sub.mixin = Super.mixin;
    Sub.use = Super.use;

    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type];
    });

    if (name) {
      Sub.options.components[name] = Sub;
    }

    Sub.superOptions = Super.options;
    Sub.extendOptions = extendOptions;

    return Sub;
  };
}
