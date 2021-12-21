import { createEmptyVNode, VNode } from './vnode';
import { createComponent } from './create-component';

/**
 * createElement: 将传入的组件配置转换为VNode
 * @param context<Object>: 执行上下文
 * @param tag<string>: 标签
 * @param data<Object>: 属性
 * @param children<Object>: 孩子节点
 */
export function createElement(context, tag, data, children) {
	// 如果没有标签，返回空的Vnode
	if (!tag) return createEmptyVNode();

	let vnode;
	let Ctor; // 构造函数
	if (isReservedTag(tag)) {
		// 保留标签
		vnode = new VNode(tag, data, children, undefined, undefined, context);
	} else if (!!(Ctor = context.$options.components[tag])) {
		vnode = createComponent(Ctor, data, context, children, tag);
	}
	return vnode;
}

/**
 * isReservedTag: 判断是否为保留标签
 * @param tag<string>: 标签
 */
export function isReservedTag(tag) {
	return isHTMLTag(tag) || isSVG(tag);
}

export const isHTMLTag = makeMap(
	'html,body,base,head,link,meta,style,title,' +
		'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
		'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
		'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
		's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
		'embed,object,param,source,canvas,script,noscript,del,ins,' +
		'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
		'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
		'output,progress,select,textarea,' +
		'details,dialog,menu,menuitem,summary,' +
		'content,element,shadow,template,blockquote,iframe,tfoot'
);

export const isSVG = makeMap(
	'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
		'foreignobject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
		'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
	true
);

function makeMap(str, expectsLowerCase) {
	const map = Object.create(null);
	const list = str.split(',');
	for (let i = 0; i < list.length; i++) {
		map[list[i]] = true;
	}
	return expectsLowerCase
		? function (val) {
				return map[val.toLowerCase()];
		  }
		: function (val) {
				return map[val];
		  };
}
