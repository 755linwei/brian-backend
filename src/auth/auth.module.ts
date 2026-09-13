import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { LogsModule } from 'src/logs/logs.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigEnum } from 'src/enum/config.enum';
import { JwtStrategy } from './auth.strategy';
import { CaslAbilityService } from './casl-ability.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Logs } from 'src/logs/logs.entity';
import { LogsService } from 'src/logs/logs.service';
@Global()
@Module({
  imports: [
    UserModule,
    PassportModule,
    LogsModule, // ✅加上LogsModule
    TypeOrmModule.forFeature([Logs]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // console.log({
        //   secret: configService.get<string>(ConfigEnum.SECRET),
        // });
        return {
          secret: configService.get<string>(ConfigEnum.SECRET),
          signOptions: {
            expiresIn: '1d',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, CaslAbilityService, LogsService],
  controllers: [AuthController],
  exports: [CaslAbilityService, LogsService],
})
export class AuthModule {}
