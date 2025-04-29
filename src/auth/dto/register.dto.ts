import { IsString, MinLength, MaxLength, Matches, IsEmail, IsNotEmpty, Validate } from "class-validator"
import { IsPasswordsMatchingConstraint } from "src/libs/common/decorators/password-matching.decorator"

export class RegisterDto {
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    username: string
    
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

    @IsString()
    @MinLength(6)
    @MaxLength(32)
    @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/, {
        message: 'The password must contain at least 1 digit, 1 lowercase letter, 1 uppercase letter',
    })
    @Validate(IsPasswordsMatchingConstraint)
    passwordRepeat: string
}