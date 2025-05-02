import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { jwtConstants } from '../constants';
import { Reflector } from '@nestjs/core';
import { IS_NO_AUTH_KEY } from '../decorators/noAuth.decorator';
import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private prisma: PrismaService,
    private readonly userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isNoAuth = this.reflector.getAllAndOverride<boolean>(IS_NO_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isNoAuth) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    //jwt auth
    const token = this.extractTokenFromHeader(request);
    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: jwtConstants.secret,
        });
        const userFromDb = await this.prisma.user.findFirst({
          where: { id: payload.sub },
        });
        request.currentUser = userFromDb;
        return true;
      } catch {
        
      }
    }
    //session auth
    if (typeof request.session.userId === 'undefined') {
      throw new UnauthorizedException(
        'The user is not logged in. Please log in to gain access.',
      );
    }
    const user = await this.userService.findById(request.session.userId);

    request.currentUser = user;

    return true;
  }
  extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
