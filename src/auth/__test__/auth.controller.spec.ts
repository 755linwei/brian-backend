import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LogsService } from 'src/logs/logs.service'; // 导入LogsService
import { User } from '../../user/user.entity';
import { Roles } from '../../roles/roles.entity';
import { SigninUserDto } from '../dto/signin-user.dto';

describe('AuthController（登录认证模块-控制器）', () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;
  let mockLogsService: Partial<LogsService>; // 声明mock日志服务

  beforeEach(async () => {
    // 模拟的AuthService -> 与后续的依赖项UserService等无关联的依赖项
    mockAuthService = {
      // signin: (username: string, password: string) => {
      //   return Promise.resolve('token');
      // },
      signin: jest.fn().mockResolvedValue({ access_token: 'token' }),
      // signup: (username: string, password: string) => {
      //   const user = new User();
      //   user.username = username;
      //   // user.password = password;
      //   user.roles = [{ id: 1, name: '普通用户' }] as Roles[];
      //   return Promise.resolve(user);
      // },
      signup: jest.fn().mockImplementation(async (username: string) => {
        const user = new User();
        user.id = 1;
        user.username = username;
        user.roles = [{ id: 1, name: '普通用户' }] as Roles[];
        return user;
      }),
    };

    // ✅mock LogsService，空对象即可，单元测试不关心日志逻辑
    mockLogsService = {
      createLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        // ✅补上LogsService的mock提供器！！这就是报错根源
        {
          provide: LogsService,
          useValue: mockLogsService,
        },
      ],
      // providers: [AuthService]
    }).compile();

    controller = module.get<AuthController>(AuthController);
    console.log(controller);
  });

  it('鉴权-初始化-实例化', () => {
    expect(controller).toBeDefined();
  });

  it('鉴权-控制器-signin登录', async () => {
    // 构造一个不完整的 Mock Request 对象，NestJS 的路由处理器并不关心 req 里的具体内容，只要不是 undefined 即可
    const mockReq = { headers: {}, user: null } as any;

    const res = await controller.signin(
      {
        username: 'testtest',
        password: '123456',
      } as SigninUserDto,
      mockReq,
    ); // ✅ 补上第二个参数

    expect(res).not.toBeNull();
    // expect(res.access_token).toBe('token');
    expect(mockAuthService.signin).toHaveBeenCalledWith('testtest', '123456');
  });
  it('鉴权-控制器-signup注册', async () => {
    const mockReq = { headers: {}, user: null } as any;
    const res = controller.signup(
      {
        username: 'testtest',
        password: '123456',
      } as SigninUserDto,
      mockReq,
    ); // ✅ 补上第二个参数
    expect(await res).not.toBeNull();
    expect((await res).id).not.toBeNull();
    expect((await res).password).toBeUndefined();
    expect((await res) instanceof User).toBeTruthy();

    expect((await res).username).toBe('testtest');
    expect((await res).roles.length).toBeGreaterThan(0);
  });
});
