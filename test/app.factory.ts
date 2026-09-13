import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import { setupApp } from '../src/setup';
import { createDataSource } from '../ormconfig';
import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';
// 方法一：const app = new AppFactory().init() init -> return app实例
// 方法二：OOP get instance() -> app ,private app, AppFactory constructor的部分进行初始化
//  const appFactory = AppFactory.init() -> const app = appFactory.instance
// 读取环境变量
dotenv.config({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.NODE_ENV || 'development'}`,
  ),
});
export class AppFactory {
  connection: DataSource;
  constructor(private app: INestApplication) {}

  get instance() {
    return this.app;
  }

  // 初始化App实例
  static async init() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    setupApp(app);
    const port = 0;
    await app.listen(port); // 0 表示让操作系统随机分配一个空闲端口，永不冲突;
    await app.init();
    return new AppFactory(app);
  }

  // 初始化db数据库
  async initDB() {
    // ==========【新增：E2E测试环境：销毁重建 testdb1 数据库】开始 ==========
    const env = process.env.NODE_ENV;
    const dbName = process.env.DB_DATABASE;

    // ⭐保护：仅 test 环境允许执行 DROP DATABASE，开发/生产直接跳过，防止误删业务库
    if (env === 'test' && dbName === 'testdb1') {
      console.log(
        `[AppFactory initDB] E2E测试模式：检测目标数据库 ${dbName}，存在则删除重建`,
      );

      const dbHost = process.env.DB_HOST || '127.0.0.1';
      const dbPort = Number(process.env.DB_PORT || 3306);
      const dbUser = process.env.DB_USERNAME || 'root';
      const dbPwd = process.env.DB_PASSWORD || '';

      // 建立临时管理连接：连接mysql系统库，而不是业务testdb1
      let tempConn: mysql.Connection | null = null;
      try {
        tempConn = await mysql.createConnection({
          host: dbHost,
          port: dbPort,
          user: dbUser,
          password: dbPwd,
          database: 'mysql', // 固定连接mysql系统库，不需要业务库存在
        });

        // 如果数据库存在，则DROP
        await tempConn.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
        // console.log(`[AppFactory initDB] 已删除旧数据库：${dbName}`);

        // 重新创建空数据库
        await tempConn.query(
          `CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
        );
        // console.log(`[AppFactory initDB] 重新创建数据库完成：${dbName}`);
      } catch (err) {
        console.error(`❌【E2E重建数据库失败】`, err);
        throw err;
      } finally {
        if (tempConn) {
          await tempConn.end();
        }
      }
    } else {
      // console.log(`[AppFactory initDB] 当前环境 ${env}，不是test/testdb1，跳过drop重建数据库逻辑`);
    }
    // ==========【新增代码结束】==========

    // ✅【关键】调用工厂函数，实例化DataSource，赋值this.connection
    this.connection = createDataSource();
    if (!this.connection.isInitialized) {
      await this.connection.initialize();
    }
    // 测试的基础的字典数据写入到数据库中
    // Method1: this.connection.runMigrations()
    // Method2: 写入SQL语句
    const queryRunner = this.connection.createQueryRunner();
    //// ✅已经手动迁移，无需初始化数据库
    try {
      // ========== 第一份：init.sql 建表 ==========
      // const initSqlContent = readFileSync(join(__dirname, '../src/migrations/init.sql'))
      //   .toString()
      //   .replace(/\r?\n/g, '');
      // const initSqlArr = initSqlContent.split(';');
      // for (const rawSql of initSqlArr) {
      //   const realSql = rawSql.trim();
      //   if (!realSql) continue;
      //   await queryRunner.query(realSql);
      // }
      const sqlContent = readFileSync(
        join(__dirname, '../src/migrations/seed.sql'),
      )
        .toString()
        .replace(/\r?\n/g, '');
      const sqlArr = sqlContent.split(';');
      for (const rawSql of sqlArr) {
        const realSql = rawSql.trim();
        if (!realSql) continue;
        console.log('🚀 执行 seed SQL:', realSql); // 👈 一定要加日志！
        await queryRunner.query(realSql);
      }
    } catch (err: any) {
      console.error('❌ seed.sql 执行失败:', err.message); // 👈 一定要捕获报错！
      throw err;
    } finally {
      await queryRunner.release(); // ✅必须释放连接
    }
  }

  // 清除数据库数据 -> 避免测试数据污染
  async cleanup() {
    const queryRunner = this.connection.createQueryRunner();
    // ✅【白名单：只允许清空这些业务测试表，基础字典表不在列表内，绝不触碰】
    const businessTestTables: string[] = [
      'user',
      'logs',
      'profile',
      'users_roles',
    ];

    try {
      // 临时关闭外键校验，解决delete外键冲突
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0;');
      // const entities = this.connection.entityMetadatas;
      // for (const entity of entities) {
      //   const repository = this.connection.getRepository(entity.name);
      //   await repository.query(`DELETE FROM ${entity.tableName}`);
      // }

      for (const tableName of businessTestTables) {
        // ✅ 判空：跳过 undefined、null 和空字符串
        if (!tableName || tableName.trim() === '') {
          continue;
        }
        // ✅ 先检查表是否存在，避免 Table doesn't exist 报错
        const tableExists = await queryRunner.hasTable(tableName);
        if (!tableExists) {
          console.warn(`⚠️ 表 ${tableName} 不存在，跳过 cleanup`);
          continue;
        }
        // 使用反引号包裹表名，防止关键字、特殊字符报错
        await queryRunner.query(`DELETE FROM \`${tableName}\`;`);
        // 重置自增主键，下次测试id从1开始，测试结果更稳定（可选，课程项目推荐加上）
        await queryRunner.query(
          `ALTER TABLE \`${tableName}\` AUTO_INCREMENT = 1;`,
        );
      }
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1;');

      // console.log(
      //   '[AppFactory cleanup] ✅业务测试表已清空：',
      //   businessTestTables.join(','),
      // );
      // console.log(
      //   '[AppFactory cleanup] ✅基础字典表(menus,roles,menus_roles)保留，未做任何操作',
      // );
    } catch (err) {
      console.error('[AppFactory cleanup] ❌清空业务表异常：', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // 断开与数据库的连接 -> 避免后序数据库连接过多而无法连接
  async destroy() {
    if (this.connection) {
      await this.connection.destroy();
    }
    await this.app?.close();
  }
}
