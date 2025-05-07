import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateChatDto {
  @ApiProperty({
    description: 'Новое название чата',
    required: false,
    example: 'Мой чат',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiProperty({
    description: 'Новая иконка чата (файл)',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  icon?: Express.Multer.File | null;

  @ApiProperty({
    description: 'ID нового владельца чата',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: 'Owner ID must be a valid number',
    },
  )
  @IsNotEmpty({ message: 'Owner ID cannot be empty' })
  @Transform(({ value }) => { console.log("value")
    return !value ? null : Number(value);
  })
  owner?: number;
}
