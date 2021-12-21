let uid = 0;

/**
 * Dep: 负责通知监听器更新
 */
export class Dep {
	static target = null;

	constructor() {
		this.id = uid++; // Dep id
		this.subs = []; // 存放Watcher
	}

	/**
	 * addDep: 添加新的监听器
	 * @param sub
	 */
	addSub(sub) {
		this.subs.push(sub);
	}

	/**
	 * notify: 通知更新
	 */
	notify() {
		this.subs.forEach((dep) => dep.update());
	}

	/**
	 * depend: watcher实例中添加dep
	 */
	depend() {
		if (Dep.target) {
			Dep.target.addDep(this);
		}
	}
}

const targetStack = [];

/**
 * pushTarget: 设置Dep.target
 * @param target: Watcher实例
 */
export function pushTarget(target) {
	targetStack.push(target);
	Dep.target = target;
}

/**
 * popTarget: 重置Dep.target
 */
export function popTarget() {
	targetStack.pop();
	Dep.target = targetStack[targetStack.length - 1];
}
