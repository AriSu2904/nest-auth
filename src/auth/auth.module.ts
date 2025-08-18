import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import * as fs from 'node:fs';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthRepository } from './auth.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        privateKey: fs.readFileSync(
          configService.get<string>('JWT_SECRET') || '',
        ),
        publicKey: fs.readFileSync(
          configService.get<string>('JWT_PUBLIC') || '',
        ),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
          algorithm: 'RS256',
          audience: (configService.get<string>('JWT_AUDIENCE') || '').split(
            ',',
          ),
          issuer: configService.get<string>('JWT_ISSUER'),
          keyid: configService.get<string>('JWT_KEY_ID'),
        },
        verifyOptions: {
          algorithms: ['RS256'],
          audience: (configService.get<string>('JWT_AUDIENCE') || '').split(
            ',',
          ),
          issuer: configService.get<string>('JWT_ISSUER'),
          complete: true,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthRepository],
})
export class AuthModule {}
