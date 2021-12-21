import { Vue } from './instance/index';
import { initGlobalAPI } from './global-api/index';

// 初始化全局API （component、filter、directive、use、mixin、util、extend...）
initGlobalAPI(Vue);

export default Vue;
