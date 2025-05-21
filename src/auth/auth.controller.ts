import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { NoAuth } from './decorators/noAuth.decorator';
import { FileInterceptor, NoFilesInterceptor } from '@nestjs/platform-express';
import { User } from 'prisma/src/generated/prisma/client';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import { RegisterDto } from './dto/register.dto';
import { Request, Response } from 'express';
import { LoginUserDto } from './dto/login.dto';
import { ApiConsumes } from '@nestjs/swagger';
import { multerOptions } from './config/multer.config';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @NoAuth()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  @Post('login')
  @UseInterceptors(NoFilesInterceptor()) //form-data without files
  signIn(
    @Req() req: Request,
    @Body() signInDto: LoginUserDto,
    // @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signIn(req, signInDto);
  }

  @NoAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, res);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user);
  }

  @NoAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UsePipes(new ValidationPipe())
  @UseInterceptors(FileInterceptor('avatar', multerOptions)) //form-data with file
  @Post('register')
  register(
    @Req() req: Request,
    @Body() dto: RegisterDto,
    @UploadedFile() avatarFile?: Express.Multer.File,
  ) {
    dto.avatar = avatarFile !== undefined ? avatarFile : dto.avatar;
    return this.authService.register(req, dto);
  }

  // @HttpCode(HttpStatus.OK)
  //   @ApiConsumes('multipart/form-data')
  //   @Patch('')
  //   @UseInterceptors(FileInterceptor('icon', multerOptions))
  //   async updateChat(
  //     @CurrentUser() user: User,
  //     @Body() dto: UpdateUserDto,
  //     @Param() { chatId }: ChatDTO,
  //     @UploadedFile() iconFile?: Express.Multer.File,
  //   ) {
  //     dto.icon = iconFile !== undefined ? iconFile : dto.icon;
  //     return this.chatService.updateChat(user.id, chatId, dto);
  //   }
}
