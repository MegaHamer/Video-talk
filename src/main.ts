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
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configSwagger = new DocumentBuilder()
    .setTitle('Video-talk')
    .setDescription('The video-talk API description')
    .setVersion('1.0')
    .addTag('video-talk')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, documentFactory);

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

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(config.getOrThrow<number>("APPLICATION_PORT"));
}
bootstrap();
