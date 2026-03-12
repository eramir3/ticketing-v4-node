import { IsEmail, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @IsEmail({}, { message: 'Email must be valid' })
  email!: string;

  @IsNotEmpty({ message: 'You must supply password' })
  password!: string;
}