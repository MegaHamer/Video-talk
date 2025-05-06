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
  @UsePipes(new ValidationPipe())
  @UseInterceptors(FileInterceptor('avatar')) //form-data with file
  @Post('register')
  register(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|webp)$/,
        })
        .addMaxSizeValidator({
          maxSize: 1000,
        })
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    avatar: Express.Multer.File,
    @Req() req: Request,
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(req, dto);
  }
}
