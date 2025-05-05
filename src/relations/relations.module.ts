import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from 'src/users/users.module';
import { RelationsService } from './relations.service';
import { RelationsController } from './relations.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads', // Временная папка для файлов
    }),
    UsersModule,
  ],
  controllers: [RelationsController],
  providers: [RelationsService, PrismaService],
})
export class RelationsModule {}
