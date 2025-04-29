import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator"

export class LoginUserDto {
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsString()
    @MinLength(6)
    @MaxLength(32)
    @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/, {
        message: 'The password must contain at least 1 digit, 1 lowercase letter, 1 uppercase letter',
    })
    password: string
}