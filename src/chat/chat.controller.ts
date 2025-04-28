import { Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { FileInterceptor, NoFilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/decorators/currentUser.decorator';
import { User } from 'prisma/src/generated/prisma/client';
import { BodyAndParam, BodyAndParamAndQuery, ParamAndQuery } from 'src/decorators/body-and-param.decorator';
import { CreateGroupChatDto, CreatePrivateChatDto, ParamsChatDTO, ParamsDTO, SendMessageDto } from './chat.dto';
import { classToPlain, plainToClass, plainToInstance } from 'class-transformer';
import { ChatResponseDto } from 'src/entities/chat.entity';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @HttpCode(HttpStatus.OK)
  @Get("all")
  async getAllChats(@CurrentUser() user: User) {
    return await this.chatService.getAllChats(user)
  }

  @HttpCode(HttpStatus.OK)
  @Get("visible")
  getVisibleChats(@CurrentUser() user: User) {
    return [
      {
        id: 1,
        name: 'chat 1',
        status: "ACTIVE",
        image_url: [
          {
            url: "http://localhost/user1.png"
          },
          {
            url: "http://localhost/user2.png"
          }
        ]
      },
      {
        id: 2,
        name: 'chat 2',
        status: "OFFLINE",
        image_url: "http://localhost/chat2.png"
      },
    ]
  }

  @HttpCode(HttpStatus.OK)
  @Patch(":id/hide")
  hideChat(@CurrentUser() user: User) {
    return {
      "success": true,
      "message": "Чат скрыт"
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @Post("private")
  @UseInterceptors(NoFilesInterceptor())
  async createPrivateChat(@CurrentUser() user: User, @Body() body: CreatePrivateChatDto) {
    const chat = await this.chatService.createPrivateChat(user, body)
    return plainToInstance(ChatResponseDto, chat);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post("group")
  @UseInterceptors(NoFilesInterceptor())
  async createGroupChat(@CurrentUser() user: User, @Body() createGroupChatDto: CreateGroupChatDto) {
    const chat = await this.chatService.createGroupChat(user, createGroupChatDto)
    return plainToInstance(ChatResponseDto, chat);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id/leave')
  async leaveChat(@CurrentUser() user: User, @Param() paramsDTO: ParamsChatDTO) {
    return await this.chatService.leaveGroup(user, paramsDTO)
    // {
    //   "success": true,
    //   "message": "Вы вышли из чата"
    // }
  }

  @HttpCode(HttpStatus.OK)
  @Patch(":id")
  changeChat(@CurrentUser() user: User) {
    return {
      "id": 2,
      "name": "Новое название",
      "avatar": "https://storage.com/chats/2.jpg"
    }
  }




  // @HttpCode(HttpStatus.OK)
  // @Get(':id/messages')
  // getMessagesList(@CurrentUser() user: User, @ParamAndQuery() paramsAndQuery: GetMessagesDto) {
  //   return this.chatService.getMessagesOfChat(user, paramsAndQuery)
  // }

  // @HttpCode(HttpStatus.OK)
  // @Post(':id/messages')
  // @UseInterceptors(FileInterceptor('files'))
  // @UseInterceptors(NoFilesInterceptor())
  // sendMessage(@CurrentUser() user: User, @BodyAndParam() sendMessageDto: SendMessageDto) {
  //   return this.chatService.sendMessage(user, sendMessageDto)
  // }
}
