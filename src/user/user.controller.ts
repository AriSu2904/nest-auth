import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from '../auth/dto/update-user.dto';
import { CommonResponse } from '../common';
import { CurrentUser } from '../decorators';
import { AuthGuard } from '@nestjs/passport';
import { FullUserProfileDto, UserProfileDto } from '../auth/dto/session.dto';

@Controller('profiles')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  async getProfile(
    @CurrentUser() user: FullUserProfileDto,
  ): Promise<CommonResponse<UserProfileDto>> {
    const currentProfile = await this.userService.myProfile(user.persona);

    return {
      message: 'Success fetch profile',
      data: currentProfile,
    };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Body() user: UpdateUserDto,
    @CurrentUser() userProfile: FullUserProfileDto,
  ): Promise<CommonResponse<UserProfileDto>> {
    const extractUser = {
      ...userProfile,
      ...user,
    };
    const updatedUser = await this.userService.updateUser(extractUser);

    return {
      message: 'Update successfully',
      data: updatedUser,
    };
  }
}
