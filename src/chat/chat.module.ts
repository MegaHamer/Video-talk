import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports:[
    UsersModule
  ],
  controllers: [ChatController],
  providers: [
    PrismaService,
    ChatService
  ],
})
export class ChatModule {}
