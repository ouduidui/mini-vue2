// 存放回调函数
const callbacks = [];
// 判断是否在执行异步
let pending = false;

// 将callbacks数组中所有回调函数都执行一遍
function flushCallbacks() {
	// 状态设为false
	pending = false;
	// 浅复制一份callbacks，然后将其清空
	const copies = callbacks.slice(0);
	callbacks.length = 0;
	// 遍历调用
	for (let i = 0; i < copies.length; i++) {
		copies[i]();
	}
}

let timerFunc;
// 初始timerFunc
if (typeof Promise !== 'undefined') {
	// 优先选择Promise
	const p = Promise.resolve();
	timerFunc = () => {
		p.then(flushCallbacks);
	};
} else if (typeof MutationObserver !== 'undefined') {
	// MutationObserver
	let counter = 1;
	const observer = new MutationObserver(flushCallbacks);
	const textNode = document.createTextNode(String(counter));
	observer.observe(textNode, {
		characterData: true
	});
	timerFunc = () => {
		counter = (counter + 1) % 2;
		textNode.data = String(counter);
	};
} else if (typeof setImmediate !== 'undefined') {
	// setImmediate
	timerFunc = () => {
		setImmediate(flushCallbacks);
	};
} else {
	// setTimeout
	timerFunc = () => {
		setTimeout(flushCallbacks, 0);
	};
}

export function nextTick(cb, ctx) {
	// 将回调函数放入数组
	callbacks.push(() => {
		if (cb) {
			// 执行回调函数
			cb.call(ctx);
		}
	});

	if (!pending) {
		pending = true;
		// 异步执行callbacks任务
		timerFunc();
	}
}
