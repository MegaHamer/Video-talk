import { Body, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { NoFilesInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("friend")
  @UseInterceptors(NoFilesInterceptor())
  sendFriendshipRequest(@Body() FriendRquestDto){
    
  }
}
