import { IsOptional, IsString } from "class-validator";

export class RequestTypeDto {
    @IsString()
    @IsOptional()
    type?: string
}