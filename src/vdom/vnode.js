export class VNode {
	constructor(tag, data, children, text, elm, context, componentOptions) {
		this.tag = tag; // 标签
		this.data = data; // 属性
		this.children = children; // 孩子节点
		this.text = text; // 文本内容
		this.elm = elm; // 真实dom
		this.context = context; // 执行上下文
		this.parent = undefined;
		this.key = data && data.key;
		this.componentOptions = componentOptions;
		this.componentInstance = undefined;
	}
}

/**
 * createEmptyVNode: 创建空的VNode
 * @return VNode
 */
export function createEmptyVNode() {
	return new VNode();
}

/**
 * createTextNode: 创建文本VNode
 * @return VNode
 */
export function createTextNode(val) {
	return new VNode(null, null, null, val, null, this);
}
