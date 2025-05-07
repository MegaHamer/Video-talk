import { Injectable, NestMiddleware } from '@nestjs/common';
import { RequestHandler } from '@nestjs/common/interfaces';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import { ms, StringValue } from 'src/libs/common/utils/ms.util';
import { parseBoolean } from 'src/libs/common/utils/parse-boolean.util';

@Injectable()
export class SocketSessionMiddleware implements NestMiddleware {
  private sessionMiddleware:RequestHandler;

  constructor (private configService: ConfigService){
    const PgStore = require("connect-pg-simple")(session);
    const config = configService
    
      this.sessionMiddleware =session({
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
      })
  }

  use(client: any, next: (err?: Error) => void) {
    const req = client.request;
    const res = { 
      getHeader: () => {},
      setHeader: () => {},
      end: () => next() 
    };

    this.sessionMiddleware(req, res as any, (err) => {
      if (err) return next(err);
      if (!req.session?.userId) return next(new Error('Not authenticated'));
      client.request.session = req.session;
      next();
    });
  }
}
