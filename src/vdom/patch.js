/**
 * 初始渲染和后续更新的入口
 * @param oldVnode 老的 VNode
 * @param vnode 新的 VNode
 * @returns VNode 的真实 DOM 节点
 */
export function patch(oldVnode, vnode) {
	// 新的节点不存在且旧节点存在：删除
	if (oldVnode && !vnode) return;

	let isInitialPatch = false; // 判断是否新增节点
	const insertedVnodeQueue = []; // 新增节点队列

	if (!oldVnode) {
		isInitialPatch = true;
		// 旧节点不存在且新节点存在：子组件首次渲染
		createElm(vnode, insertedVnodeQueue);
	} else {
		if (!oldVnode.nodeType) {
			// 比较新旧节点 diff算法
			patchVnode(oldVnode, vnode, insertedVnodeQueue);
		} else {
			// oldVnode为真实节点，初次加载
			// 父节点，为body
			const parent = oldVnode.parentNode;
			// 参考节点，即老节点的下一个节点，新节点要插入参考节点之前
			const referNode = oldVnode.nextSibling;
			// 创建元素
			createElm(vnode, insertedVnodeQueue, parent, referNode);

			// 销毁旧节点
			if (parent) {
				parent.removeChild(oldVnode);
			}
		}
	}
	invokeInsertHook(insertedVnodeQueue);
	return vnode.elm;
}

/**
 * 创建元素
 * @param {*} vnode
 * @param {*} insertedVnodeQueue
 * @param {*} parent 父节点，真实节点
 * @param {*} referNode 参考节点
 * @returns
 */
function createElm(vnode, insertedVnodeQueue, parent, referNode) {
	// 记录节点的父节点
	vnode.parent = parent;
	// 自定义组件
	if (createComponent(vnode, insertedVnodeQueue, parent, referNode)) return;

	const { data, children, text } = vnode;

	if (vnode.data) {
		invokeCreateHooks(vnode, insertedVnodeQueue);
	}
	if (text) {
		// 文本节点
		// 创建文本节点，并插入父节点内
		vnode.elm = createTextNode(vnode);
	} else {
		// 元素节点
		// 创建元素，在vnode上记录对应的dom节点
		vnode.elm = document.createElement(vnode.tag);
		// 设置属性
		setAttribute(data, vnode);
		// 递归遍历子节点
		for (let i = 0, len = children.length; i < len; i++) {
			createElm(children[i], insertedVnodeQueue, vnode.elm);
		}
	}

	if (parent) {
		const elm = vnode.elm;
		if (referNode) {
			parent.insertBefore(elm, referNode);
		} else {
			parent.appendChild(elm);
		}
	}
}

/**
 * 创建文本节点
 * @param {*} textVNode 文本节点的 VNode
 */
function createTextNode(textVNode) {
	let { text } = textVNode,
		textNode = null;

	if (text.expression) {
		// 表达式
		const value = textVNode.context[text.expression];
		textNode = document.createTextNode(typeof value === 'object' ? JSON.stringify(value) : value);
	} else {
		// 纯文本
		textNode = document.createTextNode(text.text);
	}

	return textNode;
}

/**
 * 给节点设置属性
 * @param {*} data 属性 Map 对象
 * @param {*} vnode
 */
function setAttribute(data, vnode) {
	// 遍历属性，如果是普通属性，直接设置，如果是指令，则特殊处理
	for (let name in data) {
		if (name === 'vModel') {
			// v-model 指令
			const { tag, value } = data.vModel;
			setVModel(tag, value, vnode);
		} else if (name === 'vBind') {
			// v-bind 指令
			setVBind(vnode);
		} else if (name === 'vOn') {
			// v-on 指令
			setVOn(vnode);
		} else {
			vnode.elm.setAttribute(name, data[name]);
		}
	}
}

/**
 * v-model 的原理
 * @param {*} tag 节点的标签名
 * @param {*} value 属性值
 * @param {*} vnode 节点
 */
function setVModel(tag, value, vnode) {
	const { context: vm, elm } = vnode;
	if (tag === 'select') {
		Promise.resolve().then(() => {
			// 利用promise延迟设置，此时option元素还没创建
			elm.value = vm[value];
		});
		elm.addEventListener('change', function () {
			vm[value] = elm.value;
		});
	} else if (tag === 'input') {
		if (vnode.elm.type === 'checkbox') {
			elm.checked = vm[value];
			elm.addEventListener('change', function () {
				vm[value] = elm.checked;
			});
		} else {
			elm.value = vm[value];
			elm.addEventListener('input', function () {
				vm[value] = elm.value;
			});
			elm.addEventListener('change', function () {
				vm[value] = elm.value;
			});
		}
	}
}

/**
 * v-bind 原理
 * @param {*} vnode
 */
function setVBind(vnode) {
	const {
		data: { vBind },
		elm,
		context: vm
	} = vnode;
	for (let attrName in vBind) {
		elm.setAttribute(attrName, vm[vBind[attrName]]);
		elm.removeAttribute(`v-bind:${attrName}`);
		elm.removeAttribute(`:${attrName}`);
	}
}

/**
 * v-on 原理
 * @param {*} vnode
 */
function setVOn(vnode) {
	const {
		data: { vOn },
		elm,
		context: vm
	} = vnode;
	for (let eventName in vOn) {
		elm.addEventListener(eventName, function (...args) {
			vm.$options.methods[vOn[eventName]].apply(vm, args);
		});
	}
}

/**
 * 对比新老节点，找出其中的不同，然后更新老节点
 * @param {*} oldVnode 老节点的 vnode
 * @param {*} vnode 新节点的 vnode
 * @param insertedVnodeQueue
 */
function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
	// 如果两个虚拟dom一样，无需比较更新
	if (oldVnode === vnode) return;

	// 获取真实DOM
	vnode.elm = oldVnode.elm;

	// 钩子调用
	let i;
	const data = vnode.data;
	if (data && !!(i = data.hook) && !!(i = i.prepatch)) {
		i(oldVnode, vnode);
	}

	// 获取新老节点的孩子节点
	const ch = vnode.children;
	const oldCh = oldVnode.children;

	if (!vnode.text) {
		// 如果新节点没有文本节点
		if (ch && oldCh) {
			// 说明新老节点都有孩子节点
			// 比较孩子节点 diff
			updateChildren(ch, oldCh, insertedVnodeQueue);
		} else if (ch) {
			// 说明新节点有孩子节点，旧节点没有孩子节点
			// 增加孩子节点
		} else {
			// 说明新节点没有孩子节点，旧节点有孩子节点
			// 删除孩子节点
		}
	} else if (oldVnode.text !== vnode.text) {
		// 新节点有文本节点且跟旧节点不同
		if (vnode.text.expression) {
			// 说明存在表达式
			// 获取表达式的新值
			let value = vnode.context[vnode.text.expression];
			value = typeof value === 'object' ? JSON.stringify(value) : value;
			// 更新值
			try {
				const oldValue = oldVnode.elm.textConent;
				if (value !== oldValue) {
					oldVnode.elm.textContent = value;
				}
			} catch (e) {
				console.log(e);
			}
		}
	}
}

/**
 * diff，比对孩子节点，找出不同点，然后将不同点更新到老节点上
 * @param {*} newCh 新 vnode 的所有孩子节点
 * @param {*} oldCh 老 vnode 的所有孩子节点
 * @param insertedVnodeQueue
 */
function updateChildren(newCh, oldCh, insertedVnodeQueue) {
	// 设置首位4个游标
	let oldStartIdx = 0;
	let newStartIdx = 0;
	let oldEndIdx = oldCh.length - 1;
	let newEndIdx = newCh.length - 1;
	// 设置对应节点
	let oldStartVnode = oldCh[0];
	let newStartVnode = newCh[0];
	let oldEndVnode = oldCh[oldEndIdx];
	let newEndVnode = newCh[newEndIdx];

	let oldKeyToIdx, idxInOld, vnodeToMove;

	// 循环结束条件：新旧节点的头尾游标都重合
	while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
		if (!oldStartVnode) {
			// 当oldStartVnode为undefined的时候，oldStartVnode右移
			oldStartVnode = oldCh[++oldStartIdx];
		} else if (!oldEndVnode) {
			// 当oldEndVnode为undefined的时候，oldEndVnode左移
			oldEndVnode = oldCh[--oldEndIdx];
		} else if (sameVnode(oldStartVnode, newStartVnode)) {
			// 当oldStartVnode与newStartVnode节点相同，对比节点
			patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
			// 更新对应游标
			oldStartVnode = oldCh[++oldStartIdx];
			newStartVnode = newCh[++newStartIdx];
		} else if (sameVnode(oldEndVnode, newEndVnode)) {
			// 当oldEndVnode与newEndVnode节点相同，对比节点
			patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
			// 更新对应游标
			oldEndVnode = oldCh[--oldEndIdx];
			newEndVnode = newCh[--newEndIdx];
		} else if (sameVnode(oldStartVnode, newEndVnode)) {
			// 当oldStartVnode与newEndVnode节点相同，对比节点
			patch(oldStartVnode, newStartVnode);
			// 移动节点位置
			oldStartVnode.elm.parentNode.insertBefore(oldStartVnode.elm, oldCh[newEndIdx].elm.nextSibling);
			// 更新对应游标
			oldStartVnode = oldCh[++oldStartIdx];
			newEndVnode = newCh[--newEndIdx];
		} else if (sameVnode(oldEndVnode, newStartVnode)) {
			// 当oldEndVnode与newStartVnode节点相同，对比节点
			patch(oldEndVnode, newStartVnode);
			// 移动节点位置
			oldEndVnode.elm.parentNode.insertBefore(oldEndVnode.elm, oldCh[newStartIdx].elm);
			// 更新对应游标
			oldEndVnode = oldCh[--oldEndIdx];
			newStartVnode = newCh[++newStartIdx];
		} else {
			// 暴力解法
			// 遍历剩余的旧孩子节点，将有key值的生成index表 <{key: i}>
			if (!oldKeyToIdx) {
				oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
			}

			// 如果newStartVnode存在key，就进行匹配index值；如果没有key值，遍历剩余的旧孩子节点，一一与newStartVnode匹配，相同节点的返回index
			idxInOld = newStartVnode.key
				? oldKeyToIdx[newStartVnode.key]
				: findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);

			if (!idxInOld) {
				// 如果匹配不到index，则创建新节点
				createElm(newStartVnode, insertedVnodeQueue, newStartVnode.elm.parentNode, oldCh[newStartIdx].elm);
			} else {
				// 获取对应的旧孩子节点
				vnodeToMove = oldCh[idxInOld];
				if (sameVnode(vnodeToMove, newStartVnode)) {
					patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue);
					// 因为idxInOld是处于oldStartIdx和oldEndIdx之间，因此只能将其设置为undefined，而不是移动两个游标
					oldCh[idxInOld] = undefined;
					// 移动节点
					oldEndVnode.elm.parentNode.insertBefore(vnodeToMove.elm, oldCh[newStartIdx].elm);
				} else {
					// 如果key相同但节点不同，就创建一个新的节点
					createElm(newStartVnode, insertedVnodeQueue, newStartVnode.elm.parentNode, oldCh[newStartIdx].elm);
				}
			}
			// 移动新节点的左边游标
			newStartVnode = newCh[++newStartIdx];
		}
	}

	if (oldStartIdx > oldEndIdx) {
		// 当旧节点左游标已经超过右游标的时候，新增剩余的新的孩子节点
		for (; newStartIdx <= newEndIdx; ++newStartIdx) {
			createElm(newCh[newStartIdx], insertedVnodeQueue, newCh[newStartIdx].elm.parentNode, oldCh[newStartIdx].elm);
		}
	} else if (newStartIdx > newEndIdx) {
		// 当新节点左游标已经超过右游标的时候，删除剩余的旧的孩子节点
		for (; oldStartIdx <= oldEndIdx; ++oldStartIdx) {
			const ch = oldCh[oldStartIdx];
			if (ch) {
				ch.parentNode.removeChild(ch);
			}
		}
	}
}

/**
 * 判断两个节点是否相同
 */
function sameVnode(a, b) {
	return a.key === b.key && a.tag === b.tag;
}

/**
 * 生成旧孩子节点的映射表
 */
function createKeyToOldIdx(children, beginIdx, endIdx) {
	let i, key;
	const map = {};
	for (i = beginIdx; i <= endIdx; ++i) {
		key = children[i].key;
		if (key) map[key] = i;
	}
	return map;
}

/**
 * 遍历匹配找到相同节点下标
 */
function findIdxInOld(node, oldCh, start, end) {
	for (let i = start; i < end; i++) {
		const c = oldCh[i];
		if (c && sameVnode(node, c)) return i;
	}
}

/**
 * 自定义组件创建过程
 * @param {*} vnode
 * @param insertedVnodeQueue
 * @param {*} parent 父节点，真实节点
 * @param {*} referNode 参考节点
 */
function createComponent(vnode, insertedVnodeQueue, parent, referNode) {
	let i = vnode.data;
	if (i) {
		// 获取组件init钩子
		if (!!(i = i.hook) && !!(i = i.init)) {
			// 组件实例化和挂载，执行init方法
			i(vnode);
		}
		if (vnode.componentInstance) {
			insertedVnodeQueue.push(vnode);
			// 插入到dom节点
			vnode.elm = vnode.componentInstance._vnode.elm;
			parent.insertBefore(vnode.elm, referNode);
			return true;
		}
	}
}

/**
 * 判断是否为组件，添加到insertedVnodeQueue
 * */
function invokeCreateHooks(vnode, insertedVnodeQueue) {
	let i = vnode.data.hook;
	if (i) {
		if (i.insert) insertedVnodeQueue.push(vnode);
	}
}

/**
 * 调用组件insert钩子
 * */
function invokeInsertHook(queue) {
	for (let i = 0; i < queue.length; ++i) {
		queue[i].data.hook.insert(queue[i]);
	}
}
