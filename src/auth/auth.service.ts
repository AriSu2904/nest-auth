import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async register(user: CreateUserDto) {
    return this.userService.createUser(user);
  }

  async update(user: UpdateUserDto) {
    return this.userService.updateUser(user);
  }
}
