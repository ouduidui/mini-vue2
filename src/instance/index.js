import {initState} from "./state"
import {initLifecycle, mountComponent, callHook, setActiveInstance} from "./lifecycle";
import {set, del} from "../observer/index";
import {Watcher} from "../observer/watcher";
import {popTarget, pushTarget} from "../observer/dep";
import compileToFunction from "../compiler/index"
import {patch} from "../vdom/patch";
import {initRender} from "./render";
import {nextTick} from "../util/next-tick";
import {mergeOptions} from "../util/options";
import {initEvents} from "./events";
import {initInjections, initProvide} from "./inject";

/**
 * Vue:
 * @param options<Object>: 包含el、data、methods等等
 */
export class Vue {
    __patch__ = patch;
    $nextTick = (fn) => nextTick(fn, this);

    constructor(options) {
        // 定义了只读属性$data和$props
        Object.defineProperty(this, '$data', {
            get() {
                return this._data
            }
        })
        Object.defineProperty(this, '$props', {
            get() {
                return this._props
            }
        })

        // 设置响应式数据
        this.$set = set;
        // 删除响应式数据
        this.$delete = del;

        // 初始化选项
        this._init(options);
    }

    /**
     * $watch: 数据监听
     * @param expOrFn: 更新函数
     * @param cb
     */
    $watch(expOrFn, cb) {
        const watcher = new Watcher(this, expOrFn, cb);
        // 收集依赖
        pushTarget();
        cb.apply(this, [watcher.value]);
        popTarget();
    }

    /**
     * _init: Vue初始化处理
     */
    _init(options) {
        this.vm = this;

        // 合并选项
        this.vm.$options = mergeOptions(
            this.vm.constructor.options || {},
            options)

        initLifecycle(this)   // 设置$parent、$children等组件关系属性
        initEvents(this)   // 监听附加在组件上的事件
        initRender(this)    // 初始化组件插槽$slot、声明createElement方法
        callHook(this, 'beforeCreate')  // 调用beforeCreate生命周期钩子
        initInjections(this) //  初始化注入数据 resolve injections before data/props
        initState(this)   // 初始化组件的props/methods/data/computed/watch
        initProvide(this) // 为后代提供数据 resolve provide after data/props

        callHook(this, 'created')  // 调用created生命周期钩子

        // 当设置了el选项时，自动调用$mount
        if (this.$options.el) {
            this.$mount(this.$options.el)
        }
    }

    /**
     * $mount: 组件挂载
     * @param el
     */
    $mount(el) {
        // 获得宿主
        this.$el = el && document.querySelector(el);

        // 查找render选项，若不存在render选项则将template/el的设置转换为render函数
        if (!this.$options.render) {
            // 获取template选项
            let template = this.$options.template;
            if (template) {
                // 解析template选项
                if (typeof template === 'string') {
                    // 标签id
                    if (template.charAt(0) === '#') {
                        template = document.querySelector(template).innerHTML
                    }
                } else if (template.nodeType) {
                    // 节点
                    template = template.innerHTML
                }
            } else if (el) {
                // 否则解析el选项
                template = document.querySelector(el).outerHTML;
            }

            // 获取到html模板字符串之后，执行编译过程
            if (template) {
                const render = compileToFunction(template);
                this.$options.render = render;
            }
        }

        return mountComponent(this, el);
    }


    /**
     * _render: 负责执行vm.$options.render 函数
     */
    _render() {
        // 获取组件render选项和父级虚拟DOM
        const {render, _parentVnode} = this.$options;

        // 给render函数绑定this上下文为Vue实例
        const vnode = render.apply(this);

        // 设置父级虚拟dom，为了保证render函数能够执行
        this.$vnode = _parentVnode

        return vnode;

    }

    /**
     * _update: 更新函数
     * @param vnode 新的vnode
     */
    _update(vnode) {
        // 获取老的VNode
        const preVNode = this._vnode;
        // 新的VNode
        this._vnode = vnode;
        // 设置ActiveInstance
        const restoreActiveInstance = setActiveInstance(this);

        if (!preVNode) {
            // 老的VNode不存在的话，则说明是首次渲染组件
            this.$el = this.__patch__(this.$el, vnode);
        } else {
            // 更新组件或者首次渲染子组件
            this.$el = this.__patch__(preVNode, vnode);
        }

        // 重置ActiveInstance
        restoreActiveInstance();
    }

    /**
     * $on 事件绑定
     * */
    $on(event, fn) {
        (this._events[event] || (this._events[event] = [])).push(fn);
        return this;
    }

    /**
     * $off 事件解绑
     * */
    $off(event) {
        const cbs = this._events[event];
        if (!cbs) {
            return this;
        }

        this._events[event] = null;
        return this;
    }

    /**
     * $once 事件绑定，只执行一次
     * */
    $once(event, fn) {
        function on () {
            this.$off(event);
            fn.apply(this, arguments);
        }
        on.fn = fn;
        this.$on(event, on);
        return this;
    }

    /**
     * $once 事件派发
     * */
    $emit(event, ...args) {
        let cbs = this._events[event];
        if(cbs) {
            cbs.forEach(cb => {
                cb.apply(this, args)
            })
        }
        return this;
    }
}
