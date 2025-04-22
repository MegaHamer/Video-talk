import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator"

export class LoginUserDto {
    @IsString()
    username: string

    @IsString()
    password: string
}

export class RegisterDto {
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    username: string

    @IsString()
    @MinLength(8)
    @MaxLength(32)
    @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/, {
        message: 'The password must contain at least 1 digit, 1 lowercase letter, 1 uppercase letter',
    })
    password: string
    
    @IsEmail()
    email: string
}