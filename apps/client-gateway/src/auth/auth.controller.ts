import { type Request } from 'express';
import { Body, Controller, HttpCode, HttpStatus, Req, Post, Get, All, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from '../auth/dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { AuthGuard, CurrentUser, TicketingUser } from '@org/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body() dto: SignUpDto, @Req() req: Request) {
    return this.authService.signUp(dto, req);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: SignInDto, @Req() req: Request) {
    return await this.authService.signIn(dto, req)
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async signOut(@Req() req: Request) {
    return await this.authService.signOut(req)
  }

  @Get('current-user')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  currentUser(@CurrentUser() user: TicketingUser) {
    return { currentUser: user }
  }

  @All('*')
  @HttpCode(HttpStatus.NOT_FOUND)
  handleNotFound() {
    throw new Error('Not found');
  }
}
