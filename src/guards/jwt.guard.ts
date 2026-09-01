import { AuthGuard } from '@nestjs/passport';
import { Logger, ExecutionContext,Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }
async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context) as Promise<boolean>;
  }
  // 【重点】重写handleRequest，passport校验完成后进入这里
  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    this.logger.log('==== JwtGuard handleRequest ====');
    this.logger.log('err:' + JSON.stringify(err));
    this.logger.log('info:' + JSON.stringify(info));
    this.logger.log('解析出来的req.user:' + JSON.stringify(user));

    // 原有逻辑不变，原样交给父类处理
    return super.handleRequest(err, user, info, context, status);
  }

}