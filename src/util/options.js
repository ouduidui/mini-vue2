// 合并选项
export function mergeOptions(parent, child) {
	if (!child) return parent;

	if (typeof child === 'function') {
		child = child.options;
	}

	const options = {};
	let key;
	for (key in parent) {
		mergeField(key);
	}
	for (key in child) {
		if (!hasOwn(parent, key)) {
			mergeField(key);
		}
	}

	function mergeField(key) {
		const strat = defaultStrat;
		options[key] = strat(parent[key], child[key]);
	}
	return options;
}

const defaultStrat = function (parentVal = undefined, childVal) {
	return childVal === undefined ? parentVal : childVal;
};

function hasOwn(obj, key) {
	return Object.prototype.hasOwnProperty.call(obj, key);
}
