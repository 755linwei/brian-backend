import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from './roles.entity';
import { Menus } from '@/menus/menu.entity'; // ✅导入Menus实体
@Module({
  imports: [TypeOrmModule.forFeature([Roles,Menus])],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
