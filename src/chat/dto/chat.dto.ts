import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class ChatDTO {
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  chatId: number;
}
