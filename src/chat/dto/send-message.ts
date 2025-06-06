import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class SendMessageDto {
  @ApiProperty({
    description: 'Сообщение',
    required: false,
    example: 'Тествоое сообщение',

  })
  @IsString()
  @IsNotEmpty()
  content: string;
}