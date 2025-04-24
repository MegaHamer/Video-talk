import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads', // Временная папка для файлов
    }),
    UsersModule,
  ],
  controllers: [FriendsController],
  providers: [
    FriendsService,
    PrismaService,
  ],
})
export class FriendsModule { }
