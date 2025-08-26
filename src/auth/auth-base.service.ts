import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  SessionDto,
  TokenDto,
  TokenPayloadDto,
  UserLocalSignatureDto,
  UserProfileDto,
} from './dto/return-value.dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { AuthRepository } from './auth.repository';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthBaseService {
  issuer: string;

  constructor(
    protected readonly authRepository: AuthRepository,
    protected readonly jwtService: JwtService,
    protected readonly configService: ConfigService,
    protected readonly userService: UserService,
  ) {
    this.issuer = this.configService.get<string>('JWT_ISSUER') || '';
  }

  protected assignSignature(user: UserProfileDto): UserLocalSignatureDto {
    const { firstName, lastName } = user;

    return {
      sub: user.persona,
      email: user.email,
      additionalData: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
    };
  }

  protected hashDeviceId(deviceId: string, nonce: string): string {
    const raw = `${deviceId}:${this.issuer}:${nonce}`;

    return crypto.createHash('sha256').update(raw).digest('base64');
  }

  protected generateToken(payload: UserLocalSignatureDto): TokenDto {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '3d' });

    return {
      accessToken,
      refreshToken,
      hashRefreshToken: crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex'),
    };
  }

  protected async validateRefreshToken(
    hashRefreshToken: string,
    deviceId: string,
    persona: string,
  ): Promise<SessionDto> {
    const session = await this.authRepository.findOneByToken(hashRefreshToken);

    if (!session || hashRefreshToken !== session.hashRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const hashedDeviceId = this.hashDeviceId(deviceId, session.nonce);

    if (hashedDeviceId !== session.hashDeviceId) {
      throw new ForbiddenException('Invalid Device ID, Please login again!');
    }

    if (persona !== session.persona) {
      throw new ForbiddenException('Invalid credential, Please login again!');
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

    const decodedToken: UserLocalSignatureDto =
      this.jwtService.decode(refreshToken);

    const session = await this.validateRefreshToken(
      hashRefreshToken,
      deviceId,
      decodedToken.sub,
    );
    const user = await this.userService.myProfile(decodedToken.sub);

    const tokenSignature = this.assignSignature(user);
    const token = this.generateToken(tokenSignature);

    const sessionPayload = {
      deviceId: session.deviceId,
      persona: session.persona,
      nonce: session.nonce,
      hashRefreshToken: token.hashRefreshToken,
      hashDeviceId: session.hashDeviceId,
    };

    await this.authRepository.upsert(sessionPayload);

    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    };
  }

  protected async tokenAndDevice(user: UserProfileDto, deviceId: string) {
    const tokenPayload = this.assignSignature(user);
    const token = this.generateToken(tokenPayload);

    const nonce = crypto.randomUUID();
    const hashDeviceId = this.hashDeviceId(deviceId, nonce);

    await this.authRepository.upsert({
      persona: user.persona,
      deviceId,
      hashRefreshToken: token.hashRefreshToken,
      hashDeviceId,
      nonce,
    });

    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    };
  }
}
