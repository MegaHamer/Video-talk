import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'имя',
    required: false,
    example: 'Имя новое',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  globalName?: string;

  @ApiProperty({
    description: 'Аватар',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  avatar?: Express.Multer.File | null;
}
