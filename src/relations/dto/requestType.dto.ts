import { IsString } from "class-validator";

export class RequestTypeDto {
    @IsString()
    type: string
}