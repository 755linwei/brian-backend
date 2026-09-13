import { AppFactory } from './app.factory';
import { INestApplication } from '@nestjs/common';
import * as pactum from 'pactum';

let appFactory: AppFactory;
let app: INestApplication;

// global.beforeEach(async () => {
global.beforeAll(async () => {
  // const moduleFixture: TestingModule = await Test.createTestingModule({
  //   imports: [AppModule],
  // }).compile();
  // app = moduleFixture.createNestApplication();
  // setupApp(app);
  // await app.init();
  appFactory = await AppFactory.init();
  // await appFactory?.destory();
  await appFactory.initDB();
  // appFactory = await AppFactory.init();
  app = appFactory.instance;

  pactum.request.setBaseUrl(await app.getUrl());
  global.pactum = pactum;
  // global.spec = pactum.spec();
  // global.app = app;
});
// global.beforeEach(async () => {
//   await appFactory.cleanup();
// });
// ✅改为 afterEach：每个测试用例跑完，再清理业务测试数据
global.afterEach(async () => {
  await appFactory.cleanup();
});
// global.afterEach(async () => {

global.afterAll(async () => {
  // await appFactory.cleanup();
  await appFactory?.destroy();
  await app?.close();
});
