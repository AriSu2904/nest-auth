import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CommonResponse } from '../common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() user: CreateUserDto): Promise<CommonResponse<any>> {
    const registeredUser = await this.authService.register(user);

    return {
      status: HttpStatus.CREATED,
      message: 'User created!',
      data: registeredUser,
    };
  }
}
