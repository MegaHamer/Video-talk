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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor, NoFilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import { User } from 'prisma/src/generated/prisma/client';
import { UsernameDto } from 'src/relations/dto/username.dto';
import { RelationsService } from 'src/relations/relations.service';
import { RequestTypeDto } from 'src/relations/dto/requestType.dto';
import { UserProfileDto } from './dto/profile.dto';
import { UpdateUserDto } from './dto/update.dto';
import { ApiConsumes, ApiParam } from '@nestjs/swagger';
import { multerOptions } from './config/multer.config';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly relationsService: RelationsService,
  ) {}

  @Get(':userId/profile')
  @ApiParam({ name: 'userId' })
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

  @Put('me')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', multerOptions))
  async updateUser(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto,
    @UploadedFile() avatarFile?: Express.Multer.File,
  ) {
    dto.avatar = avatarFile !== undefined ? avatarFile : dto.avatar;
    console.log(typeof dto.avatar, typeof avatarFile)
    return this.usersService.updateUser(user.id, dto);
  }
  //  @Get('check-username')
  // async checkUsername(@Query('username') username: string) {
  //   const exists = await this.userService.usernameExists(username);
  //   return { available: !exists };
  // }

  // @Get('check-email')
  // async checkEmail(@Query('email') email: string) {
  //   const exists = await this.userService.emailExists(email);
  //   return { available: !exists };
  // }
}
