import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  // UseInterceptors,
} from '@nestjs/common';
import { JwtGuard } from 'src/guards/jwt.guard';
import { AdminGuard } from 'src/guards/admin.guard';
import { IsNotEmpty, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
// import { SerializeInterceptor } from '../interceptors/serialize.interceptor';
import { Serialize } from 'src/decorators/serialize.decorator';
import { CaslGuard } from 'src/guards/casl.guard';
import { Can, CheckPolices } from '../decorators/casl.decorator';
import { Logs } from './logs.entity';
import { Action } from 'src/enum/action.enum';
import { LogsService } from './logs.service';

// DTO
export class LogsDto {
  @IsString()
  @IsNotEmpty()
  data: string; // ✅原来是msg，改成data，和entity对齐
  @IsString()
  path: string;
  @IsString()
  methods: string;
  result: number;
}

export class PublicLogsDto {
  @Expose()
  id: number;
  @Expose()
  data: string; // ✅这里也要同步改，不要写msg
  @Expose()
  path: string;
  @Expose()
  methods: string;
  @Expose()
  result: number;
}

@Controller('logs')
@UseGuards(JwtGuard, AdminGuard, CaslGuard)
// @UseGuards()
/**?@CheckPolices 是用来做通用/复杂判断的（比如：判断某个额外的业务条件）。

@Can 是用来做具体动作校验的（比如：验证是否有 Action.Read 权限）。

这两个装饰器（在大多数 Casl 集成方案中）是互斥的，不能同时写在一个方法或类上，否则守卫中的 PolicyHandler 数组会判断混乱。 */
@CheckPolices((ability) => ability.can(Action.Read, Logs))
// @Can(Action.Read, Logs)
// UserInterceptor(new SerializationInterceptor(DTO))
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @Can(Action.Read, Logs)
  @Serialize(PublicLogsDto)
  async getTest() {
    return await this.logsService.findAll();
  }

  @Post()
  @Can(Action.Create, Logs)
  @Serialize(PublicLogsDto)
  async postTest(@Body() dto: LogsDto) {
    return await this.logsService.createLog({ ...dto });
  }
}
