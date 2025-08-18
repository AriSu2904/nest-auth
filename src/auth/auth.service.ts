import {
  ForbiddenException,
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
  TokenDto,
  UserLocalSignatureDto,
  UserProfileDto,
  TokenPayloadDto,
  SessionDto,
} from './dto/return-value.dto';

@Injectable()
export class AuthService {
  issuer: string;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.issuer = this.configService.get<string>('JWT_ISSUER') || '';
  }

  async register(user: CreateUserDto): Promise<CreateUserDtoResponse> {
    Logger.debug('[AUTH SV] Registering user');

    return this.userService.createUser(user);
  }

  private hashDeviceId(deviceId: string, nonce: string): string {
    const raw = `${deviceId}:${this.issuer}:${nonce}`;

    return crypto.createHash('sha256').update(raw).digest('base64');
  }

  private async saveSessions(
    deviceId: string,
    persona: string,
    token: TokenDto,
  ) {
    Logger.debug(`[AUTH SV] Saving session for device ${deviceId}`);

    const nonce = crypto.randomUUID();
    const hashDeviceId = this.hashDeviceId(deviceId, nonce);

    await this.authRepository.upsert({
      deviceId: deviceId,
      hashDeviceId: hashDeviceId,
      persona,
      nonce,
      hashRefreshToken: token.hashRefreshToken,
    });
  }

  private generateToken(payload: UserLocalSignatureDto): TokenDto {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '1d' });

    return {
      accessToken,
      refreshToken,
      hashRefreshToken: crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex'),
    };
  }

  private assignLocalSignature(user: UserProfileDto): UserLocalSignatureDto {
    const firstName: string = user?.firstName;
    const lastName: string = user?.lastName;

    return {
      sub: user.persona,
      email: user.email,
      additionalData: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
    };
  }

  async localLogin(
    credential: LoginUserDto,
    deviceId: string,
  ): Promise<TokenPayloadDto> {
    Logger.debug(`[AUTH SV] Login user with persona ${credential.persona}`);

    const user = await this.userService.getProfileWithParam(credential.persona);

    const { password, persona } = user;

    const matchedPassword = await bcrypt.compare(credential.password, password);

    if (!matchedPassword) {
      throw new ForbiddenException('Invalid Credentials');
    }
    const tokenPayload = this.assignLocalSignature(user);
    const token = this.generateToken(tokenPayload);

    await this.saveSessions(deviceId, persona, token);

    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    };
  }

  private async validateRefreshToken(
    hashRefreshToken: string,
    deviceId: string,
  ): Promise<SessionDto> {
    const session = await this.authRepository.findOneByToken(hashRefreshToken);

    if (!session || hashRefreshToken !== session.hashRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const hashedDeviceId = this.hashDeviceId(deviceId, session.nonce);

    if (hashedDeviceId !== session.hashDeviceId) {
      throw new ForbiddenException('Invalid Device ID, Please login again!');
    }

    return {
      persona: session.persona,
      deviceId: session.deviceId,
      hashRefreshToken: session.hashRefreshToken,
      hashDeviceId: session.hashDeviceId,
      nonce: session.nonce,
    };
  }

  async refreshToken(
    deviceId: string,
    refreshToken: string,
  ): Promise<TokenPayloadDto> {
    Logger.debug(`[AUTH SV] Refreshing token for device ${deviceId}`);

    const hashRefreshToken = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const session = await this.validateRefreshToken(hashRefreshToken, deviceId);

    const user = await this.userService.myProfile(session.persona);

    const tokenSignature = this.assignLocalSignature(user);
    const token = this.generateToken(tokenSignature);

    await this.saveSessions(deviceId, session.persona, token);

    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    };
  }
}
