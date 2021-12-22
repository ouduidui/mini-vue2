import { Dep } from './dep';

/**
 * observe: 将整个对象设置为响应式数据
 * @param value<Object>: 对象
 */
export function observe(value) {
  // 判断响应式数据是否为对象
  if (typeof value !== 'object' || value === null) {
    return;
  }

  // 响应式处理
  return new Observer(value);
}

/**
 * Observer: 根据传入value的类型做响应的响应式处理
 * @param value<Object>: 对象
 */
class Observer {
  constructor(value) {
    this.value = value;
    // 创建Dep实例
    this.dep = new Dep();

    // 在每一个value设置一个__ob__属性，值为对应的Observer实例
    Object.defineProperty(value, '__ob__', { value: this });

    // 判断类型
    if (Array.isArray(value)) {
      // 数组
      // 覆盖原生方法
      copyAugment(value);
      // 响应式处理
      this.observeArray(value);
    } else {
      // 对象
      // 响应式处理
      this.walk(value);
    }
  }

  /**
   * observeArray: 遍历数组进行响应式处理
   * @param items<Array>: 数组
   */
  observeArray(items) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i]);
    }
  }

  /**
   * Observer: 根据传入value的类型做响应的响应式处理
   * @param obj<Object>: 对象
   */
  walk(obj) {
    // 遍历所有属性，执行defineReactive
    Object.keys(obj).forEach((key) => {
      defineReactive(obj, key, obj[key]);
    });
  }
}

/**
 * copyAugment: 复制一份数组原型，修改原型方法
 * @param value<Array>: 数组
 */
function copyAugment(value) {
  const ob = value.__ob__;
  // 创建新的数组原型
  const original = Array.prototype;
  // 以Array.prototype为原型创新一个新对象
  const arrayProto = Object.create(original);
  // 涉及到数据改动的七个数组方法
  const methodsToPatch = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

  methodsToPatch.forEach((method) => {
    arrayProto[method] = function (...args) {
      // 原始操作
      original[method].apply(this, args);
      // 如果是插入动作，对新插入的元素进行响应式处理
      let inserted;
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break;
        case 'splice':
          inserted = args.slice(2);
          break;
      }
      // 若有新增则做响应处理
      if (inserted) {
        ob.observeArray(inserted);
      }

      // 通知更新
      ob.dep.notify();
    };
  });

  // 覆盖原型
  value.__proto__ = arrayProto;
}

/**
 * defineReactive : 将对象中某一个属性设置为响应式数据
 * @param obj<Object>: 对象
 * @param key<any>: key名
 * @param val<any>: 初始值
 */
export function defineReactive(obj, key, val) {
  // 递归处理：如果val是对象，继续做响应式处理
  let childOb = observe(val);

  const dep = new Dep();

  Object.defineProperty(obj, key, {
    get() {
      // 依赖收集
      // Dep.target && dep.addDep(Dep.target);
      dep.depend();

      // 若存在子observer，则依赖也追加到子ob
      if (childOb) {
        childOb.dep.depend();
        if (Array.isArray(val)) {
          dependArray(val); // 数组需特殊处理
        }
      }
      return val;
    },
    set(newVal) {
      if (newVal !== val) {
        // 此时val存在obj的闭包里面
        observe(newVal); // 如果newVal是对象，再次做响应式处理
        val = newVal;
        // 通知更新
        dep.notify();
      }
    }
  });
}

/**
 * dependArray : 对数组每一项进行依赖收集
 * @param value<Array>: 数组
 */
function dependArray(value) {
  value.forEach((v) => {
    // 数组每一项都需要依赖收集
    v && v.__ob__ && v.__ob__.dep.depend();
    if (Array.isArray(v)) {
      dependArray(v);
    }
  });
}

/**
 * $set: 设置响应式数据
 * @param target
 * @param key
 * @param val
 */
export function set(target, key, val) {
  const ob = target.__ob__;

  if (!ob) {
    target[key] = val;
    return val;
  }

  // 响应式处理
  defineReactive(ob.value, key, val);
  // 依赖收集
  ob.dep.notify();
  return val;
}

/**
 * $set: 删除响应式数据
 * @param target
 * @param key
 */
export function del(target, key) {
  const ob = target.__ob__;
  // 删除对应的值
  delete target[key];

  if (!ob) {
    return;
  }
  // 通知更新
  ob.dep.notify();
}
