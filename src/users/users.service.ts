import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import * as argon2 from 'argon2';


@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async findByUsername(username: string) {
        return await this.prisma.user.findUnique({
            where: { username: username },
        })
    }
    async findByEmail(email: string) {
        return await this.prisma.user.findUnique({
            where: { email },
        })
    }
    async findById(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        })
        if (!user) {
			throw new NotFoundException(
				'The user was not found. Please check the entered data.'
			)
		}
    }

    async create(
        email: string,
        password: string,
        username: string,
        avatar: string,
    ) {
        // Хеширование пароля 
        const hashedPassword = await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 65536,
        });

        // Создание пользователя
        const user = await this.prisma.user.create({
            data: {
                email,
                username,
                password_hash: hashedPassword,
                avatar_url: avatar,
                status: 'OFFLINE'
            },
        });

        return user
    }
}
