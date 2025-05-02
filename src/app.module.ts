import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { FriendsModule } from './friends/friends.module';
import { PrismaService } from './prisma.service';
import { ChatModule } from './chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { IS_DEV_ENV } from './libs/common/utils/is-dev.util';
import { AuthGuard } from './auth/quard/auth.guard';
import { RolesGuard } from './auth/quard/chat-roles.guard';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    FriendsModule,
    ChatModule,
    ConfigModule.forRoot({
      ignoreEnvFile: !IS_DEV_ENV,
      isGlobal:true
    })
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    PrismaService,
  ],
})
export class AppModule { }
