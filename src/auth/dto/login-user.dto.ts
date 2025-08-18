import { IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsString()
  persona: string;

  @IsString()
  @MinLength(5)
  password: string;
}
