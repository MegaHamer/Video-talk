import { Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseFilePipeBuilder, Patch, Post, Put, Query, UploadedFile, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { FileInterceptor, NoFilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import { ChatRole, User } from 'prisma/src/generated/prisma/client';
import { BodyAndParam, BodyAndParamAndQuery, ParamAndQuery } from 'src/libs/common/decorators/body-and-param.decorator';
import { AddGroupChatDto, BodyChangeChatDTO, ChangeChatDTO, CreateGroupChatDto, CreatePrivateChatDto, ParamsChatDTO, ParamsDTO, SendMessageDto } from './chat.dto';
import { classToPlain, plainToClass, plainToInstance } from 'class-transformer';
import { ChatResponseDto } from 'src/entities/chat.entity';
import { ChatRoles } from 'src/auth/decorators/chatRoles.decorator';

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
  async getVisibleChats(@CurrentUser() user: User) {
    return await this.chatService.getVisibleChats(user)
  }

  @HttpCode(HttpStatus.OK)
  @Patch(":id/hide")
  async hideChat(@CurrentUser() user: User, @Param() params: ParamsChatDTO) {
    return await this.chatService.hideChat(user, params)
  }

  @HttpCode(HttpStatus.OK)
  @Patch(":id/show")
  async showChat(@CurrentUser() user: User, @Param() params: ParamsChatDTO) {
    return await this.chatService.hideChat(user, params)
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
  }

  @ChatRoles('OWNER')
  @HttpCode(HttpStatus.OK)
  @Patch(":chatId")
  @UseInterceptors(FileInterceptor('image'))
  async changeChat(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|webp)$/,
        })
        .addMaxSizeValidator({
          maxSize: 1000
        })
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
        })) image: Express.Multer.File,
    @CurrentUser() user: User,
    @Body() body: BodyChangeChatDTO,
    @Param() params: ParamsChatDTO
  ) {
    const BodyAndParam = { body: body, params: params }
    return await this.chatService.changeChat(user, BodyAndParam, image)
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(":chatId/add")
  @UseInterceptors(NoFilesInterceptor())
  async addUser(
    @CurrentUser() user: User,
    @Param() Param: ParamsChatDTO,
    @Body() body: AddGroupChatDto
  ) {
    const bodyAndParam = { ...Param, ...body }
    return await this.chatService.addUserToChat(user, bodyAndParam)
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
