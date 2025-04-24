import { Transform } from "class-transformer";
import { IsNumber, IsString, MaxLength, MinLength } from "class-validator";

export class UserFriendDto {
    @IsNumber()
    @Transform(({ value }) => parseInt(value, 10))
    userId: number
}
export class FriendRequestDto {
    @IsNumber()
    @Transform(({ value }) => parseInt(value, 10))
    requestId: number
}