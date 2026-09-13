import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/enum/roles.enum';
import { ROLES_KEY } from 'src/decorators/roles.decorator';
import { UserService } from 'src/user/user.service';

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);
  constructor(private reflector: Reflector, private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log('==========进入RoleGuard==========');
    // jwt -> userId -> user -> roles
    // getAllAndMerge -> 合并 getAllAndOveride -> 读取路由上的metadata
    const requiredRoles = this.reflector.getAllAndMerge<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    this.logger.log(
      '👉接口要求的角色requiredRoles:' + JSON.stringify(requiredRoles),
    );
    if (!requiredRoles) {
      this.logger.log('👉不需要角色校验，直接放行 return true');
      return true;
    }
    const req = context.switchToHttp().getRequest();
    this.logger.log('👉JWT解析出来req.user:' + JSON.stringify(req.user));
    // user -> roles -> menu -> CURD + M, C1,C2,C3
    const user = await this.userService.find(req.user.username);
    this.logger.log('👉数据库查询出来user:' + JSON.stringify(user));
    const roleIds = user.roles.map((o) => o.id);
    this.logger.log(
      '👉当前登录用户拥有的角色id数组 roleIds:' + JSON.stringify(roleIds),
    );
    const flag = requiredRoles.some((role) => roleIds.includes(role));
    this.logger.log('👉校验结果 flag=' + flag);
    return flag;
  }
}
