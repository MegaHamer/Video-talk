import { Transform } from "class-transformer";
import { IsNumber } from "class-validator";

export class UserProfileDto {
    @IsNumber()
    @Transform(({ value }) => parseInt(value, 10))
    userId: number
}