import { Controller, Post, Get, Put, Delete, Body, Param, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service.ts';
import jwt from 'jsonwebtoken';

function extractUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Authentication token required.');
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'porngabar-secret-jwt-key') as any;
    if (!decoded || !decoded.id) {
      throw new UnauthorizedException('Invalid or expired token.');
    }
    return decoded.id;
  } catch {
    throw new UnauthorizedException('Invalid or expired token.');
  }
}

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('auth/register')
  register(@Body() body: any) {
    return this.usersService.register(body);
  }

  @Post('auth/login')
  login(@Body() body: any) {
    return this.usersService.login(body);
  }

  @Post('auth/logout')
  logout() {
    return { success: true, message: 'Signed out successfully.' };
  }

  @Get('user/profile')
  getProfile(@Req() req: Request) {
    const userId = extractUserId(req);
    return { user: this.usersService.getProfile(userId) };
  }

  @Put('user/profile')
  updateProfile(@Req() req: Request, @Body() body: any) {
    const userId = extractUserId(req);
    return { success: true, user: this.usersService.updateProfile(userId, body) };
  }

  @Get('user/favorites')
  getFavorites(@Req() req: Request) {
    const userId = extractUserId(req);
    return this.usersService.getFavorites(userId);
  }

  @Post('user/favorites/:videoId')
  addFavorite(@Req() req: Request, @Param('videoId') videoId: string) {
    const userId = extractUserId(req);
    return this.usersService.addFavorite(userId, videoId);
  }

  @Delete('user/favorites/:videoId')
  removeFavorite(@Req() req: Request, @Param('videoId') videoId: string) {
    const userId = extractUserId(req);
    return this.usersService.removeFavorite(userId, videoId);
  }

  @Get('user/history')
  getHistory(@Req() req: Request) {
    const userId = extractUserId(req);
    return this.usersService.getHistory(userId);
  }

  @Post('user/history')
  recordHistory(@Req() req: Request, @Body() body: any) {
    const userId = extractUserId(req);
    return this.usersService.recordHistory(userId, body);
  }

  @Delete('user/history')
  clearHistory(@Req() req: Request) {
    const userId = extractUserId(req);
    return this.usersService.clearHistory(userId);
  }

  @Post('comments')
  postComment(@Req() req: Request, @Body() body: any) {
    const userId = extractUserId(req);
    return this.usersService.postComment(userId, body);
  }
}
