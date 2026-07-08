import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
