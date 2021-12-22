import { set, del } from '../observer/index';
import { nextTick } from '../util/next-tick';
import { initExtend } from './extend';
import { initAssetRegisters } from './assets';
import { ASSET_TYPES } from '../shared/constants';

export function initGlobalAPI(Vue) {
  Vue.set = set; // 实现Vue.set
  Vue.delete = del; // 实现Vue.delete
  Vue.nextTick = nextTick; // 实现Vue.nextTick

  // 实现Vue.options
  Vue.options = Object.create(null);
  // 遍历数组：components、filters、directives
  ASSET_TYPES.forEach((type) => {
    Vue.options[type + 's'] = Object.create(null); // 空对象
  });
  Vue.options._base = Vue;

  initExtend(Vue); // 实现Vue.extend函数
  initAssetRegisters(Vue); // 注册实现Vue.component、directive、filter
}
