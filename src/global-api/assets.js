import {ASSET_TYPES} from "../shared/constants"

export function initAssetRegisters(Vue) {
    ASSET_TYPES.forEach(type => {
        // 声明静态的方法 Vue.component =  function(){}
        Vue[type] = function (id, definition) {
            if(type === 'component') {
                // name设置
                definition.name = definition.name || id;
                // 将传入的组件配置对象转换为组件构造函数
                definition = this.options._base.extend(definition);

                // 向全局的选项中加入全局组件配置对象
                this.options[type + 's'][id] = definition;

                return definition;
            }
        }
    })
}
