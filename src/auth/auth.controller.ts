import { Body, Controller, FileTypeValidator, Get, HttpCode, HttpStatus, MaxFileSizeValidator, ParseFilePipe, ParseFilePipeBuilder, Post, Request, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterDto } from './auth.dto';
import { NoAuth } from '../decorators/noAuth.decorator';
import { FileInterceptor, NoFilesInterceptor } from '@nestjs/platform-express';
import { User } from 'prisma/src/generated/prisma/client';
import { CurrentUser } from 'src/decorators/currentUser.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @NoAuth()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  @Post('login')
  @UseInterceptors(NoFilesInterceptor())//form-data without files
  signIn(@Body() signInDto: LoginUserDto) {
    return this.authService.signIn(signInDto)
  }

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user)
  }

  @NoAuth()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe())
  @UseInterceptors(FileInterceptor('avatar'))//form-data with file
  @Post('register')
  registration(@UploadedFile(
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
      }),) avatar: Express.Multer.File,
    @Body() dto: RegisterDto) {
    return this.authService.createUser(dto);
  }
}
