import { Test, TestingModule } from '@nestjs/testing';
import { LogsController } from '../logs.controller';
import { LogsService } from '../logs.service';
// 1. 引入 WinstonModule
import { WinstonModule } from 'nest-winston';
// 引入你的两个守卫
import { JwtGuard } from 'src/guards/jwt.guard';
import { AdminGuard } from 'src/guards/admin.guard';
import { CaslGuard } from 'src/guards/casl.guard';

// Mock守卫：直接放行，单元测试controller不需要鉴权
const mockJwtGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};
const mockAdminGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};
const mockCaslGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};
describe('LogsController', () => {
  let controller: LogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogsController],
      // 2. 在这里添加一个临时的 imports，Mock 掉 WinstonModule
      imports: [
        WinstonModule.forRoot({}), // 传入空对象，避免它去读取配置文件和写入磁盘
      ],
      providers: [
        {
          provide: LogsService,
          useValue: {},
        },
        // ✅重点：mock守卫！覆盖JwtGuard、AdminGuard，不再实例化真实守卫，也就不会去找UserService依赖
        // {
        //   provide: JwtGuard,
        //   useValue: mockJwtGuard,
        // },
        // {
        //   provide: AdminGuard,
        //   useValue: mockAdminGuard,
        // },
        // {
        //   provide: CaslGuard,
        //   useValue: mockCaslGuard,
        // },
      ],
    }) // ✅ 核心魔法：overrideGuard 会覆盖真实的 Guard，不再尝试实例化它！
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(CaslGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LogsController>(LogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
