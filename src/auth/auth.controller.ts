import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CommonResponse } from '../common';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() user: CreateUserDto): Promise<CommonResponse<any>> {
    Logger.debug('[AUTH CTR] Incoming register request');

    const registeredUser = await this.authService.register(user);

    return {
      message: 'User created!',
      data: registeredUser,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async localLogin(
    @Body() credential: LoginUserDto,
  ): Promise<CommonResponse<any>> {
    Logger.debug('[AUTH CTR] Incoming login request');

    const token = await this.authService.localLogin(credential);

    return {
      message: 'Login successfully',
      data: token,
    };
  }
}
