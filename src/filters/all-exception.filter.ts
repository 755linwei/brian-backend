import {
  ExceptionFilter,
  HttpAdapterHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { ArgumentsHost, Catch, } from '@nestjs/common';
import { ModuleRef,} from '@nestjs/core';


import * as requestIp from 'request-ip';
import { LogsService } from 'src/logs/logs.service';
import { User } from 'src/user/user.entity';
@Injectable() // ✅必须加，才能依赖注入
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private logger!: Logger;
  private logsService!: LogsService;

  constructor(private readonly moduleRef: ModuleRef,
  ) {}
  async onModuleInit() {
    this.logger = this.moduleRef.get(Logger, { strict: false });
    this.logsService = this.moduleRef.get(LogsService, { strict: false });
  }
    async catch(exception: unknown, host: ArgumentsHost) {
   this.logger.log('AllExceptionFilter捕获到异常,参数exception', exception);
   this.logger.log('AllExceptionFilter捕获到异常,参数host', host);
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const msg: unknown = exception['response'] || 'Internal Server Error';
    // 加入更多异常错误逻辑
    // if (exception instanceof QueryFailedError) {
    //   msg = exception.message;
    //   // if (exception.driverError.errno && exception.driverError.errno === 1062) {
    //   //   msg = '唯一索引冲突';
    //   // }
    // }

    const responseBody = {
      headers: request.headers,
      query: request.query,
      body: request.body,
      params: request.params,
      timestamp: new Date().toISOString(),
      // 还可以加入一些用户信息
      // IP信息
      ip: requestIp.getClientIp(request),
      exception: exception['name'],
      error: msg,
    };

    this.logger.error('[toimc]', responseBody);
    // ==========存入数据库Logs表 核心代码==========
    try {
      await this.logsService.createLog({
        path: request.url, // 请求路径
        methods: request.method, // ✅methods来源：request.method  GET/POST/PUT/DELETE
        data: JSON.stringify({
          body: request.body,
          errorMsg: msg,
          ip: requestIp.getClientIp(request),
        }),
        result: httpStatus,
        // 如果登录用户存在，绑定用户
        user: request.user?.userId ? undefined : undefined, // 这里可以根据实际情况绑定用户

      });
    } catch (e) {
      // 防止写日志自身报错，不影响主异常返回
      this.logger.error('保存异常日志到数据库失败', e);
    }
    // 👉 替换掉 this.httpAdapter.reply，直接使用response返回
    response.status(httpStatus).json({
      code: httpStatus,
      ...responseBody,
    });
  }
}
