import { createElement } from '../vdom/create-element';
import { createTextNode } from '../vdom/vnode';
import { defineReactive } from '../observer/index';

/**
 * initRender: 初始化render属性
 * @param vm<Object>: Vue实例
 */
export function initRender(vm) {
  // 定义render参数createElement
  vm._c = createElement;
  vm._v = createTextNode;

  // 定义$attrs和$listeners的响应式
  const options = vm.$options;
  const parentVnode = (vm.$vnode = options._parentVnode);
  const parentData = parentVnode && parentVnode.data;
  defineReactive(vm, '$attrs', (parentData && parentData.data) || {});
  defineReactive(vm, '$listeners', options._parentListeners || {});
}
