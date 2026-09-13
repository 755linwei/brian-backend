import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CaslHandlerType,
  CHECK_POLICIES_KEY,
  PolicyHandlerCallback,
} from 'src/decorators/casl.decorator';
// import { Observable } from 'rxjs';
import { CaslAbilityService } from 'src/auth/casl-ability.service';

@Injectable()
export class CaslGuard implements CanActivate {
  // 注入nest Logger（底层使用winston）
  private readonly logger = new Logger(CaslGuard.name);
  constructor(
    private reflector: Reflector,
    private caslAbilityService: CaslAbilityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log(`===== CaslGuard 进入守卫 =====`);
    this.logger.log(
      `控制器:${context.getClass().name}  接口方法:${
        context.getHandler().name
      }`,
    );
    const handlers = this.reflector.getAllAndMerge<PolicyHandlerCallback[]>(
      CHECK_POLICIES_KEY.HANDLER,
      [context.getHandler(), context.getClass()],
    );
    this.logger.log(
      `[CaslGuard] 拿到handlers函数数组: ${!!handlers}, isArray:${Array.isArray(
        handlers,
      )}, value=${JSON.stringify(handlers)}`,
    );
    const canHandlers = this.reflector.getAllAndMerge<any[]>(
      CHECK_POLICIES_KEY.CAN,
      [context.getHandler(), context.getClass()],
    ) as CaslHandlerType;
    this.logger.log(
      `[CaslGuard] 拿到canHandler函数数组: ${!!canHandlers}, isArray:${Array.isArray(
        canHandlers,
      )}, value=${JSON.stringify(canHandlers)}`,
    );

    const cannotHandlers = this.reflector.getAllAndMerge<any[]>(
      CHECK_POLICIES_KEY.CANNOT,
      [context.getHandler(), context.getClass()],
    ) as CaslHandlerType;
    this.logger.log(
      `[CaslGuard] 拿到cannotHandler函数数组: ${!!cannotHandlers}, isArray:${Array.isArray(
        cannotHandlers,
      )}, value=${JSON.stringify(cannotHandlers)}`,
    );
    // 修复：区分空数组[] 和 undefined
    const handlersExist =
      !!handlers && (Array.isArray(handlers) ? handlers.length > 0 : true);
    const canHandlersExist =
      !!canHandlers &&
      (Array.isArray(canHandlers) ? canHandlers.length > 0 : true);
    const cannotHandlersExist =
      !!cannotHandlers &&
      (Array.isArray(cannotHandlers) ? cannotHandlers.length > 0 : true);
    this.logger.log({
      msg: '从装饰器解析到的casl配置',
      handlersExist,
      canHandlersExist,
      cannotHandlersExist,
    });
    // 判断，如果用户未设置上述的任何一个，那么就直接返回true
    // 只要任意一个有真实配置，进入鉴权，全部为空直接放行
    const hasAnyPolicy =
      handlersExist || canHandlersExist || cannotHandlersExist;
    if (!hasAnyPolicy) {
      this.logger.log(`未配置任何casl权限装饰器，直接放行 true`);
      return true;
    }
    const req = context.switchToHttp().getRequest();
    if (req.user) {
      this.logger.log(`当前请求用户 username = ${req.user.username}`);
      // 获取当前用户的权限
      const ability = await this.caslAbilityService.forRoot(req.user.username);

      let flag = true;
      if (handlersExist) {
        flag = flag && handlers.every((handler) => handler(ability));
        this.logger.log(`handlers校验结果${flag}`);
      }
      if (flag && canHandlersExist) {
        if (canHandlers instanceof Array) {
          flag = flag && canHandlers.every((handler) => handler(ability));
          this.logger.log(`canHandlers数组校验结果${flag}`);
        } else if (typeof canHandlers === 'function') {
          flag = flag && canHandlers(ability);
          this.logger.log(`canHandlers函数校验结果${flag}`);
        }
      }
      if (flag && cannotHandlersExist) {
        if (cannotHandlers instanceof Array) {
          //此处some换了原来的every，意思是只要有一个返回true就返回false
          flag = flag && cannotHandlers.some((handler) => handler(ability));
          this.logger.log(`cannotHandlers数组校验结果${flag}`);
        } else if (typeof cannotHandlers === 'function') {
          flag = flag && !cannotHandlers(ability);
          this.logger.log(`cannotHandlers函数校验结果${flag}`);
        }
      }
      this.logger.log(`CaslGuard校验最终结果${flag}`);
      return flag;
    } else {
      this.logger.log(`未登录用户，拒绝访问`);
      return false;
    }
  }
}
