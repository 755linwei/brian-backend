import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
// import { Observable } from 'rxjs';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);
  // 常见的错误：在使用AdminGuard未导入UserModule
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // 1. 获取请求对象
      const req = context.switchToHttp().getRequest();
      // 2. 获取请求中的用户信息进行逻辑上的判断 -> 角色判断
      // console.log('user', req.user);
      const user = (await this.userService.find(req.user.username)) as User;
      this.logger.log('db查询出来user:' + JSON.stringify(user));
      this.logger.log('db查询出来角色:' + JSON.stringify(user?.roles));

      if (!user || !user.roles) {
        this.logger.log('AdminGuard：用户或者角色为空，拒绝访问');
        return false;
      }
      // 普通用户
      // 后面加入更多的逻辑
      // 判断是否拥有管理员角色id=1
      const isAdmin = user.roles.some((r) => r.id == 1);
      this.logger.log(`AdminGuard -> 是否管理员:${isAdmin}`);

      return isAdmin;
    } catch (err) {
      // 捕获任何异常，打印错误堆栈！！
      this.logger.error('❌AdminGuard发生异常', err);
      return false;
    }
  }
}
