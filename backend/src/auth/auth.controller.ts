import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  UseGuards,
  Patch,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'AUTH_EMAIL_EXISTS' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async register(
    @Body() dto: RegisterDto,
    @Res() res: Response,
    @Req() req: AuthRequest,
  ) {
    const { accessToken, user, refreshToken } = await this.authService.register(dto);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({ user, accessToken });
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'AUTH_INVALID_CREDENTIALS' },
        message: { type: 'string' },
      },
    },
  })
  async login(
    @Body() dto: LoginDto,
    @Res() res: Response,
    @Req() req: AuthRequest,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || '';

    const { accessToken, user, refreshToken } = await this.authService.login(
      dto,
      userAgent,
      ip,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ user, accessToken });
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'AUTH_INVALID_REFRESH_TOKEN' },
        message: { type: 'string' },
      },
    },
  })
  async refresh(@Req() req: AuthRequest, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'AUTH_INVALID_REFRESH_TOKEN',
        message: 'Refresh token not found',
      });
    }

    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || '';

    const { accessToken, user, refreshToken: newRefreshToken } = await this.authService.refresh(
      refreshToken,
      userAgent,
      ip,
    );

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ user, accessToken });
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req: AuthRequest, @Res() res: Response) {
    if (req.user) {
      await this.authService.logout(req.user.id);
    }
    res.clearCookie('refreshToken');
    return res.sendStatus(204);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'User data', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Req() req: AuthRequest) {
    return { _id: req.user?.id, email: req.user?.email };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async updateProfile(@Req() req: AuthRequest, @Body() dto: UpdateProfileDto) {
    if (!req.user) {
      return null;
    }
    return this.authService.updateProfile(req.user.id, dto);
  }
}