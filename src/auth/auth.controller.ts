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
import { CreateUserDto } from './dto/create-user.dto';
import { CommonResponse } from '../common';
import { LoginUserDto } from './dto/login-user.dto';
import { DeviceIdGuard } from './guards/general.guard';
import {
  AccessTokenDto,
  TokenPayloadDto,
  UserGoogleProfileDto,
  VerifyEmailDto,
} from './dto/return-value.dto';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthGoogleService } from './auth-google.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthLocalService,
    private readonly authGoogleService: AuthGoogleService,
  ) {}

  private setCookie(name: string, res: Response, refreshToken: string) {
    res.cookie(name, refreshToken, {
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

    this.setCookie('refresh-token', res, token.refreshToken);

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

    this.setCookie('refresh-token', res, newToken.refreshToken);

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
    @Res() res: Response,
  ): Promise<void> {
    Logger.debug('[AUTH CTR] Incoming verify email request');
    console.log(token, email);

    const payload = await this.authService.verifyEmail(token, email);

    const template = `
    <html lang="en">
      <head><title>Email Verified</title></head>
      <body style="font-family:sans-serif; text-align:center; padding:2rem;">
        <h1>✅ Email verified successfully!</h1>
        <p>Your email <b>${payload.email}</b> has been verified.</p>
      </body>
    </html> `;

    res.send(template);
  }

  @Get('oauth2')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    return;
  }

  @Get('oauth2/redirect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    Logger.debug('[AUTH CTR] Incoming google auth redirect request');

    if (!req.user) {
      throw new Error('User not found');
    }

    const googleUser = req.user as UserGoogleProfileDto;

    const existUser = await this.authGoogleService.checkUser(googleUser);

    if (existUser === null) {
      this.setCookie('google-token', res, googleUser.idToken);

      return res.json({
        message: 'Initialize login with google successfully',
        data: googleUser,
      });
    }

    this.setCookie('refresh-token', res, existUser.refreshToken);

    return res.status(HttpStatus.CREATED).json({
      message: 'Login with google successfully',
      data: {
        accessToken: existUser.accessToken,
      },
    });
  }

  @Post('oauth2/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(DeviceIdGuard)
  async googleLogin(
    @Headers('x-device-id') deviceId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonResponse<AccessTokenDto>> {
    Logger.debug('[AUTH CTR] Incoming google login request');

    const googleToken: string = req.cookies['google-token'];
    const persona = req.body.persona;

    if (!googleToken) {
      throw new Error('Google token not found');
    }

    const newToken: TokenPayloadDto = await this.authGoogleService.login(
      googleToken,
      deviceId,
      persona,
    );

    this.setCookie('refresh-token', res, newToken.refreshToken);

    return {
      message: 'Login with google successfully',
      data: {
        accessToken: newToken.accessToken,
      },
    };
  }
}
