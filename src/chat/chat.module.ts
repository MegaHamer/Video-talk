import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from 'src/users/users.module';
import { MulterModule } from '@nestjs/platform-express';
import { ChatGateway } from './chat.gateway';
import { ConfigModule } from '@nestjs/config';
import { SocketSessionMiddleware } from './middleware/socket.middleware';

@Module({
  imports: [
    UsersModule,
    MulterModule.register({
      dest: './uploads', // Временная папка для файлов
    }),
    ConfigModule,
  ],
  controllers: [ChatController],
  providers: [PrismaService, ChatService, ChatGateway, SocketSessionMiddleware],
})
export class ChatModule {}
