import { Controller, Get, Post, Param, Query, Body, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { VideosService } from './videos.service.ts';
import { optionalUserAuth, AuthRequest } from '../../../auth.ts';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  getVideos(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: 'latest' | 'popular' | 'trending' | 'views',
    @Query('premium') premium?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('tag') tag?: string,
  ) {
    return this.videosService.getVideos({
      category,
      search,
      sort,
      premium,
      limit,
      offset,
      tag,
      publishedOnly: true,
    });
  }

  @Get('featured')
  getFeatured() {
    return this.videosService.getFeatured();
  }

  @Get(':id')
  getVideoDetails(@Param('id') id: string, @Req() req: Request) {
    // Check for optional authorization token in header
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Decode user if valid token
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'porngabar-secret-jwt-key');
        if (decoded && (decoded as any).id) {
          userId = (decoded as any).id;
        }
      } catch {}
    }
    return this.videosService.getVideoDetails(id, userId);
  }

  @Post(':id/like')
  likeVideo(@Param('id') id: string) {
    return this.videosService.likeVideo(id);
  }

  @Post(':id/share')
  shareVideo(@Param('id') id: string) {
    return this.videosService.shareVideo(id);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.videosService.getComments(id);
  }

  @Post(':id/report')
  createReport(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    let reporterUserId: string | undefined;
    let reporterEmail = body.email || 'anonymous@visitor.com';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'porngabar-secret-jwt-key');
        if (decoded && (decoded as any).id) {
          reporterUserId = (decoded as any).id;
          reporterEmail = (decoded as any).email || reporterEmail;
        }
      } catch {}
    }

    return this.videosService.createReport({
      videoId: id,
      reporterUserId,
      reporterEmail,
      reason: body.reason,
      notes: body.notes,
    });
  }
}
