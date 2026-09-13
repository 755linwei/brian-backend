import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './user.entity';
import { Logs } from 'src/logs/logs.entity';
import { Roles } from 'src/roles/roles.entity';
import { getUserDto } from './dto/get-user.dto';
import { conditionUtils } from 'src/utils/db.helper';
import * as argon2 from 'argon2';
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Logs) private readonly logsRepository: Repository<Logs>,
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
  ) {}

  findAll(query: getUserDto) {
    const { limit, page, username, gender, role } = query;
    const take = limit || 10;
    const skip = ((page || 1) - 1) * take;
    // SELECT * FROM user u, profile p, role r WHERE u.id = p.uid AND u.id = r.uid AND ....
    // SELECT * FROM user u LEFT JOIN profile p ON u.id = p.uid LEFT JOIN role r ON u.id = r.uid WHERE ....
    // 分页 SQL -> LIMIT 10 OFFSET 10
    // return this.userRepository.find({
    //   select: {
    //     id: true,
    //     username: true,
    //     profile: {
    //       gender: true,
    //     },
    //   },
    //   relations: {
    //     profile: true,
    //     roles: true,
    //   },
    //   where: { // AND OR
    //     username,
    //     profile: {
    //       gender,
    //     },
    //     roles: {
    //       id: role,
    //     },
    //   },
    //   take,
    //   skip,
    // });
    const obj = {
      'user.username': username,
      'profile.gender': gender,
      'roles.id': role,
    };
    // inner join vs left join vs outer join
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.roles', 'roles');
    const newQuery = conditionUtils<User>(queryBuilder, obj);
    // if (gender) {
    //   queryBuilder.andWhere('profile.gender = :gender', { gender });
    // } else {
    //   queryBuilder.andWhere('profile.gender IS NOT NULL');
    // }
    // if (role) {
    //   queryBuilder.andWhere('roles.id = :role', { role });
    // } else {
    //   queryBuilder.andWhere('roles.id IS NOT NULL');
    // }
    return (
      newQuery
        .take(take)
        .skip(skip)
        // .andWhere('profile.gender = :gender', { gender })
        // .andWhere('roles.id = :role', { role })
        .getMany()
    );
  }

  find(username: string) {
    return this.userRepository.findOne({
      where: { username },
      relations: ['roles', 'roles.menus'],
    });
  }

  findOne(id: number) {
    return this.userRepository.findOne({
      where: { id },
      relations: {
        profile: true, // 一对一profile
        logs: true, // 一对多logs日志
        roles: true, // 多对多roles
      },
    });
  }

  async create(user: Partial<User>) {
    console.log(
      '🚀原始user.roles:',
      user.roles,
      '类型第一项:',
      typeof user?.roles?.[0],
    );
    if (!user.roles) {
      const role = await this.rolesRepository.findOne({ where: { id: 2 } });
      user.roles = [role];
    }
    if (user.roles instanceof Array && typeof user.roles[0] === 'number') {
      // {id, name} -> { id } -> [id]
      // 查询所有的用户角色
      user.roles = await this.rolesRepository.find({
        where: {
          id: In(user.roles),
        },
      });
    }

    // 兼容两种：number[] 或者 {id:number}[]
    // if (Array.isArray(user.roles)) {
    //   // 提取所有id
    //   const roleIds = user.roles.map(item => {
    //     return typeof item === 'number' ? item : item.id;
    //   })
    //   user.roles = await this.rolesRepository.find({
    //     where: { id: In(roleIds) },
    //   });
    // }
    // =========新增profile兜底=========
    if (user.profile) {
      user.profile.gender = user.profile.gender ?? 0;
      user.profile.photo = user.profile.photo ?? '';
      user.profile.address = user.profile.address ?? '';
    }

    const userTmp = await this.userRepository.create(user);
    // try {
    // 对用户密码使用argon2加密
    userTmp.password = await argon2.hash(userTmp.password);
    const res = await this.userRepository.save(userTmp);
    console.log('🚀 ~ 注册成功', res);
    return res;

    // } catch (error) {
    //   console.log(
    //     '🚀 ~ file: user.service.ts ~ line 93 ~ UserService ~ create ~ error',
    //     error,
    //   );
    //   if (error.errno && error.errno === 1062) {
    //     throw new HttpException(error.sqlMessage, 500);
    //   }
    // }
  }

  async getUser(id: number) {
    // 1. 必须用 findOne
    // 2. 必须把 id 加上 where
    return this.userRepository.findOne({
      where: { id },
      //特殊的profile属性
      relations: ['profile', 'roles', 'roles.menus'],
    });
  }

  async update(id: any, user: Partial<User>) {
    const userTemp = await this.findProfile(parseInt(id));
    this.logger.log(
      `🚀 ~ file: user.service.ts ~ line 126 ~ UserService ~ update ~ userTemp`,
      userTemp,
    );
    if (!userTemp) {
      throw new NotFoundException('用户不存在');
    }
    //不允许更新id
    delete user.id;
    // 前端传 roles: [2,3] number[]，需要查询转成Roles实体对象数组
    if (
      user.roles &&
      Array.isArray(user.roles) &&
      typeof user.roles[0] === 'number'
    ) {
      user.roles = await this.rolesRepository.find({
        where: {
          id: In(user.roles),
        },
      });
    }

    // ==========profile字段兜底防御，防止undefined进入数据库==========
    if (user.profile) {
      // 防止undefined，全部替换为安全默认值
      user.profile.gender = user.profile.gender ?? 0;
      user.profile.photo = user.profile.photo ?? '';
      user.profile.address = user.profile.address ?? '';
    }
    // 如果传递了password，执行加密
    if (user.password) {
      user.password = await argon2.hash(user.password);
    }
    const newUser = this.userRepository.merge(userTemp, user);
    // 联合模型更新，需要使用save方法或者queryBuilder
    return this.userRepository.save(newUser);

    // 下面的update方法，只适合单模型的更新，不适合有关系的模型更新
    // return this.userRepository.update(parseInt(id), newUser);
  }

  async remove(id: number) {
    // return this.userRepository.delete(id);
    const user = await this.findOne(id);
    return this.userRepository.remove(user);
  }

  findProfile(id: number) {
    return this.userRepository.findOne({
      where: {
        id,
      },
      relations: {
        profile: true,
      },
    });
  }

  async findUserLogs(id: number) {
    return this.logsRepository.find({
      where: {
        user: { id },
      },
      relations: {
        user: true,
      },
    });
  }

  findLogsByGroup(id: number) {
    // SELECT logs.result as rest, COUNT(logs.result) as count from logs, user WHERE user.id = logs.userId AND user.id = 2 GROUP BY logs.result;
    // return this.logsRepository.query(
    //   'SELECT logs.result as rest, COUNT(logs.result) as count from logs, user WHERE user.id = logs.userId AND user.id = 2 GROUP BY logs.result',
    // );
    return (
      this.logsRepository
        .createQueryBuilder('logs')
        .select('logs.result', 'result')
        .addSelect('COUNT("logs.result")', 'count')
        .leftJoinAndSelect('logs.user', 'user')
        .where('user.id = :id', { id })
        .groupBy('logs.result')
        .orderBy('count', 'DESC')
        .addOrderBy('result', 'DESC')
        .offset(2)
        .limit(3)
        // .orderBy('result', 'DESC')
        .getRawMany()
    );
  }
}
