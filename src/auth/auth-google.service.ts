import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayloadDto, UserGoogleProfileDto } from './dto/return-value.dto';
import { OAuth2Client } from 'google-auth-library';
import { AuthBaseService } from './auth-base.service';
import { CreateGoogleUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthGoogleService extends AuthBaseService {
  private client: OAuth2Client;

  constructor(
    jwtService: JwtService,
    configService: ConfigService,
    authRepository: AuthRepository,
    userService: UserService,
  ) {
    super(authRepository, jwtService, configService, userService);
    this.client = new OAuth2Client(
      configService.get<string>('GMAIL_CLIENT_ID'),
    );
  }

  private verifyToken(token: string) {
    return this.client.verifyIdToken({
      idToken: token,
      audience: this.configService.get<string>('GMAIL_CLIENT_ID'),
    });
  }

  async checkUser(
    googleUser: UserGoogleProfileDto,
  ): Promise<TokenPayloadDto | null> {
    Logger.debug(
      '[AUTH GSV] Checking google user with email ',
      googleUser.email,
    );

    const existUser = await this.userService.isUserExist(googleUser.email);

    if (existUser) {
      //sync user if already exist
      existUser.picture = googleUser.picture;
      existUser.firstName = googleUser.firstName;
      existUser.lastName = googleUser.lastName;
      existUser.email = googleUser.email;
      existUser.googleSynchronized = true;
      existUser.isVerified = true;

      const synchronizedUser = await this.userService.syncWithGoogle(existUser);

      if (!synchronizedUser) {
        throw new Error('Failed to synchronize user with Google');
      }

      const userProfile = {
        firstName: synchronizedUser.firstName,
        lastName: synchronizedUser.lastName,
        persona: synchronizedUser.persona,
        email: synchronizedUser.email,
        phoneNumber: synchronizedUser.phoneNumber,
        isVerified: synchronizedUser.isVerified,
      };

      const existDevice = await this.authRepository.findByPersona(
        userProfile.persona,
      );

      const deviceId: string = existDevice?.deviceId || 'DEFAULT_DEVICE_ID';

      return this.tokenAndDevice(userProfile, deviceId);
    }

    return null;
  }

  async login(
    token: string,
    deviceId: string,
    persona: string,
  ): Promise<TokenPayloadDto> {
    Logger.debug(`[AUTH GSV] Login user with persona ${persona}`);

    const ticket = await this.verifyToken(token);

    const unverifiedUser = ticket.getPayload();

    if (unverifiedUser === undefined) {
      throw new UnauthorizedException('Invalid google token');
    }

    const user: CreateGoogleUserDto = {
      firstName: unverifiedUser.given_name,
      lastName: unverifiedUser.family_name,
      picture: unverifiedUser.picture,
      persona,
      email: unverifiedUser.email || '',
      isVerified: true,
    };

    await this.userService.createUserGoogle(user);

    return this.tokenAndDevice(
      {
        persona,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: '',
        isVerified: true,
      },
      deviceId,
    );
  }
}
