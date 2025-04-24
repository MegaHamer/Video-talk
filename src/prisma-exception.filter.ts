import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError) // Ловим ТОЛЬКО ошибки Prisma
export class PrismaExceptionsFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = 500;
    let message = 'Database error';

    // Обрабатываем специфичные коды ошибок Prisma
    switch (exception.code) {
      case 'P1000':
        message = 'Authentication failed for database';
        status = 401;
        break;
      case 'P1001':
        message = 'Cannot connect to database server';
        status = 503;
        break;
      case 'P2002':
        message = 'Unique constraint violation';
        status = 409;
        break;
      // Добавьте другие коды по необходимости
    }

    response.status(status).json({
      statusCode: status,
      message,
      prismaCode: exception.code, // Опционально: возвращаем код ошибки Prisma
    });
  }
}