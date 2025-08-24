import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto, CreateUserDtoResponse } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { AuthRepository } from './auth.repository';
import {
  TokenPayloadDto,
  VerifyEmailDto,
  CacheTokenPayload,
} from './dto/return-value.dto';
import { NotificationService } from '../notification/notification.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { AuthBaseService } from './auth-base.service';

@Injectable()
export class AuthLocalService extends AuthBaseService {
  constructor(
    jwtService: JwtService,
    configService: ConfigService,
    authRepository: AuthRepository,
    userService: UserService,
    private readonly notificationService: NotificationService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super(authRepository, jwtService, configService, userService);
  }

  async reverifyEmail(email: string): Promise<VerifyEmailDto> {
    Logger.debug('[AUTH SV] Re-verifying email', email);

    const user = await this.userService.getProfileWithParam(email);

    const token = crypto.randomUUID();
    const verifyToken: CacheTokenPayload = {
      token,
      persona: user.persona,
      email: user.email,
      createdAt: new Date().toString(),
      expiredAt: new Date(Date.now() + 5 * 60 * 1000).toString(),
    };

    await Promise.all([
      this.notificationService.verifyEmail(token, user.email),
      this.cacheManager.set(`verify-${token}-${user.email}`, verifyToken),
    ]);

    return {
      persona: user.persona,
      email: user.email,
      isVerified: false,
      expiresAt: Date.now() + 5 * 60 * 1000,
      reVerifyAfterSeconds: 90,
    };
  }

  async register(user: CreateUserDto): Promise<VerifyEmailDto> {
    Logger.debug('[AUTH SV] Registering user');

    const createdUser = await this.userService.createUserLocal(user);

    const token = crypto.randomUUID();

    const verifyToken: CacheTokenPayload = {
      token,
      persona: createdUser.persona,
      email: createdUser.email,
      createdAt: new Date().toString(),
      expiredAt: new Date(Date.now() + 5 * 60 * 1000).toString(),
    };

    await this.notificationService.verifyEmail(token, user.email);
    await this.cacheManager.set(
      `verify-${token}-${createdUser.email}`,
      verifyToken,
    );

    return {
      ...createdUser,
      expiresAt: Date.now() + 5 * 60 * 1000,
      reVerifyAfterSeconds: 90,
    };
  }

  async verifyEmail(
    token: string,
    email: string,
  ): Promise<CreateUserDtoResponse> {
    Logger.debug(`[AUTH SV] Verifying email ${email} with token ${token}`);

    const cachedToken: CacheTokenPayload | undefined =
      await this.cacheManager.get(`verify-${token}-${email}`);

    if (!cachedToken) {
      throw new UnauthorizedException('Invalid token');
    }

    const verifiedUser = await this.userService.verifyUser(cachedToken.persona);
    await this.cacheManager.del(`verify-${token}`);

    return {
      persona: verifiedUser.persona,
      email: verifiedUser.email,
      isVerified: verifiedUser.isVerified,
    };
  }

  async localLogin(
    credential: LoginUserDto,
    deviceId: string,
  ): Promise<TokenPayloadDto> {
    Logger.debug(`[AUTH SV] Login user with persona ${credential.persona}`);

    const user = await this.userService.getProfileWithParam(credential.persona);

    const { password } = user;

    const matchedPassword = await bcrypt.compare(credential.password, password);

    if (!matchedPassword) {
      throw new ForbiddenException('Invalid Credentials');
    }

    const constructedUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      persona: user.persona,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
    };

    return await this.tokenAndDevice(constructedUser, deviceId);
  }
}
