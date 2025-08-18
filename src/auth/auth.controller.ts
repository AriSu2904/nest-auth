import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, CreateUserDtoResponse } from './dto/create-user.dto';
import { CommonResponse } from '../common';
import { LoginUserDto } from './dto/login-user.dto';
import { DeviceIdGuard } from './guards/general.guard';
import { AccessTokenDto } from './dto/return-value.dto';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setCookie(res: Response, refreshToken: string) {
    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

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
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonResponse<AccessTokenDto>> {
    Logger.debug('[AUTH CTR] Incoming login request');

    const token = await this.authService.localLogin(credential, deviceId);

    this.setCookie(res, token.refreshToken);

    return {
      message: 'Login successfully',
      data: {
        accessToken: token.accessToken,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(DeviceIdGuard)
  async refreshToken(
    @Headers('x-device-id') deviceId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonResponse<AccessTokenDto>> {
    Logger.debug('[AUTH CTR] Incoming refresh token request');
    const refreshToken = req.cookies['refresh-token'];

    const newToken = await this.authService.refreshToken(
      deviceId,
      refreshToken,
    );

    this.setCookie(res, newToken.refreshToken);

    return {
      message: 'Refresh token successfully',
      data: {
        accessToken: newToken.accessToken,
      },
    };
  }
}
