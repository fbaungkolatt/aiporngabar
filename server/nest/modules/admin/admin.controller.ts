import { Controller, Post, Get, Put, Delete, Body, Param, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminService } from './admin.service.ts';
import { getIpHash } from '../../../auth.ts';
import jwt from 'jsonwebtoken';
import type { AdminUser } from '../../../../src/types/index.ts';

function extractAdmin(req: Request): AdminUser {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Administrator authentication required.');
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'porngabar-secret-jwt-key') as any;
    if (!decoded || !decoded.id || !['superadmin', 'admin', 'moderator'].includes(decoded.role)) {
      throw new UnauthorizedException('Invalid or expired admin privileges.');
    }
    return decoded as AdminUser;
  } catch {
    throw new UnauthorizedException('Invalid or expired admin privileges.');
  }
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('auth/login')
  login(@Body() body: any, @Req() req: Request) {
    const ipHash = getIpHash(req);
    return this.adminService.login(body.email, body.password, ipHash);
  }

  @Get('dashboard/stats')
  getDashboardStats(@Req() req: Request) {
    extractAdmin(req);
    return this.adminService.getDashboardStats();
  }

  // Videos
  @Get('videos')
  getVideos(@Req() req: Request, @Query() query: any) {
    extractAdmin(req);
    return this.adminService.getVideos(query);
  }

  @Post('videos')
  createVideo(@Req() req: Request, @Body() body: any) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.createVideo(body, admin, ipHash);
  }

  @Put('videos/:id')
  updateVideo(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.updateVideo(id, body, admin, ipHash);
  }

  @Delete('videos/:id')
  deleteVideo(@Req() req: Request, @Param('id') id: string) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.deleteVideo(id, admin, ipHash);
  }

  // Categories
  @Get('categories')
  getCategories(@Req() req: Request) {
    extractAdmin(req);
    return this.adminService.getCategories();
  }

  @Post('categories')
  createCategory(@Req() req: Request, @Body() body: any) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.createCategory(body, admin, ipHash);
  }

  @Put('categories/reorder')
  reorderCategoriesPut(@Req() req: Request, @Body('categoryIds') categoryIds: string[]) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.reorderCategories(categoryIds, admin, ipHash);
  }

  @Post('categories/reorder')
  reorderCategoriesPost(@Req() req: Request, @Body('categoryIds') categoryIds: string[]) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.reorderCategories(categoryIds, admin, ipHash);
  }

  @Put('categories/:id/status')
  toggleCategoryStatusPut(@Req() req: Request, @Param('id') id: string, @Body('isActive') isActive?: boolean) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.toggleCategoryStatus(id, isActive, admin, ipHash);
  }

  @Put('categories/:id')
  updateCategory(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.updateCategory(id, body, admin, ipHash);
  }

  @Delete('categories/:id')
  deleteCategory(@Req() req: Request, @Param('id') id: string) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.deleteCategory(id, admin, ipHash);
  }

  // Users
  @Get('users')
  getUsers(@Req() req: Request, @Query('search') search?: string) {
    extractAdmin(req);
    return this.adminService.getUsers(search);
  }

  @Put('users/:id/status')
  setUserStatus(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.setUserStatus(id, body.isSuspended, body.reason, admin, ipHash);
  }

  // Advertisements
  @Get('advertisements')
  getAds(@Req() req: Request) {
    extractAdmin(req);
    return this.adminService.getAds();
  }

  @Post('advertisements')
  createAd(@Req() req: Request, @Body() body: any) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.createAd(body, admin, ipHash);
  }

  @Put('advertisements/:id')
  updateAd(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.updateAd(id, body, admin, ipHash);
  }

  @Delete('advertisements/:id')
  deleteAd(@Req() req: Request, @Param('id') id: string) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.deleteAd(id, admin, ipHash);
  }

  // Reports
  @Get('reports')
  getReports(@Req() req: Request, @Query('status') status?: string) {
    extractAdmin(req);
    return this.adminService.getReports(status);
  }

  @Put('reports/:id')
  updateReport(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.updateReport(id, body.status, body.actionTaken, admin, ipHash);
  }

  // Audit Logs
  @Get('audit-logs')
  getAuditLogs(@Req() req: Request, @Query('limit') limit?: string) {
    extractAdmin(req);
    return this.adminService.getAuditLogs(limit ? parseInt(limit, 10) : 100);
  }

  // Settings
  @Get('settings')
  getSettings(@Req() req: Request) {
    extractAdmin(req);
    return this.adminService.getSettings();
  }

  @Put('settings')
  updateSettings(@Req() req: Request, @Body() body: any) {
    const admin = extractAdmin(req);
    const ipHash = getIpHash(req);
    return this.adminService.updateSettings(body, admin, ipHash);
  }
}
