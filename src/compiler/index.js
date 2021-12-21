import parse from './parse';
import generate from './generate';

/**
 * 解析模版字符串，得到 AST 语法树
 * 将 AST 语法树生成渲染函数
 * @param { String } template 模版字符串
 * @returns 渲染函数
 */
export default function compileToFunction(template) {
	// 解析模板，生成AST
	const ast = parse(template);
	// 将AST生成渲染函数
	const render = generate(ast);

	return render;
}
