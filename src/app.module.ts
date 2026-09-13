import { Global, Logger, Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';

import { buildConnectionOptions } from '../ormconfig';

import { LogsModule } from './logs/logs.module';
import { RolesModule } from './roles/roles.module';
import { MenusModule } from './menus/menus.module';
import { AuthModule } from './auth/auth.module';
import { JwtGuard } from './guards/jwt.guard';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
// import { AdminGuard } from './guards/admin.guard';
import { AllExceptionFilter } from './filters/all-exception.filter';
import { HttpExceptionFilter } from './filters/http-exception.filter';

const envFilePath = `.env.${process.env.NODE_ENV || `development`}`;

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
      load: [() => dotenv.config({ path: '.env' })],
      // 容器中DOCKER=true时完全忽略磁盘env文件，只读取process.env
      ignoreEnvFile: !!process.env.DOCKER,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        DB_PORT: Joi.number().default(3306),
        // DB_HOST: Joi.alternatives().try(
        //   Joi.string().ip(),
        //   Joi.string().domain(),
        // ),
        // ✅修改这里！！去掉ip/domain限制，允许docker内部短主机名 db
        DB_HOST: Joi.string().trim().min(1).required(),
        DB_TYPE: Joi.string().valid('mysql', 'postgres'),
        DB_DATABASE: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_SYNC: Joi.boolean().default(false),
        LOG_ON: Joi.boolean(),
        LOG_LEVEL: Joi.string(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      // Nest启动生命周期内部才执行buildConnectionOptions
      useFactory: () => {
        return buildConnectionOptions();
      },
    }),
    UserModule,
    LogsModule,
    RolesModule,
    AuthModule,
    MenusModule,
  ],
  controllers: [],
  providers: [
    Logger,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    //  HttpExceptionFilter, // 必须加入providers，交给nest容器管理
  ],
  exports: [Logger],
})
export class AppModule {}
