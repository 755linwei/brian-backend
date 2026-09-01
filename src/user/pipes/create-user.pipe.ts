import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class CreateUserPipe implements PipeTransform {
  transform(value: CreateUserDto, metadata: ArgumentMetadata) {
    if (value.roles && Array.isArray(value.roles) && value.roles.length > 0) {
      // 判断数组第一项是不是对象（有id属性）
      // const firstItem = value.roles[0];
      // if (typeof firstItem === 'object' && firstItem !== null && 'id' in firstItem) {
      //   // 类型收窄，map内部做判断
      //   value.roles = value.roles.map((role) => {
      //     if (typeof role === 'object' && role !== null && 'id' in role) {
      //       return role.id;
      //     }
      //     return role;
      //   });
      // }
    }
    return value;
  }
}
