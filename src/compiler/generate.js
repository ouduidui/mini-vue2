/**
 * 从 ast 生成渲染函数
 * @param {*} ast ast 语法树
 * @returns 渲染函数
 */
export default function generate(ast) {
	// 渲染函数字符串形式
	const renderStr = genElement(ast);
	// 通过 new Function 将字符串形式的函数变成可执行函数，并用 with 为渲染函数扩展作用域链
	return new Function(`with(this) { return ${renderStr} }`);
}

/**
 * 解析 ast 生成 渲染函数
 * @param {*} ast 语法树
 * @returns {string} 渲染函数的字符串形式
 */
function genElement(ast) {
	const { tag, rawAttr, data } = ast;

	// 生成属性Map对象
	const datas = { ...rawAttr, ...data };

	// 处理子节点
	const children = genChildren(ast);

	// 生成 VNode 的可执行方法
	return `_c(this, '${tag}', ${JSON.stringify(datas)}, [${children}])`;
}

/**
 * 处理 ast 节点的子节点，将子节点变成渲染函数
 * @param {*} ast 节点的 ast 对象
 * @returns [childNodeRender1, ....]
 */
function genChildren(ast) {
	const res = [],
		{ children } = ast;

	// 遍历所有子节点
	for (let i = 0, len = children.length; i < len; i++) {
		const child = children[i];
		if (child.type === 3) {
			// 文本节点
			res.push(`_v(${JSON.stringify(child)})`);
		} else if (child.type === 1) {
			// 元素节点
			res.push(genElement(child));
		}
	}

	return res;
}
