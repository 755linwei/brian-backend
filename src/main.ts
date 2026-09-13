// Copyright (c) 2022 toimc<admin@wayearn.com>
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import 'module-alias/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './setup';
// import { AllExceptionFilter } from './filters/all-exception.filter';
import { getServerConfig } from '../ormconfig';

// ========== 【新增】Node进程全局异常捕获，打印unhandledRejection，解决docker日志空白+ECONNRESET ==========
process.on('unhandledRejection', (reason, promise) => {
  console.error('!!!!!!!!!! 全局unhandledRejection !!!!!!!!!!');
  console.error('Promise对象:', promise);
  console.error('异常原因 reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('!!!!!!!!!! uncaughtException 未捕获同步异常 !!!!!!!!!!', err);
});
// =================================================================================================

async function bootstrap() {
  const config = getServerConfig();

  const app = await NestFactory.create(AppModule, {
    // 关闭整个nestjs日志
    // logger: flag && [],
    // logger: false,
    // 允许跨域
    cors: true,
    // logger: ['error', 'warn'],
  });
  setupApp(app);

  // production:await app.listen(Number(process.env.APP_PORT) || 13000, '0.0.0.0');
  const port =
    typeof config['APP_PORT'] === 'string'
      ? parseInt(config['APP_PORT'])
      : 3000;
  await app.init();
  await app.listen(port, '0.0.0.0');
  console.log(`服务启动成功，监听端口：${port}`);
}
bootstrap();
