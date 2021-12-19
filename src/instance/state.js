import {observe} from "../observer/index";
import {defineReactive} from "../observer/index";
import {Dep} from "../observer/dep";
import {Watcher} from "../observer/watcher";

const sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: function(){},
    set: function(){}
}

/**
 * Vue: 包含el、data、methods等等
 * @param vm<Object>: Vue实例
 */
export function initState(vm) {
    // 获取options
    const opts = vm.$options;

    // 初始化顺序 props -> methods -> data -> computed -> watch
    if (opts.props) initProps(vm, opts.props)
    if (opts.methods) initMethods(vm, opts.methods)
    if (opts.data) {
        initData(vm)
    } else {
        observe(vm._data = {})  // 没有data数据的话，默认为{}
    }

    if (opts.computed) {
        initComputed(vm, opts.computed);  // 初始化computed
    }

    if (opts.watch) {
        initWatch(vm, opts.watch)  // 初始化watch
    }
}

/**
 * initData: 初始化data数据
 * @param vm<Object>: Vue实例
 */
function initData(vm) {
    let data = vm.$options.data;

    // 如果data是函数
    if (typeof data === 'function') {
        const res = data.call(vm, vm);
        data = typeof res !== 'object' || res === null ? {} : res;
    }

    vm._data = data;

    // 数据代理
    for(const key in data) {
        proxy(vm, '_data', key);
    }

    // 响应式处理
    observe(vm._data);
}

/**
 * proxy: 数据代理
 * @param vm<Object>: Vue实例
 * @param sourceKey
 * @param key
 */
function proxy(vm, sourceKey, key) {
    Object.defineProperty(vm, key, {
        get() {
            return vm[sourceKey][key]
        },
        set(newVal) {
            vm[sourceKey][key] = newVal;
        }
    })
}

/**
 * initComputed: 初始化computed
 * @param vm<Object>: Vue实例
 * @param computed<Object>
 */
function initComputed(vm, computed) {
    const watchers = vm._computedWatchers = Object.create(null);

    // 遍历computed
    for (const key in computed) {
        const userDef = computed[key]
        // 获取getter
        const getter = typeof userDef === 'function' ? userDef : userDef.get;
        // 建立Watcher实例
        watchers[key] = new Watcher(vm, getter, () =>{})

        if (!(key in vm)) {  // 避免重名
            sharedPropertyDefinition.get = function () {
                const watcher = this._computedWatchers && this._computedWatchers[key];
                if(watcher) {
                    if(Dep.target) {
                        watcher.depend();
                    }
                    return watcher.value;
                }
            };

            Object.defineProperty(vm, key, sharedPropertyDefinition)
        }
    }
}

/**
 * initWatch: 初始化watch
 * @param vm<Object>: Vue实例
 * @param watch<Object>
 */
function initWatch(vm, watch) {
    for (const key in watch) {
        const handler = watch[key]
        if (Array.isArray(handler)) {
            for (let i = 0; i < handler.length; i++) {
                createWatcher(vm, key, handler[i])
            }
        } else {
            createWatcher(vm, key, handler)
        }
    }
}

/**
 * createWatcher: 创建监听器
 * @param vm<Object>: Vue实例
 * @param expOrFn<String>
 * @param handler<Function>
 */
function createWatcher(vm, expOrFn, handler) {
    if (typeof handler === 'string') {
        handler = vm[handler]
    }
    return vm.$watch(expOrFn, handler)
}

/**
 * initWatch: 初始化props
 * @param vm<Object>: Vue实例
 * @param propsOptions<Object>
 */
function initProps(vm, propsOptions) {
    const propsData = vm.$options.propsData || {};
    const props = vm._props = {};
    vm.$options._propKeys = [];

    for(const key in propsOptions) {
        vm.$options._propKeys.push(key);
        const prop = propsOptions[key];
        const value = propsData[key] || prop.default;
        defineReactive(props, key, value);
        if(!(key in vm)){
            proxy(vm,'_props', key);
        }
    }
}

/**
 * initWatch: 初始化methods
 * @param vm<Object>: Vue实例
 * @param methods<Object>
 */
function initMethods(vm, methods) {
    for(const key in methods) {
        vm[key] = methods[key].bind(vm)
    }
}
