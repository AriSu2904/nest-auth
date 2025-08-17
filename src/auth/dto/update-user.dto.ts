import { IsEmail, IsPhoneNumber, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  persona: string;

  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsPhoneNumber('ID')
  phoneNumber: string;
}
