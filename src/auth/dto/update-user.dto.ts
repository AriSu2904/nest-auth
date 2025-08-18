import { IsPhoneNumber, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsPhoneNumber('ID')
  phoneNumber: string;
}
