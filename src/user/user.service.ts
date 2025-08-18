import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';
import { Document, WithoutId } from 'mongodb';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(user: WithoutId<Document>) {
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

  async updateUser(user: WithoutId<Document>) {
    const existUser = await this.userRepository.findByPersona(user.persona);

    if (!existUser) {
      throw new UnauthorizedException('User not found');
    }

    existUser.persona = user.persona;
    existUser.firstName = user.firstName;
    existUser.lastName = user.lastName;
    existUser.email = user.email;
    existUser.phoneNumber = user.phoneNumber;

    return this.userRepository.updateUser(existUser);
  }

  async myProfile(persona: string, passwordRequired: boolean = false) {
    Logger.debug(`[USER SV] Fetching user profile with persona ${persona}`);

    const profile = await this.userRepository.findByPersona(persona);

    if (profile) {
      return {
        persona: profile.persona,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        ...(passwordRequired && { password: profile.password }),
      };
    }

    throw new UnauthorizedException('User not found');
  }
}
