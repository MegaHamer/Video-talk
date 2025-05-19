import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { NoFilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import { User } from 'prisma/src/generated/prisma/client';
import { UsernameDto } from 'src/relations/dto/username.dto';
import { RelationsService } from 'src/relations/relations.service';
import { RequestTypeDto } from 'src/relations/dto/requestType.dto';
import { UserProfileDto } from './dto/profile.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly relationsService: RelationsService,
  ) {}

  @Get(':userId/profile')
  async getProfile(
    @CurrentUser() user: User,
    @Param() reciever: UserProfileDto,
  ) {
    return await this.usersService.getProfile(reciever.userId);
  }
  @Get('profile')
  async getMyProfile(
    @CurrentUser() user: User,
  ) {
    return await this.usersService.getProfile(user.id);
  }
}
