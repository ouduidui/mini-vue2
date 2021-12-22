/**
 * 解析模版字符串，生成 AST 语法树
 * @param {*} template 模版字符串
 * @returns {AST} root ast 语法树
 */
export default function parse(template) {
  // 存放所有的未配对的开始标签的AST对象
  const stack = [];
  // 最终的AST语法树
  let root = null;

  let html = template;

  while (html.trim()) {
    // 过滤注释标签
    if (html.indexOf('<!--') === 0) {
      // 说明开始位置是一个注释标签
      html = html.slice(html.indexOf('-->') + 3);
    }

    // 匹配开始标签
    const startIdx = html.indexOf('<');
    if (startIdx === 0) {
      if (html.indexOf('</') === 0) {
        // 闭合标签
        parseEnd();
      } else {
        // 开始标签
        parseStartTag();
      }
    } else if (startIdx > 0) {
      // 文本内容
      if (stack.length) {
        processChars(html.slice(0, startIdx));
      }
      html = html.slice(startIdx);
    }
  }

  return root;

  /**
   * 处理结束标签
   */
  function parseEnd() {
    // 将结束标签从html字符中截掉
    html = html.slice(html.indexOf('>') + 1);
    // 处理栈顶元素
    processElement();
  }

  /**
   * 处理元素的闭合标签时会调用该方法
   * 进一步处理元素上的各个属性，将处理结果放到 data 属性上
   */
  function processElement() {
    // 弹出栈顶元素，进一步处理该元素
    const curEle = stack.pop();
    const stackLen = stack.length;
    // 进一步处理 AST 对象中的rawAttr对象 {dataName: attrValue, ...}
    const { tag, rawAttr } = curEle;
    // 处理结果都放到attr对象上，并删除 rawAttr 对象中相应的属性
    curEle.data = {};
    // 属性对象的key组成的数组
    const propertyArr = Object.keys(rawAttr);

    // 处理vue指令
    if (propertyArr.includes('v-model')) {
      // 处理v-model
      processVModel(curEle);
      // 删除
      delete rawAttr['v-model'];
    }
    if (propertyArr.find((item) => item.match(/^:(.*)/) || item.match(/^v-bind:(.*)/))) {
      // 处理v-bind指令
      const value = rawAttr[`v-bind:${RegExp.$1}`] || rawAttr[`:${RegExp.$1}`];
      processVBind(curEle, RegExp.$1, value);
      // 删除
      delete rawAttr[`v-bind:${RegExp.$1}`];
      delete rawAttr[`:${RegExp.$1}`];
    }
    if (propertyArr.find((item) => item.match(/^@(.*)/) || item.match(/^v-on:(.*)/))) {
      // 处理v-on指令
      const value = rawAttr[`v-on:${RegExp.$1}`] || rawAttr[`@${RegExp.$1}`];
      processVOn(curEle, RegExp.$1, value);
      // 删除
      delete rawAttr[`v-on:${RegExp.$1}`];
      delete rawAttr[`@${RegExp.$1}`];
    }

    // 节点处理完以后让其和父节点产生关系
    if (stackLen) {
      stack[stackLen - 1].children.push(curEle);
      curEle.parent = stack[stackLen - 1];
    }
  }

  /**
   * 处理 v-model 指令，将处理结果直接放到 curEle 对象身上
   * @param {*} curEle
   */
  function processVModel(curEle) {
    const { tag, rawAttr, data } = curEle;
    const { type, 'v-model': vModelVal } = rawAttr;

    if (tag === 'input') {
      data.vModel = { tag, type, value: vModelVal };
    } else if (tag === 'textarea' || tag === 'select') {
      data.vModel = { tag, value: vModelVal };
    }
  }

  /**
   * 处理 v-bind 指令
   * @param {*} curEle 当前正在处理的 AST 对象
   * @param {*} bindKey v-bind:key 中的 key
   * @param {*} bindVal v-bind:key = val 中的 val
   */
  function processVBind(curEle, bindKey, bindVal) {
    curEle.data.vBind = { [bindKey]: bindVal };
  }

  /**
   * 处理 v-on 指令
   * @param {*} curEle 当前被处理的 AST 对象
   * @param {*} vOnKey v-on:key 中的 key
   * @param {*} vOnVal v-on:key="val" 中的 val
   */
  function processVOn(curEle, vOnKey, vOnVal) {
    curEle.data.vOn = { [vOnKey]: vOnVal };
  }

  /**
   * 解析开始标签
   */
  function parseStartTag() {
    // 先找到开始标签的结束位置
    const end = html.indexOf('>');
    // 解析开始标签的内容
    const content = html.slice(1, end);
    // 截断html
    html = html.slice(end + 1);

    // 找到第一个空格位置
    const firstSpaceIdx = content.indexOf(' ');
    // 标签名和属性字符串
    let tagName = '',
      attrsStr = '';
    if (firstSpaceIdx === -1) {
      // 没有属性
      tagName = content;
    } else {
      tagName = content.slice(0, firstSpaceIdx);
      attrsStr = content.slice(firstSpaceIdx + 1);
    }

    // 得到属性数组
    const attrs = attrsStr ? attrsStr.split(' ') : [];
    // 解析属性数组
    const attrMap = parseAttrs(attrs);
    // 生成AST对象
    const elementAst = generateAST(tagName, attrMap);

    // 如果根节点不存在，说明当前节点为整个模板的第一个节点
    if (!root) {
      root = elementAst;
    }

    // 将ast对象push到栈中，当遇到结束标签的时候就将栈顶的ast对象pop出来
    stack.push(elementAst);

    // 自闭合标签
    if (isUnaryTag(tagName)) {
      processElement();
    }
  }

  /**
   * 解析属性数组，得到一个属性 和 值组成的 Map 对象
   * @param {*} attrs 属性数组，[id="app", xx="xx"]
   */
  function parseAttrs(attrs) {
    const attrMap = {};
    for (let i = 0, len = attrs.length; i < len; i++) {
      const attr = attrs[i];
      const [attrName, attrValue] = attr.split('=');
      attrMap[attrName] = attrValue.replace(/["|']/g, '');
    }
    return attrMap;
  }

  /**
   * 生成 AST 对象
   * @param {*} tagName 标签名
   * @param {*} attrMap 标签组成的属性 map 对象
   */
  function generateAST(tagName, attrMap) {
    return {
      // 元素节点
      type: 1,
      // 标签
      tag: tagName,
      // 原始属性
      rawAttr: attrMap,
      // 子节点
      children: []
    };
  }

  /**
   * 是否为自闭合标签，内置一些自闭合标签，为了处理简单
   */
  function isUnaryTag(tagName) {
    const unaryTag = ['input'];
    return unaryTag.includes(tagName);
  }

  /**
   * 处理文本
   * @param {string} text
   */
  function processChars(text) {
    // 去除空格的情况
    if (!text.trim()) return;

    // 构造文本节点的AST
    const textAst = {
      type: 3,
      text
    };

    // 表达式
    if (text.match(/{{(.*)}}/)) {
      textAst.expression = RegExp.$1.trim();
    }

    // 将AST放入栈顶标签内
    stack[stack.length - 1].children.push(textAst);
  }
}
