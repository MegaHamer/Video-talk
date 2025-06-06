import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as argon2 from 'argon2';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { UpdateUserDto } from './dto/update.dto';

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
        globalName: username,
        email,
        username,
        password_hash: hashedPassword,
        avatar_url: avatar,
        // status: 'OFFLINE',
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
      // status: user.status,
      globalName: user.globalName,
    };
  }

  async updateUser(userId: number, dto: UpdateUserDto) {
    const user = await this.findById(userId);

    const { globalName, avatar } = dto;

    let avatarPath = user.avatar_url || null;
    if (avatar !== undefined) {
      if (user.avatar_url) {
        avatarPath = null;
        this.deleteIconFile(user.avatar_url);
      }
      if (avatar) {
        avatarPath = this.getIconPath(avatar);
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        globalName: dto.globalName ?? user.globalName,
        avatar_url: avatarPath ?? '',
      },
    });

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      avatar: updatedUser.avatar_url,
      email: updatedUser.email,
      // status: user.status,
      globalName: updatedUser.globalName,
    };
  }

  private getIconPath(file: Express.Multer.File): string {
    return `/uploads/user-avatar/${file.filename}`;
  }

  private deleteIconFile(path: string): void {
    const fullPath = join(process.cwd(), path);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
    }
  }
}
