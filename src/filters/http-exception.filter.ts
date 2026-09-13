import { LoggerService } from '@nestjs/common';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { ModuleRef } from '@nestjs/core';
import { LogsService } from '@/logs/logs.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private logger: LoggerService,
    private logsService: LogsService,
    @Inject(ModuleRef) private readonly moduleRef: ModuleRef,
  ) {}
  // onModuleInit 生命周期，等待模块初始化完成后拿到LogsService实例
  async onModuleInit() {
    this.logsService = this.moduleRef.get(LogsService, { strict: false });
  }

  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.getStatus();
    const errMsg = exception.message || exception.name;

    console.log('[HttpExceptionFilter] 进入异常过滤器', {
      path: request?.url,
      method: request?.method,
      status,
      message: errMsg,
    });

    // 写入数据库操作日志
    try {
      await this.logsService.createLog({
        path: request?.url ?? '',
        methods: request?.method ?? '',
        data: JSON.stringify({
          message: errMsg,
          stack: exception.stack ?? '',
          body: request?.body ?? {},
        }),
        result: status,
        // jwt守卫解析后挂载到request.user，如果登录态存在就记录关联用户
        user: request?.user ? request.user : undefined,
      });
    } catch (e) {
      // ❗ 防止日志入库自身报错导致掩盖原始业务异常，仅打印控制台
      console.error('[HttpExceptionFilter] 保存异常操作日志失败', e);
    }

    response.status(status).json({
      code: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: errMsg,
    });
  }
}
