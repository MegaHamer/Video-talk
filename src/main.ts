import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionsFilter } from './prisma-exception.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //prisma exceptions catcher
  app.useGlobalFilters(new PrismaExceptionsFilter());

  //auto validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,  
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
