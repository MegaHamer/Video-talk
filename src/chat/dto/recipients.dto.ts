import { Transform, Type } from "class-transformer";
import { ArrayUnique, IsArray, IsNumber, IsOptional } from "class-validator";

export class RecipientsDTO {
    @IsArray({ message: 'Recipients must be an array' })
    @IsOptional() // Разрешаем отсутствие значения (undefined)
    @ArrayUnique({
        message: 'Recipients list contains duplicate user IDs'
    })
    @IsNumber({}, { 
        each: true,
        message: 'Each recipient ID must be a number' 
    })
    @Transform(({ value }) => {
        // Обрабатываем пустую строку или null как пустой массив
        if (value === '' || value === null) {
            return [];
        }
        
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                return value.split(',').map(Number);
            }
        }
        return value;
    })
    // @Type(() => Number)
    recipients: number[] = [];
}