import { IsNotEmpty, IsString, Length, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// 专门用于接收 {id:number}，不要导入Roles实体
class RoleRefDto {
  @IsNumber()
  id: number;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 64)
  password: string;

  // ✅ 真正校验装饰器，告诉管道：这个字段可选，数组，可以是数字数组 / 对象数组[{id}]
  @IsOptional()
  @IsArray()
 @IsNumber({}, { each: true })
  roles?: number[];
}