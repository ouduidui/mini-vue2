import { Watcher } from '../observer/watcher';

// 正在构建的实例
export let activeInstance = null;

/**
 * initLifecycle: 初始化生命周期
 * @param vm: 组件实例
 */
export function initLifecycle(vm) {
  const options = vm.$options;
  // 父节点
  let parent = options.parent;
  if (parent) {
    parent.$children.push(vm);
  }
  vm.$parent = parent;
  // 根节点
  vm.$root = parent ? parent.$root : vm;
  // 函数节点
  vm.$children = [];
  // 自定义组件
  vm.$refs = {};
}

export function mountComponent(vm, hook) {
  // beforeMount生命周期钩子
  callHook(vm, 'beforeMount');

  // 创建更新函数
  const updateComponent = () => {
    vm._update(vm._render());
  };

  // 创建监听器
  new Watcher(vm, updateComponent);

  if (!vm.$vnode) {
    // mount生命钩子
    callHook(vm, 'mounted');
  }
}

/**
 * callHook: 钩子调用
 * @param vm: 组件实例
 * @param hook: 钩子名称
 */
export function callHook(vm, hook) {
  // 获取对应钩子函数
  const handler = vm.$options[hook];
  if (handler) {
    try {
      handler.call(vm);
    } catch (e) {
      console.log(e);
    }
  }
}

export function setActiveInstance(vm) {
  const prevActiveInstance = activeInstance; // 保存上一个构建的实例
  activeInstance = vm; // 更新准备构建的实例
  // 返回一个重置函数
  return () => {
    activeInstance = prevActiveInstance;
  };
}

export function updateChildComponent(vm, propsData, listeners, parentVnode) {
  vm.$options._parentVnode = parentVnode;
  vm.$vnode = parentVnode;
  if (vm._vnode) {
    vm._vnode.parent = parentVnode;
  }

  // 更新props
  if (propsData && vm.$options.props) {
    const propsKeys = vm.$options._propKeys || [];
    propsKeys.forEach((key) => {
      vm._props[key] = propsData[key];
    });
    vm.$options.propsData = propsData;
  }
}
