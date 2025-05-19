import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string) {
    return await this.prisma.user.findUnique({
      where: { username: username },
    });
  }
  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }
  async findById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new NotFoundException(
        'The user was not found. Please check the entered data.',
      );
    }
    return user;
  }

  async create(
    email: string,
    password: string,
    username: string,
    avatar: string,
  ) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });

    if (existingUser) {
      if (existingUser.email == email) {
        throw new ConflictException('The email is already busy');
      }
      if (existingUser.username == username) {
        throw new ConflictException('The username is already occupied');
      }
    }
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
        status: 'OFFLINE',
      },
    });

    return user;
  }

  async getProfile(userId: number) {
    const user = await this.findById(userId);

    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar_url,
      status:user.status
    };
  }
}
