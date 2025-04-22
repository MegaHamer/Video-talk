import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';


@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async findByUsername(username: string) {
        return await this.prisma.user.findFirst({
            where: { username: username },
        })
    }
}
