import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type { TicketingUser } from '@org/common';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { SignInDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';
import { User } from './schemas/user.schema';

type AuthResponse = {
  user: TicketingUser;
  token: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtService: JwtService
  ) { }

  async signUp(dto: SignUpDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.userModel.exists({ email });

    if (existingUser) {
      throw new BadRequestException('Email in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      email,
      password: hashedPassword,
    });

    return this.buildAuthResponse(user.id, user.email);
  }

  async signIn(dto: SignInDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.userModel.findOne({ email }).select('+password').exec();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user.id, user.email);
  }

  private buildAuthResponse(id: string, email: string): AuthResponse {
    const user: TicketingUser = { id, email };

    return {
      user,
      token: this.jwtService.sign(user),
    };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
}
