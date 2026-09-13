import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Roles } from './roles.entity';
import { Repository, In } from 'typeorm';
import { Menus } from '@/menus/menu.entity';
import { Logger } from '@nestjs/common';
@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);
  constructor(
    @InjectRepository(Roles) private roleRepository: Repository<Roles>,
    @InjectRepository(Menus) private menuRepository: Repository<Menus>, // ✅注入menu Repository
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const role = await this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  findAll() {
    // return this.roleRepository.find();
    return this.roleRepository.find({ relations: ['users', 'menus'] });
  }

  findOne(id: number) {
    return this.roleRepository.findOne({
      where: {
        id,
      },
      relations: ['menus'],
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);
    this.logger.log('🚀service收到dto.menuIds=', updateRoleDto.menuIds);
    if (!role) {
      this.logger.log(`更新角色id=${id}，但是role不存在`);
      return null;
    }
    // 1. 更新普通字段name
    if (updateRoleDto.name) {
      role.name = updateRoleDto.name;
    }

    // 2. 如果前端传了menuIds，更新多对多菜单关联
    if (updateRoleDto.menuIds && Array.isArray(updateRoleDto.menuIds)) {
      // 根据id数组查询得到完整Menus实体数组，多对多需要实体，不能直接传数字id数组！
      const menus = await this.menuRepository.findBy({
        id: In(updateRoleDto.menuIds),
      });
      this.logger.log(
        `前端传过来的menuIds=${updateRoleDto.menuIds}，查询到menus实体数组=${menus}`,
      );
      role.menus = menus; // ✅赋值实体数组，TypeORM维护中间表role_menus
    }

    // 直接save已经merge好的role实体，不要用repository.merge
    return await this.roleRepository.save(role);
  }

  remove(id: number) {
    // delete  -> AfterRemove 不会触发
    return this.roleRepository.delete(id);
  }
}
