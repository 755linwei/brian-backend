import {
  Body,
  Controller,
  Post,
  // HttpException,
  UseFilters,
  UseInterceptors,
  ClassSerializerInterceptor,
  Get,
  Logger,
  Req,
} from '@nestjs/common';
// import { SerializeInterceptor } from '../interceptors/serialize.interceptor';
import { TypeormFilter } from 'src/filters/typeorm.filter';
import { AuthService } from './auth.service';
import { SigninUserDto } from './dto/signin-user.dto';
import { Public } from 'src/decorators/public.decorator';
// export function TypeOrmDecorator() {
//   return UseFilters(new TypeormFilter());
// }
import { LogsService } from 'src/logs/logs.service';
import * as requestIp from 'request-ip';

@Controller('auth')
@Public()
// @TypeOrmDecorator()
@UseInterceptors(ClassSerializerInterceptor)
@UseFilters(new TypeormFilter())
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private authService: AuthService,
    // ✅注入日志服务
    private readonly logsService: LogsService,
  ) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Post('/signin')
  async signin(@Body() dto: SigninUserDto, @Req() req: Request) {
    const { username, password } = dto;
    const token = await this.authService.signin(username, password);
    this.logger.log(`[AuthController signin] 登录响应返回token`);

    // ✅调用 createLog，记录登录成功日志
    await this.logsService.createLog({
      path: req.url,
      methods: req.method,
      data: JSON.stringify({
        username: dto.username,
        msg: '用户登录成功',
        ip: requestIp.getClientIp(req),
      }),
      result: 200,
      // 登录成功后，此时还没有经过JwtGuard，req.user还不存在！拿不到userId，user不赋值
      user: undefined,
    });
    return {
      access_token: token,
    };
  }

  @Post('/signup')

  // @UseInterceptors(SerializeInterceptor)
  async signup(@Body() dto: SigninUserDto, @Req() req: Request) {
    const { username, password } = dto;
    const res = await this.authService.signup(username, password);
    this.logger.log(`[AuthController signup] 注册完成返回用户数据`);

    // ✅调用 createLog，记录注册成功日志
    await this.logsService.createLog({
      path: req.url,
      methods: req.method,
      data: JSON.stringify({
        username: dto.username,
        msg: '用户注册成功',
        ip: requestIp.getClientIp(req),
      }),
      result: 200,
      // 注册完成拿到新建用户id，关联日志user
      user: { id: res.id } as any,
    });
    return res;
  }
}
