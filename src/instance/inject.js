/**
 * initLifecycle: 初始化provide
 * @param vm: 组件实例
 */
import { defineReactive } from '../observer/index';

export function initProvide(vm) {
	const provide = vm.$options.provide;
	if (provide) {
		vm._provided = typeof provide === 'function' ? provide.call(vm) : provide;
	}
}

/**
 * initLifecycle: 初始化inject
 * @param vm: 组件实例
 */
export function initInjections(vm) {
	const result = resolveInject(vm.$options.inject, vm);
	// 响应式处理
	if (result) {
		Object.keys(result).forEach((key) => {
			defineReactive(vm, key, result[key]);
		});
	}
}

function resolveInject(inject, vm) {
	if (inject) {
		const result = Object.create(null);

		inject.forEach((provideKey) => {
			// 递归查找
			let source = vm;
			while (source) {
				if (source._provided && Object.keys(source._provided).includes(provideKey)) {
					result[provideKey] = source._provided[provideKey];
					break;
				}
				source = source.$parent;
			}
		});

		return result;
	}
}
