import { ConflictException, Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';
import { Document, WithId, WithoutId } from 'mongodb';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async throwIfExist(
    persona: string,
    isRegister: boolean = false,
  ): Promise<WithId<Document>> {
    const existUser: WithId<Document> =
      await this.userRepository.findByPersona(persona);

    if (existUser && isRegister) {
      throw new ConflictException('User already exists');
    }

    return existUser;
  }

  async createUser(user: WithoutId<Document>) {
    await this.throwIfExist(user.persona, true);

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
    const existUser: WithId<Document> = await this.throwIfExist(
      user.persona,
      false,
    );

    existUser.persona = user.persona;
    existUser.firstName = user.firstName;
    existUser.lastName = user.lastName;
    existUser.email = user.email;
    existUser.phoneNumber = user.phoneNumber;

    return this.userRepository.updateUser(existUser);
  }

  async myProfile(persona: string) {
    return this.userRepository.findByPersona(persona);
  }
}
