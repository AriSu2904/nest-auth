import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthLocalService } from './auth-local.service';
import { CreateUserDto, CreateUserDtoResponse } from './dto/create-user.dto';
import { CommonResponse } from '../common';
import { LoginUserDto } from './dto/login-user.dto';
import { DeviceIdGuard } from './guards/general.guard';
import { AccessTokenDto, VerifyEmailDto } from './dto/return-value.dto';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthLocalService) {}

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
  ): Promise<CommonResponse<VerifyEmailDto>> {
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

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async reVerify(
    @Body('email') email: string,
  ): Promise<CommonResponse<VerifyEmailDto>> {
    Logger.debug('[AUTH CTR] Incoming re-verify email request');

    const payload = await this.authService.reverifyEmail(email);

    return {
      message: 'Re-verify email successfully',
      data: payload,
    };
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Query('token') token: string,
    @Query('email') email: string,
  ): Promise<CommonResponse<CreateUserDtoResponse>> {
    Logger.debug('[AUTH CTR] Incoming verify email request');
    console.log(token, email);

    const payload = await this.authService.verifyEmail(token, email);

    return {
      message: 'Verify email successfully',
      data: payload,
    };
  }
}
