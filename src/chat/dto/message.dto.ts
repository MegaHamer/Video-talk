import { Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class MessageDTO {
  @IsString()
  chatId: string;
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  messageId: number;
}
