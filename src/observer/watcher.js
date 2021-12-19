import {popTarget, pushTarget} from "./dep";
import {queueWatcher} from "./scheduler";

let uid = 0

/**
 * Watcher: 监听器 —— 负责依赖更新
 * @param vm: vue实例
 * @param expOrFn: 更新函数
 * @param cb: 回调函数
 */
export class Watcher {
    constructor(vm, expOrFn, cb) {
        this.id = ++uid
        this.vm = vm;
        this.cb = cb;
        this.depIds = new Set();
        this.deps = [];

        if(typeof expOrFn === 'function'){
            this.getter = expOrFn;
        }else {
            // 这种是$watch传递进来的表达式，它们需要解析为函数
            this.getter = parsePath(expOrFn)
        }

        // 触发依赖收集
        this.value = this.get();
    }

    get() {
        let value;
        // 将this赋值给Dep的target属性
        pushTarget(this);
        // 触发收集
        value = this.getter.call(this.vm, this.vm);
        // 收集完成后，将target设置回null
        popTarget();

        return value;
    }

    update() {
        // this.run();
        // 异步执行更新函数
        queueWatcher(this);
    }

    run() {
        // 调用watcher的get方法，获取更新函数updateComponent方法
        const value = this.get()
        if(value !== this.value) {
            const oldValue = this.value;
            this.value = value;
            this.cb.call(this.vm, value, oldValue);
        }
    }

    addDep(dep){
        const id = dep.id;
        if (!this.depIds.has(id)) {
            // 添加当前watcher和传入dep的关系
            this.depIds.add(id);
            this.deps.push(dep);
            // 反向给dep添加当前watcher关系
            dep.addSub(this);
        }
    }

    // 全部遍历依赖收集
    depend(){
        let i = this.deps.length
        while (i--) {
            this.deps[i].depend()
        }
    }
}

function parsePath (path) {
    const segments = path.split('.')
    return function (obj) {
        for (let i = 0; i < segments.length; i++) {
            if (!obj) return
            obj = obj[segments[i]]
        }
        return obj
    }
}
