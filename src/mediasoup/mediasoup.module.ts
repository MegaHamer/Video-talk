import { Module, OnModuleInit } from '@nestjs/common';
import { MediasoupService } from './mediasoup.service';
import { MediasoupGateway } from './mediasoup.gateway';
import { SocketSessionMiddleware } from 'src/chat/middleware/socket.middleware';
import { ConfigModule } from '@nestjs/config';
import { MediasoupWorkerProvider } from './mediasoup-worker.provider';
import { ChatService } from 'src/chat/chat.service';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [ConfigModule, ChatModule],
  providers: [
    MediasoupService,
    MediasoupGateway,
    SocketSessionMiddleware,
    MediasoupWorkerProvider,
  ],
  exports: [],
})
export class MediasoupModule {}
