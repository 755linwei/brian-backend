//单独迁移入口文件 
// src/data-source-cli.ts
import { createDataSource } from './ormconfig';
// typeorm cli执行时调用，生成数据源
export default createDataSource();
