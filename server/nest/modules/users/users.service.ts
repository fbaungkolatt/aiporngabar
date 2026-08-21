import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { db } from '../../../db.ts';
import { signUserToken } from '../../../auth.ts';
import type { User, Video } from '../../../../src/types/index.ts';

@Injectable()
export class UsersService {
  async register(data: { email: string; password: string; name: string }) {
    const { email, password, name } = data;
    if (!email || !password || !name) {
      throw new BadRequestException('Please provide full name, valid email, and a password.');
    }
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters in length.');
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      throw new BadRequestException('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = db.createUser({ email, passwordHash, name });
    const token = signUserToken(user);

    return {
      success: true,
      user,
      token,
    };
  }

  async login(data: { email: string; password: string }) {
    const { email, password } = data;
    if (!email || !password) {
      throw new BadRequestException('Please provide your email and password.');
    }

    const userWithHash = db.findUserByEmail(email);
    if (!userWithHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (userWithHash.isSuspended) {
      throw new ForbiddenException({
        error: 'Your account has been suspended by administration.',
        reason: userWithHash.suspensionReason,
      });
    }

    const isMatch = await bcrypt.compare(password, userWithHash.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const { passwordHash: _, ...safeUser } = userWithHash;
    const token = signUserToken(safeUser);

    return {
      success: true,
      user: safeUser,
      token,
    };
  }

  getProfile(userId: string): User {
    const user = db.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }
    return user;
  }

  updateProfile(userId: string, updates: { name?: string; bio?: string; avatarUrl?: string }): User {
    const updated = db.updateUserProfile(userId, updates);
    if (!updated) {
      throw new BadRequestException('Unable to update profile.');
    }
    return updated;
  }

  getFavorites(userId: string): Video[] {
    return db.getFavoritesByUser(userId);
  }

  addFavorite(userId: string, videoId: string): { success: boolean; isBookmarked: boolean } {
    const result = db.toggleFavorite(userId, videoId);
    return { success: true, isBookmarked: result.isFavorite };
  }

  removeFavorite(userId: string, videoId: string): { success: boolean; isBookmarked: boolean } {
    db.removeFavorite(userId, videoId);
    return { success: true, isBookmarked: false };
  }

  getHistory(userId: string) {
    return db.getWatchHistoryByUser(userId);
  }

  recordHistory(userId: string, data: { videoId: string; progressSeconds: number; durationSeconds: number }) {
    return db.updateWatchHistory({
      userId,
      videoId: data.videoId,
      progressSeconds: data.progressSeconds,
      durationSeconds: data.durationSeconds,
    });
  }

  clearHistory(userId: string) {
    db.clearWatchHistory(userId);
    return { success: true };
  }

  postComment(userId: string, data: { videoId: string; content: string }) {
    const user = db.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User session invalid.');
    }
    return db.addComment({
      videoId: data.videoId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl,
      content: data.content,
    });
  }
}
