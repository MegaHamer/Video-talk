import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma.service';
import * as argon2 from 'argon2';
import { User } from 'prisma/src/generated/prisma/client';
import { RegisterDto } from './dto/register.dto';
import { Request, Response } from 'express';
import { LoginUserDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import session from 'express-session';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private userService: UsersService,
    private jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async signIn(req: Request, dto: LoginUserDto) {
    const { email, password } = dto;
    const user = await this.userService.findByEmail(email);

    if (!user || !(await argon2.verify(user.password_hash, password))) {
      throw new UnauthorizedException('Incorrect email or password');
    }
    const payload = { sub: user.id, username: user.username };
    this.saveSession(req, user);
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register(req: Request, dto: RegisterDto) {
    const { email, password, username } = dto;
    const existingUser = await this.userService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('The user with this email already exists');
    }

    const newUser = await this.userService.create(
      email,
      password,
      username,
      '',
    );

    // Генерация JWT-токена
    const payload = { sub: newUser.id, username: newUser.username };
    const accessToken = this.jwtService.sign(payload);

    this.saveSession(req, newUser);

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
        id: user.id,
      },
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          return reject(
            new InternalServerErrorException(
              'Failed to end the session. There may be a problem with the server or the session has already been completed.',
            ),
          );
        }
        res.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'));
        resolve();
      });
    });
  }
  async saveSession(req: Request, user: User) {
    return new Promise((resolve, reject) => {
      req.session.userId = user.id;

      req.session.save((err) => {
        if (err) {
          return reject(
            new InternalServerErrorException(
              "Couldn't save the session. Check if the session settings are configured correctly.",
            ),
          );
        }

        resolve({
          user,
        });
      });
    });
  }
}
