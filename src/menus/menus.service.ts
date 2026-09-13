import { Injectable, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Menus } from './menu.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menus) private menuRepository: Repository<Menus>,
  ) {}

  async create(createMenuDto: CreateMenuDto) {
    const menu = await this.menuRepository.create(createMenuDto);
    return this.menuRepository.save(menu);
  }

  findAll() {
    // return this.menuRepository.find();
    // throw new HttpException('测试异常日志写入', 400);

    return this.menuRepository.find({ relations: ['roles'] });
  }

  findOne(id: number) {
    return this.menuRepository.findOne({
      where: {
        id,
      },
      relations: ['roles'],
    });
  }

  async update(id: number, updateMenuDto: UpdateMenuDto) {
    const menu = await this.findOne(id);
    const newMenu = await this.menuRepository.merge(menu, updateMenuDto);
    return this.menuRepository.save(newMenu);
    return '';
  }

  async remove(id: number) {
    const entity = await this.findOne(id);
    return this.menuRepository.remove(entity);
  }
}
