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
import { FriendRequestDto } from './dto/friend-id.dto';

@Controller('relationship')
export class RelationsController {
  constructor(
    private userService: UsersService,
    private readonly relationsService: RelationsService,
  ) {}

  @Get('friends')
  async getFriends(@CurrentUser() user: User) {
    return await this.relationsService.getFriends(user.id);
  }
  @Get('requests')
  async getRequests(@CurrentUser() user: User) {
    return await this.relationsService.getRequests(user.id);
  }
  @Get('blocked')
  async getBlocked(@CurrentUser() user: User) {
    return await this.relationsService.getBlocked(user.id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':userId')
  async deleteRelation(
    @CurrentUser() user: User,
    @Param() reciever: FriendRequestDto,
  ) {
    return await this.relationsService.deleteRelation(user.id, reciever.userId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':userId')
  async createRelation(
    @CurrentUser() user: User,
    @Param('userId') recieverId,
    @Body() body: RequestTypeDto,
  ) {
    return await this.relationsService.changeRelation(
      user.id,
      recieverId,
      body.type == 'block' ? 'block' : 'send/accept',
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('')
  async sendRelation(@CurrentUser() user: User, @Body() reciever: UsernameDto) {
    return await this.relationsService.createRelationByUsername(
      user.id,
      reciever.username,
    );
  }

  // @HttpCode(HttpStatus.CREATED)
  // @UsePipes(new ValidationPipe())
  // @UseInterceptors(NoFilesInterceptor())
  // @Post('sendrequest')
  // sendFriendshipRequest(
  //   @Body() FriendRequestDto: UserFriendDto,
  //   @CurrentUser() user: User,
  // ) {
  //   return this.friendsService.sendRequest(user, FriendRequestDto);
  // }

  // @Get()
  // getListOfFriends(@Request() req, @CurrentUser() user: User) {
  //   return this.friendsService.listOfFriends(user);
  // }
  // @Get('requests')
  // getListOfFriendshipRequests(@Request() req, @CurrentUser() user: User) {
  //   return this.friendsService.listOfRequests(user);
  // }

  // @HttpCode(HttpStatus.NO_CONTENT)
  // // @UsePipes(new ValidationPipe({ transform: true }))
  // @UseInterceptors(NoFilesInterceptor())
  // @Post('accept')
  // acceptFriendRequest(
  //   @Body() acceptDto: FriendRequestDto,
  //   @CurrentUser() user: User,
  // ) {
  //   return this.friendsService.acceptRequest(user, acceptDto);
  // }

  // @HttpCode(HttpStatus.NO_CONTENT)
  // @UseInterceptors(NoFilesInterceptor())
  // @Post('deny')
  // async denyFriendRequest(
  //   @Body() denyDto: FriendRequestDto,
  //   @CurrentUser() user: User,
  // ) {
  //   return await this.friendsService.denyRequest(user, denyDto);
  // }
}
