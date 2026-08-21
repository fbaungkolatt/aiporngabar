import { Controller, Post, Get, Body, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service.ts';
import { getIpHash } from '../../../auth.ts';
import jwt from 'jsonwebtoken';

function verifyAdminToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Admin token required.');
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'porngabar-secret-jwt-key') as any;
    if (!decoded || !decoded.id || !['superadmin', 'admin', 'moderator'].includes(decoded.role)) {
      throw new UnauthorizedException('Admin privileges required.');
    }
  } catch {
    throw new UnauthorizedException('Admin token invalid.');
  }
}

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  track(@Body() body: any, @Req() req: Request) {
    const ipHash = getIpHash(req);
    this.analyticsService.trackPageView({
      ...body,
      ipHash,
    });
    return { success: true };
  }

  @Post('heartbeat')
  heartbeat(@Body() body: any) {
    if (body.sessionId && body.path) {
      this.analyticsService.heartbeatSession(body.sessionId, body.path);
    }
    return { success: true };
  }

  @Get('traffic')
  getTraffic(@Req() req: Request, @Query('range') range: any) {
    verifyAdminToken(req);
    return this.analyticsService.getTrafficAnalytics(range || '7d');
  }

  @Get('live')
  getLive(@Req() req: Request) {
    verifyAdminToken(req);
    return this.analyticsService.getLiveVisitors(5);
  }

  @Get('videos')
  getVideoAnalytics(@Req() req: Request) {
    verifyAdminToken(req);
    return this.analyticsService.getVideoAnalytics();
  }

  @Get('ads')
  getAdAnalytics(@Req() req: Request) {
    verifyAdminToken(req);
    return this.analyticsService.getAdAnalytics();
  }

  @Get('export')
  exportCsv(@Req() req: Request, @Res() res: Response, @Query('type') type: string) {
    verifyAdminToken(req);
    const { csv, filename } = this.analyticsService.exportCsv(type || 'traffic');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
