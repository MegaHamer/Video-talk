import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './auth.dto';
import { NoAuth } from '../decorators/noAuth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @NoAuth()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  @Post('login')
  signIn(@Body()signInDto:LoginUserDto){
    return this.authService.signIn(signInDto.username,signInDto.password)
  }

  
  @Get('profile')
  getProfile(@Request() req){
    return req.user
  }
}
