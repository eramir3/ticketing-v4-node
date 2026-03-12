import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthClient } from './auth.client';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_KEY,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthClient],
})
export class AuthModule { }
