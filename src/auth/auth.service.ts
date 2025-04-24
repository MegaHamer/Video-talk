import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { LoginUserDto, RegisterDto } from './auth.dto';
import { PrismaService } from 'src/prisma.service';
import * as argon2 from 'argon2';
import { User } from 'prisma/src/generated/prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    async signIn(dto: LoginUserDto) {
        const user = await this.userService.findByUsername(dto.username)

        if (!user || ! await argon2.verify(user.password_hash, dto.password)) {
            throw new UnauthorizedException()
        }
        const payload = { sub: user.id, username: user.username };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    async createUser(
        dto: RegisterDto
    ) {
        const existingUser = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { username: dto.username }] },
        });

        if (existingUser) {
            throw new ConflictException('Пользователь с таким email или username уже существует');
        }

        // Хеширование пароля (bcrypt)
        const hashedPassword = await argon2.hash(dto.password, {
            type: argon2.argon2id,
            memoryCost: 65536,
        });

        // Создание пользователя
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                username: dto.username,
                password_hash: hashedPassword,
                avatar_url: "",
                status: 'OFFLINE'
            },
        });

        // Генерация JWT-токена
        const payload = { sub: user.id, username: user.username };
        const accessToken = this.jwtService.sign(payload);

        return { accessToken };
    }

    async getProfile(user: User) {
        return await this.prisma.user.findUnique({
            select: {
                id: true,
                username: true,
                email: true,
                avatar_url: true,
                status: true,
            },
            where: {
                id: user.id
            }
        })
    }
}
