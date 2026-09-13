import { Injectable, Logger } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { UserService } from '../user/user.service';
import { getEntities } from '../utils/common';
import { Menus } from '../menus/menu.entity';

@Injectable()
export class CaslAbilityService {
  private readonly logger = new Logger(CaslAbilityService.name);
  constructor(private userService: UserService) {}

  async forRoot(username: string) {
    // 针对于整个系统的 -> createUser XX SYStem
    this.logger.log(`=====开始构建CASL权限，username:${username}=====`);
    const { can, build } = new AbilityBuilder(createMongoAbility);

    // can('manage', 'all');
    // menu 名称、路径、acl ->actions -> 名称、路径->实体对应
    // path -> prefix -> 写死在项目代码里

    // 其他思路：acl -> 表来进行存储 -> LogController + Action
    // log -> sys:log -> sys:log:read, sys:log:write ...
    const user = await this.userService.find(username);
    this.logger.log(
      '查询出来用户信息:',
      JSON.stringify({
        username: user.username,
        roles: user.roles.map((r) => ({ id: r.id, name: r.name })),
      }),
    );
    // user -> 1:n roles -> 1:n menus -> 去重 {}
    const obj = {} as Record<string, unknown>;
    user.roles.forEach((o) => {
      this.logger.log(
        `遍历角色：id=${o.id}, name=${o.name}, 该角色绑定菜单数量:${o.menus.length}`,
      );
      o.menus.forEach((menu) => {
        // path -> acl -> actions
        // 通过Id去重
        obj[menu.id] = menu;
      });
    });
    const menus = Object.values(obj) as Menus[];
    this.logger.log(`去重后用户有效菜单总数：${menus.length}`);
    this.logger.log(
      '去重后菜单列表：',
      JSON.stringify(
        menus.map((m) => ({
          id: m.id,
          name: m.name,
          path: m.path,
          acl: m.acl,
        })),
      ),
    );
    menus.forEach((menu) => {
      const actions = menu.acl.split(',');
      this.logger.log(
        `菜单[${menu.name}] path=${menu.path} acl原始字符串=${menu.acl} 解析actions:`,
        actions,
      );
      const entity = getEntities(menu.path);
      this.logger.log(
        `---> 注册权限 can(${JSON.stringify(actions)}, ${entity})`,
      );
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        can(action, getEntities(menu.path));
      }
    });
    // can('read', Logs);
    // cannot('update', Logs);
    // can('manage', 'all');

    const ability = build({
      detectSubjectType: (object) => object.constructor.name,
    });
    this.logger.log(`CASL ability对象:`, JSON.stringify(ability));
    // ability.can
    // @CheckPolicies((ability) => ability.cannot(Action, User, ['']))
    // 打印最终生成的全部权限规则
    this.logger.log(
      `✅CASL最终生成全部权限rules: ${JSON.stringify(ability.rules)}`,
    );

    this.logger.log(`=====CASL权限构建完成 username:${username} =====`);
    return ability;
  }
}
