import { Column, Entity, ManyToMany, PrimaryGeneratedColumn,JoinTable } from 'typeorm';

import { User } from '../user/user.entity';
import { Menus } from '../menus/menu.entity';
import { Expose } from 'class-transformer';

@Entity()
export class Roles {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @Column()
  @Expose()
  name: string;

  @ManyToMany(() => User, (user) => user.roles)
  @Expose()
  users: User[];

  @ManyToMany(() => Menus, (menu) => menu.roles)
  @Expose()
  @JoinTable({ name: 'role_menus' })
  menus: Menus[];
}
