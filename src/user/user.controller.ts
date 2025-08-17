import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from '../auth/dto/update-user.dto';
import { CommonResponse } from '../common';

@Controller('profiles')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(): Promise<CommonResponse<any>> {
    const user = await this.userService.myProfile('Aniyah23');

    return {
      status: HttpStatus.OK,
      message: 'Success fetch profile',
      data: user,
    };
  }

  @Post()
  async updateProfile(
    @Body() user: UpdateUserDto,
  ): Promise<CommonResponse<any>> {
    const updatedUser = await this.userService.updateUser(user);

    return {
      status: HttpStatus.OK,
      message: 'Update successfully',
      data: updatedUser,
    };
  }
}
