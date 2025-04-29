import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { $Enums, User } from "prisma/src/generated/prisma/client"
import { ROLES_KEY } from "../decorators/chatRoles.decorator"
import { PrismaService } from "src/prisma.service"


@Injectable()
export class RolesGuard implements CanActivate {
    public constructor(
        private prisma: PrismaService,
        private readonly reflector: Reflector
    ) { }

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const roles = this.reflector.getAllAndOverride<$Enums.ChatRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ])
        if (!roles) return true

        const request = context.switchToHttp().getRequest()
        const user = request.currentUser as User
        const chatId = Number(request.params.chatId);

        if (!chatId) return true

        const chatMember = await this.prisma.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId: user.id } },
            select: { role: true, chat: { select: { type: true } } }
        })
        if (!chatMember) throw new NotFoundException("Chat not found")
        if (chatMember.chat.type != "GROUP") throw new BadRequestException("Chat is not group")

        if (!roles.includes(chatMember.role)) {
            throw new ForbiddenException(
                "Not enough rights. You don't have access rights to this resource."
            )
        }

        return true
    }
}