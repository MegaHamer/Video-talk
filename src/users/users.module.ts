import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma.service';
import { RelationsService } from 'src/relations/relations.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, RelationsService],
  exports: [UsersService],
})
export class UsersModule {}
