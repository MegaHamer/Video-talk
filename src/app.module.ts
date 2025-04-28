import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { FriendsModule } from './friends/friends.module';
import { PrismaService } from './prisma.service';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [UsersModule, AuthModule, FriendsModule, ChatModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    PrismaService,
  ],
})
export class AppModule { }
