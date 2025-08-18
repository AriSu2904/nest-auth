import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';
import { Document, WithoutId } from 'mongodb';
import { CreateUserDtoResponse } from '../auth/dto/create-user.dto';
import { UserProfileDto, FullUserProfileDto } from '../auth/dto/session.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(user: WithoutId<Document>): Promise<CreateUserDtoResponse> {
    const existUser = await this.userRepository.findByPersona(user.persona);

    if (existUser) {
      throw new ConflictException('User already exist');
    }

    const salt: string = bcrypt.genSaltSync(10);
    const hashedPassword: string = bcrypt.hashSync(user.password, salt);

    const newUser = {
      persona: user.persona,
      email: user.email,
      password: hashedPassword,
    };

    await this.userRepository.create(newUser);

    return {
      persona: newUser.persona,
      email: newUser.email,
    };
  }

  async updateUser(user: WithoutId<Document>): Promise<UserProfileDto> {
    const existUser = await this.userRepository.findByPersona(user.persona);

    if (!existUser) {
      throw new UnauthorizedException('User not found');
    }

    existUser.persona = user.persona;
    existUser.firstName = user.firstName;
    existUser.lastName = user.lastName;
    existUser.email = user.email;
    existUser.phoneNumber = user.phoneNumber;

    await this.userRepository.updateUser(existUser);

    return {
      persona: existUser.persona,
      email: existUser.email,
      firstName: existUser.firstName,
      lastName: existUser.lastName,
      phoneNumber: existUser.phoneNumber,
    };
  }

  async myProfile(persona: string): Promise<UserProfileDto> {
    Logger.debug(`[USER SV] Fetching user profile with persona ${persona}`);

    const profile = await this.userRepository.findByPersona(persona);

    if (profile) {
      return {
        persona: profile.persona,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
      };
    }

    throw new UnauthorizedException('User not found');
  }

  async getProfileWithParam(param: string): Promise<FullUserProfileDto> {
    Logger.debug(`[USER SV] Fetching user profile with param ${param}`);

    const user = await this.userRepository.findByParam(param);

    return {
      id: user._id.toString(),
      persona: user.persona,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      password: user.password,
    };
  }
}
