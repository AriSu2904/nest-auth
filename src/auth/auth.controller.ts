import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, CreateUserDtoResponse } from './dto/create-user.dto';
import { CommonResponse } from '../common';
import { LoginUserDto } from './dto/login-user.dto';
import { DeviceIdGuard } from './guards/general.guard';
import { TokenPayloadDto } from './dto/return-value.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() user: CreateUserDto,
  ): Promise<CommonResponse<CreateUserDtoResponse>> {
    Logger.debug('[AUTH CTR] Incoming register request');

    const registeredUser = await this.authService.register(user);

    return {
      message: 'User created!',
      data: registeredUser,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(DeviceIdGuard)
  async localLogin(
    @Body() credential: LoginUserDto,
    @Headers('x-device-id') deviceId: string,
  ): Promise<CommonResponse<TokenPayloadDto>> {
    Logger.debug('[AUTH CTR] Incoming login request');

    const token = await this.authService.localLogin(credential, deviceId);

    return {
      message: 'Login successfully',
      data: token,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(DeviceIdGuard)
  async refreshToken(
    @Headers('x-device-id') deviceId: string,
    @Body('refreshToken') refreshToken: string,
  ): Promise<CommonResponse<TokenPayloadDto>> {
    Logger.debug('[AUTH CTR] Incoming refresh token request');

    const newToken = await this.authService.refreshToken(
      deviceId,
      refreshToken,
    );

    return {
      message: 'Refresh token successfully',
      data: newToken,
    };
  }
}
