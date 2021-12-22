/**
 * initLifecycle: 初始化事件监听
 * @param vm: 组件实例
 */
export function initEvents(vm) {
  vm._events = Object.create(null);
  const listeners = vm.$options._parentListeners;
  if (listeners) {
    for (let name in listeners) {
      // 事件绑定
      vm.$on(name, vm.$parent[listeners[name]]);
    }
  }
}
