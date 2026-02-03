// apps/api/src/modules/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { RegisterSchema, LoginSchema } from '@mfo/common';
import type { RegisterDto, LoginDto } from '@mfo/common';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  register(@Body() data: RegisterDto) {
    return this.usersService.create(data);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  login(@Body() data: LoginDto) {
    return this.authService.signIn(data);
  }
}
