import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { FileInterceptor, NoFilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import { ChatRole, User } from 'prisma/src/generated/prisma/client';
import {
  BodyAndParam,
  BodyAndParamAndQuery,
  ParamAndQuery,
} from 'src/libs/common/decorators/body-and-param.decorator';
import {
  AddGroupChatDto,
  BodyChangeChatDTO,
  ChangeChatDTO,
  CreateGroupChatDto,
  CreatePrivateChatDto,
  ParamsChatDTO,
  ParamsDTO,
  SendMessageDto,
} from './chat.dto';
import { classToPlain, plainToClass, plainToInstance } from 'class-transformer';
import { ChatResponseDto } from 'src/entities/chat.entity';
import { ChatRoles } from 'src/auth/decorators/chatRoles.decorator';
import { ChatDTO } from './dto/chat.dto';
import { RecipientsDTO } from './dto/recipients.dto';
import { ApiConsumes, ApiParam } from '@nestjs/swagger';
import { multerOptions } from './config/multer.config';
import { UpdateChatDto } from './dto/update.dto';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // @HttpCode(HttpStatus.OK)
  // @Get('')
  // async getChats(@CurrentUser() user: User) {
  //   // return this.chatService.getAllChats(user.id);
  // }

  @HttpCode(HttpStatus.OK)
  @Post('')
  async createChat(
    @CurrentUser() user: User,
    @Body() { recipients }: RecipientsDTO,
  ) {
    return await this.chatService.generate_room('', user.id);
  }

  @HttpCode(HttpStatus.NO_CONTENT) //ok
  @Delete(':chatId')
  @ApiParam({ name: 'chatId' })
  async deleteChat(@CurrentUser() user: User, @Param() { chatId }: ChatDTO) {
    // return await this.chatService.leaveChat(user.id, chatId);
  }

  @Get('check-room/:chatId')
  async checkRoom(@Param() { chatId }: ChatDTO) {
    const exists = await this.chatService.fetchChat(chatId);
    return { available: !!exists };
  }

  // @HttpCode(HttpStatus.OK)
  // @ApiConsumes('multipart/form-data')
  // @ApiParam({ name: 'chatId' })
  // @Patch(':chatId')
  // @UseInterceptors(FileInterceptor('icon', multerOptions))
  // async updateChat(
  //   @CurrentUser() user: User,
  //   @Body() dto: UpdateChatDto,
  //   @Param() { chatId }: ChatDTO,
  //   @UploadedFile() iconFile?: Express.Multer.File,
  // ) {
  //   dto.icon = iconFile !== undefined ? iconFile : dto.icon;
  //   // return this.chatService.updateChat(user.id, chatId, dto);
  // }

  // @HttpCode(HttpStatus.OK)
  // @Put(':chatId/recipients/:userId')
  // async addRecipients() {}

  // @HttpCode(HttpStatus.OK)
  // @Delete(':chatId/recipients/:userId')
  // async deleteRecipients() {}

  // @HttpCode(HttpStatus.OK)
  // @Get(':chatId/recipients')
  // async getRecipients() {}

  // @HttpCode(HttpStatus.OK)
  // @Get("all")
  // async getAllChats(@CurrentUser() user: User) {
  //   return await this.chatService.getAllChats(user)
  // }

  // @HttpCode(HttpStatus.OK)
  // @Get("visible")
  // async getVisibleChats(@CurrentUser() user: User) {
  //   return await this.chatService.getVisibleChats(user)
  // }

  // @HttpCode(HttpStatus.OK)
  // @Patch(":id/hide")
  // async hideChat(@CurrentUser() user: User, @Param() params: ParamsChatDTO) {
  //   return await this.chatService.hideChat(user, params)
  // }

  // @HttpCode(HttpStatus.OK)
  // @Patch(":id/show")
  // async showChat(@CurrentUser() user: User, @Param() params: ParamsChatDTO) {
  //   return await this.chatService.hideChat(user, params)
  // }

  // @HttpCode(HttpStatus.CREATED)
  // @Post("private")
  // @UseInterceptors(NoFilesInterceptor())
  // async createPrivateChat(@CurrentUser() user: User, @Body() body: CreatePrivateChatDto) {
  //   const chat = await this.chatService.createPrivateChat(user, body)
  //   return plainToInstance(ChatResponseDto, chat);
  // }

  // @HttpCode(HttpStatus.CREATED)
  // @Post("group")
  // @UseInterceptors(NoFilesInterceptor())
  // async createGroupChat(@CurrentUser() user: User, @Body() createGroupChatDto: CreateGroupChatDto) {
  //   const chat = await this.chatService.createGroupChat(user, createGroupChatDto)
  //   return plainToInstance(ChatResponseDto, chat);
  // }

  // @HttpCode(HttpStatus.OK)
  // @Delete(':id/leave')
  // async leaveChat(@CurrentUser() user: User, @Param() paramsDTO: ParamsChatDTO) {
  //   return await this.chatService.leaveGroup(user, paramsDTO)
  // }

  // @ChatRoles('OWNER')
  // @HttpCode(HttpStatus.OK)
  // @Patch(":chatId")
  // @UseInterceptors(FileInterceptor('image'))
  // async changeChat(
  //   @UploadedFile(
  //     new ParseFilePipeBuilder()
  //       .addFileTypeValidator({
  //         fileType: /(jpg|jpeg|png|webp)$/,
  //       })
  //       .addMaxSizeValidator({
  //         maxSize: 1000
  //       })
  //       .build({
  //         fileIsRequired: false,
  //         errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
  //       })) image: Express.Multer.File,
  //   @CurrentUser() user: User,
  //   @Body() body: BodyChangeChatDTO,
  //   @Param() params: ParamsChatDTO
  // ) {
  //   const BodyAndParam = { body: body, params: params }
  //   return await this.chatService.changeChat(user, BodyAndParam, image)
  // }

  // @ChatRoles('OWNER','MEMBER')
  // @HttpCode(HttpStatus.CREATED)
  // @Post(":chatId/add")
  // @UseInterceptors(NoFilesInterceptor())
  // async addUser(
  //   @CurrentUser() user: User,
  //   @Param() Param: ParamsChatDTO,
  //   @Body() body: AddGroupChatDto
  // ) {
  //   const bodyAndParam = { ...Param, ...body }
  //   return await this.chatService.addUserToChat(user, bodyAndParam)
  // }
}
