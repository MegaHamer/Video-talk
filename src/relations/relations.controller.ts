import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  Request,
  Get,
  Delete,
  Put,
  Param,
} from '@nestjs/common';
import { NoFilesInterceptor } from '@nestjs/platform-express';
import { UsersService } from 'src/users/users.service';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import { User } from 'prisma/src/generated/prisma/client';
import { RelationsService } from './relations.service';
import { RequestTypeDto } from './dto/requestType.dto';
import { UsernameDto } from './dto/username.dto';
import { UserRequestDto } from './dto/friend-id.dto';

@Controller('relationship')
export class RelationsController {
  constructor(
    private userService: UsersService,
    private readonly relationsService: RelationsService,
  ) {}

  // @Get('friends')
  // async getFriends(@CurrentUser() user: User) {
  //   return await this.relationsService.getFriends(user.id);
  // }
  // @Get('requests')
  // async getRequests(@CurrentUser() user: User) {
  //   return await this.relationsService.getRequests(user.id);
  // }
  // @Get('blocked')
  // async getBlocked(@CurrentUser() user: User) {
  //   return await this.relationsService.getBlocked(user.id);
  // }

  // @HttpCode(HttpStatus.NO_CONTENT)
  // @Delete(':userId')
  // async deleteRelation(
  //   @CurrentUser() user: User,
  //   @Param() reciever: UserRequestDto,
  // ) {
  //   return await this.relationsService.deleteRelation(user.id, reciever.userId);
  // }

  // @HttpCode(HttpStatus.NO_CONTENT)
  // @Put(':userId')
  // async createRelation(
  //   @CurrentUser() user: User,
  //   @Param() recieverId:UserRequestDto,
  //   @Body() body: RequestTypeDto,
  // ) {
  //   return await this.relationsService.changeRelation(
  //     user.id,
  //     recieverId.userId,
  //     body.type == 'block' ? 'block' : 'send/accept',
  //   );
  // }

  // @HttpCode(HttpStatus.NO_CONTENT)
  // @Post('')
  // async sendRelation(@CurrentUser() user: User, @Body() reciever: UsernameDto) {
  //   return await this.relationsService.createRelationByUsername(
  //     user.id,
  //     reciever.username,
  //   );
  // }
}
