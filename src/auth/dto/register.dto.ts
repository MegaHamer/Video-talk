import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsNotEmpty,
  Validate,
  IsOptional,
} from 'class-validator';
import { IsPasswordsMatchingConstraint } from 'src/libs/common/decorators/password-matching.decorator';

export class RegisterDto {
  @ApiProperty({
    description: 'Логин',
    required: true,
    example: 'MyUsername',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^\S+$/, {
    message: 'The username must not contain spaces',
  })
  username: string;

  @ApiProperty({
    description: 'Почта',
    required: true,
    example: 'email@mail.ru',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Аватар',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  avatar?: Express.Multer.File | null;

  @ApiProperty({
    description: 'Пароль',
    required: true,
    example: 'Qwert123',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/, {
    message:
      'The password must contain at least 1 digit, 1 lowercase letter, 1 uppercase letter',
  })
  password: string;

  @ApiProperty({
    description: 'Повтор пароля',
    required: true,
    example: 'Qwert123',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/, {
    message:
      'The password must contain at least 1 digit, 1 lowercase letter, 1 uppercase letter',
  })
  @Validate(IsPasswordsMatchingConstraint)
  passwordRepeat: string;
}
