import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from 'src/users/users.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    UsersModule,
    MulterModule.register({
      dest: './uploads', // Временная папка для файлов
    }),
  ],
  controllers: [ChatController],
  providers: [
    PrismaService,
    ChatService
  ],
})
export class ChatModule { }
