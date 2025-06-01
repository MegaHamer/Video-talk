import { forwardRef, Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from 'src/users/users.module';
import { MulterModule } from '@nestjs/platform-express';
import { ChatGateway } from './chat.gateway';
import { ConfigModule } from '@nestjs/config';
import { SocketSessionMiddleware } from './middleware/socket.middleware';
import { MediasoupService } from 'src/mediasoup/mediasoup.service';
import { MediasoupModule } from 'src/mediasoup/mediasoup.module';

@Module({
  imports: [
    UsersModule,
    MulterModule.register({
      dest: './uploads', // Временная папка для файлов
    }),
    ConfigModule,
    forwardRef(() => MediasoupModule),
  ],
  controllers: [ChatController],
  providers: [PrismaService, ChatService, ChatGateway, SocketSessionMiddleware],
  exports: [ChatService],
})
export class ChatModule {}
