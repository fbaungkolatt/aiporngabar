import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { db } from '../../../db.ts';
import { signAdminToken } from '../../../auth.ts';
import type { AdminUser, Category, Video, Advertisement, PlatformSettings } from '../../../../src/types/index.ts';

@Injectable()
export class AdminService {
  async login(email: string, password: string, ipHash: string) {
    const admin = db.findAdminByEmail(email);
    if (!admin) {
      throw new UnauthorizedException('Invalid administrator credentials.');
    }

    if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked due to multiple failed login attempts.');
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      db.recordAdminLoginFailure(admin.id);
      db.addAuditLog({
        adminId: admin.id,
        adminEmail: email,
        action: 'FAILED_ADMIN_LOGIN',
        entityType: 'auth',
        details: 'Failed admin login attempt',
        ipHash,
      });
      throw new UnauthorizedException('Invalid administrator credentials.');
    }

    db.recordAdminLoginSuccess(admin.id);
    db.addAuditLog({
      adminId: admin.id,
      adminEmail: email,
      action: 'ADMIN_LOGIN',
      entityType: 'auth',
      details: 'Administrator authenticated successfully',
      ipHash,
    });

    const { passwordHash: _, ...safeAdmin } = admin;
    const token = signAdminToken(safeAdmin);

    return {
      success: true,
      admin: safeAdmin,
      token,
    };
  }

  getDashboardStats() {
    return db.getAdminDashboardStats();
  }

  // Videos
  getVideos(query: { category?: string; search?: string; status?: string; limit?: number; offset?: number }) {
    return db.getVideos({
      category: query.category,
      search: query.search,
      publishedOnly: false,
      limit: query.limit,
      offset: query.offset,
    });
  }

  createVideo(videoData: any, adminUser: AdminUser, ipHash: string) {
    const video = db.createVideo({
      ...videoData,
      contentOwner: videoData.contentOwner || 'Porn Gabar Media Group',
      licenseInfo: videoData.licenseInfo || 'Standard License',
      copyrightStatus: videoData.copyrightStatus || 'Verified',
    });

    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'CREATE_VIDEO',
      entityType: 'video',
      entityId: video.id,
      details: `Uploaded/Created master video file: "${video.title}"`,
      ipHash,
    });

    return video;
  }

  updateVideo(id: string, updates: any, adminUser: AdminUser, ipHash: string) {
    const updated = db.updateVideo(id, updates);
    if (!updated) {
      throw new NotFoundException('Video not found.');
    }

    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'UPDATE_VIDEO',
      entityType: 'video',
      entityId: id,
      details: `Updated video attributes for: "${updated.title}"`,
      ipHash,
    });

    return updated;
  }

  deleteVideo(id: string, adminUser: AdminUser, ipHash: string) {
    const video = db.getVideoById(id);
    const deleted = db.deleteVideo(id);
    if (!deleted) {
      throw new NotFoundException('Video not found.');
    }

    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'DELETE_VIDEO',
      entityType: 'video',
      entityId: id,
      details: `Permanently deleted video: "${video?.title || id}"`,
      ipHash,
    });

    return { success: true, message: 'Video permanently deleted.' };
  }

  // Categories
  getCategories(): Category[] {
    return db.getAllCategoriesAdmin();
  }

  createCategory(categoryData: any, adminUser: AdminUser, ipHash: string) {
    if (!categoryData.name) {
      throw new BadRequestException('Category name is required.');
    }
    const slug = categoryData.slug
      ? categoryData.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-')
      : categoryData.name.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    const cat = db.createCategory({
      name: categoryData.name,
      slug: slug || `cat-${Date.now()}`,
      description: categoryData.description || '',
      iconName: categoryData.iconName || 'Film',
      color: categoryData.color || '#1769FF',
      order: categoryData.order !== undefined ? Number(categoryData.order) : 99,
      isActive: categoryData.isActive !== false,
    });

    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'CREATE_CATEGORY',
      entityType: 'category',
      entityId: cat.id,
      details: `Created category: "${cat.name}"`,
      ipHash,
    });

    return cat;
  }

  updateCategory(id: string, updates: any, adminUser: AdminUser, ipHash: string) {
    const updated = db.updateCategory(id, updates);
    if (!updated) {
      throw new NotFoundException('Category not found.');
    }

    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'UPDATE_CATEGORY',
      entityType: 'category',
      entityId: id,
      details: `Updated category "${updated.name}" settings`,
      ipHash,
    });

    return updated;
  }

  toggleCategoryStatus(id: string, isActive: boolean | undefined, adminUser: AdminUser, ipHash: string) {
    const existing = db.getAllCategoriesAdmin().find((c) => c.id === id);
    if (!existing) {
      throw new NotFoundException('Category not found.');
    }

    const newStatus = isActive !== undefined ? Boolean(isActive) : !existing.isActive;
    const updated = db.updateCategory(id, { isActive: newStatus });
    if (!updated) {
      throw new NotFoundException('Category not found.');
    }

    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: newStatus ? 'ENABLE_CATEGORY' : 'DISABLE_CATEGORY',
      entityType: 'category',
      entityId: id,
      details: `${newStatus ? 'Enabled' : 'Disabled'} category channel "${updated.name}"`,
      ipHash,
    });

    return updated;
  }

  deleteCategory(id: string, adminUser: AdminUser, ipHash: string) {
    const deleted = db.deleteCategory(id);
    if (!deleted) {
      throw new NotFoundException('Category not found.');
    }

    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'DELETE_CATEGORY',
      entityType: 'category',
      entityId: id,
      details: `Deleted category: ${id}`,
      ipHash,
    });

    return { success: true };
  }

  reorderCategories(categoryIds: string[], adminUser: AdminUser, ipHash: string) {
    const reordered = db.reorderCategories(categoryIds);
    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'REORDER_CATEGORIES',
      entityType: 'category',
      details: 'Reordered category sequence display order',
      ipHash,
    });
    return reordered;
  }

  // Users
  getUsers(search?: string) {
    return db.getUsersAdmin(search);
  }

  setUserStatus(id: string, isSuspended: boolean, reason: string | undefined, adminUser: AdminUser, ipHash: string) {
    const success = db.setUserSuspension(id, isSuspended, reason);
    if (!success) {
      throw new NotFoundException('User not found.');
    }

    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: isSuspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
      entityType: 'user',
      entityId: id,
      details: `Set user suspension to: ${isSuspended}`,
      ipHash,
    });

    return { success: true };
  }

  // Ads
  getAds() {
    return db.getAllAdsAdmin();
  }

  createAd(adData: any, adminUser: AdminUser, ipHash: string) {
    const ad = db.createAd(adData);
    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'CREATE_AD',
      entityType: 'advertisement',
      entityId: ad.id,
      details: `Created advertisement "${ad.name}"`,
      ipHash,
    });
    return ad;
  }

  updateAd(id: string, updates: any, adminUser: AdminUser, ipHash: string) {
    const updated = db.updateAd(id, updates);
    if (!updated) {
      throw new NotFoundException('Advertisement unit not found.');
    }
    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'UPDATE_AD',
      entityType: 'advertisement',
      entityId: id,
      details: `Updated advertisement "${updated.name}"`,
      ipHash,
    });
    return updated;
  }

  deleteAd(id: string, adminUser: AdminUser, ipHash: string) {
    const deleted = db.deleteAd(id);
    if (!deleted) {
      throw new NotFoundException('Advertisement not found.');
    }
    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'DELETE_AD',
      entityType: 'advertisement',
      entityId: id,
      details: `Deleted ad unit: ${id}`,
      ipHash,
    });
    return { success: true };
  }

  // Reports
  getReports(status?: string) {
    return db.getAllReportsAdmin(status);
  }

  updateReport(id: string, status: 'pending' | 'investigating' | 'resolved' | 'dismissed', actionTaken: string | undefined, adminUser: AdminUser, ipHash: string) {
    const updated = db.updateReportStatus(id, status, actionTaken);
    if (!updated) {
      throw new NotFoundException('Report not found.');
    }
    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'RESOLVE_REPORT',
      entityType: 'report',
      entityId: id,
      details: `Updated report status to "${status}"`,
      ipHash,
    });
    return updated;
  }

  // Audit Logs
  getAuditLogs(limit?: number) {
    return db.getAuditLogs(limit || 100);
  }

  // Settings
  getSettings(): PlatformSettings {
    return db.getSettings();
  }

  updateSettings(settings: Partial<PlatformSettings>, adminUser: AdminUser, ipHash: string) {
    const updated = db.updateSettings(settings);
    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'UPDATE_SETTINGS',
      entityType: 'setting',
      details: 'Updated global platform configuration and policy settings',
      ipHash,
    });
    return updated;
  }
}
