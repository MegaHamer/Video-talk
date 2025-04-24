import { Body, Controller, HttpCode, HttpStatus, Post, UseInterceptors, UsePipes, ValidationPipe, Request, Get } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendRequestDto, UserFriendDto } from './friends.dto';
import { NoFilesInterceptor } from '@nestjs/platform-express';
import { UsersService } from 'src/users/users.service';
import { CurrentUser } from 'src/decorators/currentUser.decorator';
import { User } from 'prisma/src/generated/prisma/client';

@Controller('friends')
export class FriendsController {
  constructor(
    private userService: UsersService,
    private readonly friendsService: FriendsService
  ) { }

  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe())
  @UseInterceptors(NoFilesInterceptor())
  @Post('sendrequest')
  sendFriendshipRequest(@Body() FriendRequestDto: UserFriendDto, @CurrentUser() user: User) {
    return this.friendsService.sendRequest(user, FriendRequestDto)
  }

  @Get('list')
  getListOfFriendsRequests(@Request() req, @CurrentUser() user: User) {
    return this.friendsService.listOfFriends(user)
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  // @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(NoFilesInterceptor())
  @Post('accept')
  acceptFriendRequest(@Body() acceptDto: FriendRequestDto, @CurrentUser() user: User) {
    return this.friendsService.acceptRequest(user, acceptDto)
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(NoFilesInterceptor())
  @Post('deny')
  denyFriendRequest(@Body() denyDto: FriendRequestDto, @CurrentUser() user: User) {
    return this.friendsService.denyRequest(user,denyDto)
  }
}
