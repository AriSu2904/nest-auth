import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(user: CreateUserDto) {
    Logger.debug('[AUTH SV] Registering user');

    return this.userService.createUser(user);
  }

  _generateToken(payload: any) {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '1d' });

    return {
      accessToken,
      refreshToken,
    };
  }

  async localLogin(credential: LoginUserDto) {
    Logger.debug(`[AUTH SV] Login user persona ${credential.persona}`);

    const user = await this.userService.myProfile(credential.persona, true);

    const { persona, email, password } = user;

    const matchedPassword = await bcrypt.compare(credential.password, password);

    if (!matchedPassword) {
      throw new ForbiddenException('Invalid Credentials');
    }

    const firstName = user?.firstName;
    const lastName = user?.lastName;

    const tokenPayload = {
      sub: persona,
      email: email,
      additionalData: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
    };

    return this._generateToken(tokenPayload);
  }
}
