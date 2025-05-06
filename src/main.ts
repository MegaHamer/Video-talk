import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionsFilter } from './prisma-exception.filter';
import { ValidationPipe } from '@nestjs/common';

import * as cookieParser from 'cookie-parser'
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import * as pgSession from 'connect-pg-simple';
import { ms, StringValue } from './libs/common/utils/ms.util';
import { parseBoolean } from './libs/common/utils/parse-boolean.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService)

  app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')))

  //prisma exceptions catcher
  app.useGlobalFilters(new PrismaExceptionsFilter());

  //auto validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    })
  );

  const PgStore = pgSession(session);

  app.use(session({
    secret: config.getOrThrow<string>("SESSION_SECRET"),
    name: config.getOrThrow<string>("SESSION_NAME"),
    resave: true,
    saveUninitialized: false,
    cookie:{
      domain:config.getOrThrow<string>("SESSION_DOMAIN"),
      maxAge: ms(config.getOrThrow<StringValue>("SESSION_MAX_AGE")),
      httpOnly:parseBoolean(config.getOrThrow<string>("SESSION_HTTP_ONLY")),
      secure:parseBoolean(config.getOrThrow<string>("SESSION_SECURE")),
      sameSite:'lax'
    },
    store: new PgStore({
      conString: config.getOrThrow<string>("POSTGRES_URI"),
      tableName:'session',
      createTableIfMissing:true,
    })
  }))

  app.enableCors({
    origin: config.getOrThrow<string>("ALLOWED_ORIGIN"),
    credentials: true,
    exposedHeaders: ['set-cookie']
  })

  await app.listen(config.getOrThrow<number>("APPLICATION_PORT"));
}
bootstrap();
