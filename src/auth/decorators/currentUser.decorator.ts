import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "prisma/src/generated/prisma/client";

export const CurrentUser = createParamDecorator(
    (data: keyof User, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.currentUser

        return data ? user[data] : user;
    },
);