import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthClient } from './auth.client';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthClient],
})
export class AuthModule { }
