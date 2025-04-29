import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { jwtConstants } from "../constants";
import { Reflector } from "@nestjs/core";
import { IS_NO_AUTH_KEY } from "../decorators/noAuth.decorator";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const isNoAuth = this.reflector.getAllAndOverride<boolean>(IS_NO_AUTH_KEY, [
            context.getHandler(),
            context.getClass()
        ])
        if (isNoAuth) {
            return true
        }

        const request = context.switchToHttp().getRequest()
        const token = this.extractTokenFromHeader(request)
        if (!token) {
            throw new UnauthorizedException()
        }
        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: jwtConstants.secret
                }
            )
            const userFromDb = await this.prisma.user.findFirst({
                where: { id: payload.sub }
            });
            request.currentUser = userFromDb
        } catch {
            throw new UnauthorizedException()
        }
        return true
    }
    extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? []
        return type === 'Bearer' ? token : undefined
    }
}