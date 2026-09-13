import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // ✅必须 @IsOptional()！！！patch更新时这个字段可以不传
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  menuIds?: number[];
}
