import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './schemas/user.schema';
import { Session } from './schemas/session.schema';
import { EnvConfig } from '../config/env.validation';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private jwtService: JwtService,
    private config: ConfigService<EnvConfig, true>,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException({
        error: 'AUTH_EMAIL_EXISTS',
        message: 'Email already registered',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = new this.userModel({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });
    await user.save();

    const { accessToken, refreshToken } = await this.issueTokens(
      user._id.toString(),
      user.email,
      '',
      '',
    );

    await this.createSession(
      user._id.toString(),
      refreshToken,
      '',
      '',
      this.config.get('JWT_REFRESH_SECRET', { infer: true }).length * 10,
    );

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  async login(dto: LoginDto, userAgent: string, ip: string) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) {
      throw new UnauthorizedException({
        error: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        error: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const { accessToken, refreshToken } = await this.issueTokens(
      user._id.toString(),
      user.email,
      userAgent,
      ip,
    );

    await this.createSession(
      user._id.toString(),
      refreshToken,
      userAgent,
      ip,
      this.config.get('JWT_REFRESH_SECRET', { infer: true }).length * 10,
    );

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  async refresh(refreshToken: string, userAgent: string, ip: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException({
        error: 'AUTH_INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      });
    }

    const tokenHash = this.hashToken(refreshToken);
    const session = await this.sessionModel.findOne({
      user: payload.sub,
      tokenHash,
      revokedAt: null,
    });

    if (!session || new Date() > session.expiresAt) {
      throw new UnauthorizedException({
        error: 'AUTH_SESSION_REVOKED',
        message: 'Session not found or expired',
      });
    }

    await this.sessionModel.updateOne(
      { _id: session._id },
      { revokedAt: new Date() },
    );

    const user = await this.userModel.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        error: 'AUTH_INVALID_CREDENTIALS',
        message: 'User not found',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.issueTokens(
      user._id.toString(),
      user.email,
      userAgent,
      ip,
    );

    await this.createSession(
      user._id.toString(),
      newRefreshToken,
      userAgent,
      ip,
      30 * 24 * 60 * 60 * 1000,
    );

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  async logout(userId: string) {
    await this.sessionModel.updateMany(
      { user: userId, revokedAt: null },
      { revokedAt: new Date() },
    );
  }

  private async issueTokens(
    userId: string,
    email: string,
    userAgent: string,
    ip: string,
  ) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    userAgent: string,
    ip: string,
    ttlMs: number,
  ) {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + ttlMs);

    const session = new this.sessionModel({
      user: userId,
      tokenHash,
      expiresAt,
      userAgent: userAgent || undefined,
      ip: ip || undefined,
    });
    await session.save();
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private sanitizeUser(user: any) {
    const obj = user.toObject ? user.toObject() : user;
    delete obj.passwordHash;
    return obj;
  }
}