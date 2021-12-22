import { VNode } from './vnode';
import { activeInstance, updateChildComponent } from '../instance/lifecycle';
import { callHook } from '../instance/lifecycle';

// 组件管理钩子的定义
const componentVNodeHooks = {
  // 组件初始化钩子
  init(vnode) {
    console.log('Component init hook');
    // 创建自定义组件实例
    const child = (vnode.componentInstance = createComponentInstanceForVnode(vnode, activeInstance));
    // 执行挂载
    child.$mount(vnode.elm || undefined);
  },

  // 组件更新前钩子
  prepatch(oldVnode, vnode) {
    console.log('Component prepatch hook');
    const options = vnode.componentOptions;
    const child = (vnode.componentInstance = oldVnode.componentInstance);
    updateChildComponent(child, options.propsData, options.listeners, vnode, options.children);
  },

  // 组件插入dom节点钩子
  insert(vnode) {
    console.log('Component insert hook');
    const { componentInstance } = vnode;
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true;
      callHook(componentInstance, 'mounted');
    }
  },

  // 组件销毁钩子
  destroy() {}
};

const hooksToMerge = Object.keys(componentVNodeHooks);

/**
 * 创建组件vnode
 * @param Ctor 组件构造函数
 * @param data 组件属性
 * @param context 组件上下文
 * @param children 孩子节点
 * @param tag 组件标签
 * */
export function createComponent(Ctor, data = {}, context, children, tag) {
  // 安装组件管理钩子
  installComponentHooks(data);

  // 自定义组件
  const name = Ctor.options.name || tag;

  // 获取组件props
  const propOptions = Ctor.options.props;
  const propsData = {};
  // 获取绑定属性
  const { vBind: props } = data;
  if (props) {
    for (const key in propOptions) {
      // 获取props值
      propsData[key] = context[props[key]] || undefined;
    }
  }
  Ctor.options.propsData = propsData;

  // 获取组件listeners
  const listeners = data.vOn;
  Ctor.options._parentListeners = listeners;

  // 创建vnode
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data,
    children,
    undefined,
    undefined,
    context,
    { Ctor, tag, children, propsData, listeners }
  );

  return vnode;
}

/**
 * 管理钩子：合并用户编写的钩子和系统默认的钩子（hooksToMerge）
 * */
function installComponentHooks(data) {
  const hooks = data.hook || (data.hook = {});
  for (let i = 0; i < hooksToMerge.length; i++) {
    const key = hooksToMerge[i];
    hooks[key] = componentVNodeHooks[key];
  }
}

/*
 * 创建组件实例
 * */
function createComponentInstanceForVnode(vnode, parent) {
  // 合并父组件实例
  const options = {
    _isComponent: true,
    _parentVnode: vnode,
    parent
  };

  // 创建自定义组件实例
  return vnode.componentOptions.Ctor(options);
}
