import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  persona: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(5) //min length 5 for development purpose
  password: string;
}

export interface CreateUserDtoResponse {
  persona: string;
  email: string;
  isVerified: boolean;
}
