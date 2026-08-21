import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.ts';
import {
  signAdminToken,
  requireAdminAuth,
  createRateLimiter,
  getIpHash,
  AuthRequest,
} from '../auth.ts';

export const adminRouter = Router();

// 1. Admin Login
adminRouter.post(
  '/auth/login',
  createRateLimiter(10, 60000),
  async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;
    const ipHash = getIpHash(req);

    if (!email || !password) {
      res.status(400).json({ error: 'Please provide admin email and password.' });
      return;
    }

    const admin = db.findAdminByEmail(email);
    if (!admin) {
      db.addAuditLog({
        adminId: 'unknown',
        adminEmail: email,
        action: 'ADMIN_LOGIN_FAILED',
        entityType: 'auth',
        details: 'Failed login attempt: non-existent email',
        ipHash,
      });
      res.status(401).json({ error: 'Invalid admin credentials.' });
      return;
    }

    // Check account lockout
    if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
      const waitMinutes = Math.ceil(
        (new Date(admin.lockedUntil).getTime() - Date.now()) / (60 * 1000)
      );
      res.status(429).json({
        error: `Account temporarily locked due to excessive failed attempts. Please try again in ${waitMinutes} minutes.`,
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      db.recordAdminLoginFailure(admin.id);
      db.addAuditLog({
        adminId: admin.id,
        adminEmail: admin.email,
        action: 'ADMIN_LOGIN_FAILED',
        entityType: 'auth',
        details: `Failed login attempt with invalid password (attempts: ${admin.failedAttempts + 1})`,
        ipHash,
      });
      res.status(401).json({ error: 'Invalid admin credentials.' });
      return;
    }

    db.recordAdminLoginSuccess(admin.id);
    db.addAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'ADMIN_LOGIN_SUCCESS',
      entityType: 'auth',
      details: 'Administrator successfully logged into management console',
      ipHash,
    });

    const { passwordHash: _, ...safeAdmin } = admin;
    const token = signAdminToken(safeAdmin);

    res.json({
      success: true,
      admin: safeAdmin,
      token,
    });
  }
);

// Admin Auth Status / Me
adminRouter.get('/auth/me', requireAdminAuth, (req: AuthRequest, res: Response) => {
  res.json({ admin: req.admin });
});

// Admin Logout
adminRouter.post('/auth/logout', requireAdminAuth, (req: AuthRequest, res: Response) => {
  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'ADMIN_LOGOUT',
      entityType: 'auth',
      details: 'Administrator signed out',
      ipHash: req.ipHash,
    });
  }
  res.json({ success: true, message: 'Logged out from admin console.' });
});

// 2. Dashboard KPI Summary
adminRouter.get('/dashboard', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  const stats = db.getAdminDashboardStats();
  res.json(stats);
});

// 3. Video Management CRUD
adminRouter.get('/videos', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { search, category, status, limit, offset } = req.query;
  const publishedOnly = status === 'published' ? true : status === 'draft' ? false : undefined;

  const result = db.getVideos({
    search: search as string,
    category: category as string,
    publishedOnly,
    limit: limit ? parseInt(limit as string, 10) : 50,
    offset: offset ? parseInt(offset as string, 10) : 0,
  });

  res.json(result);
});

adminRouter.post('/videos', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const {
    title,
    description,
    categoryId,
    videoUrl,
    thumbnailUrl,
    duration,
    tags,
    isPremium,
    isPublished,
    isAgeRestricted,
    contentOwner,
    licenseInfo,
    copyrightStatus,
    publishedAt,
  } = req.body;

  if (!title || !description || !categoryId || !videoUrl || !thumbnailUrl) {
    res.status(400).json({ error: 'Please fill in all required video fields.' });
    return;
  }

  const cat = db.getCategories().find((c) => c.id === categoryId) ||
    db.getAllCategoriesAdmin().find((c) => c.id === categoryId);

  const durationNum = duration ? parseInt(duration, 10) : 300;
  const mins = Math.floor(durationNum / 60);
  const secs = durationNum % 60;
  const durationFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const video = db.createVideo({
    title,
    description,
    categoryId,
    category: cat?.name || 'General',
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : []),
    videoUrl,
    thumbnailUrl,
    duration: durationNum,
    durationFormatted,
    isPremium: Boolean(isPremium),
    isPublished: isPublished !== false,
    isAgeRestricted: Boolean(isAgeRestricted),
    contentOwner: contentOwner || 'Porn Gabar Media',
    licenseInfo: licenseInfo || 'Standard License',
    copyrightStatus: copyrightStatus || 'Verified',
    publishedAt: publishedAt || new Date().toISOString(),
  });

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'CREATE_VIDEO',
      entityType: 'video',
      entityId: video.id,
      details: `Created video: "${video.title}" in category "${video.category}"`,
      ipHash: req.ipHash,
    });
  }

  res.status(201).json(video);
});

adminRouter.put('/videos/:id', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = { ...req.body };

  if (updates.duration) {
    const durationNum = parseInt(updates.duration, 10);
    const mins = Math.floor(durationNum / 60);
    const secs = durationNum % 60;
    updates.duration = durationNum;
    updates.durationFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  if (updates.tags && typeof updates.tags === 'string') {
    updates.tags = updates.tags.split(',').map((t: string) => t.trim());
  }

  if (updates.categoryId) {
    const cat = db.getAllCategoriesAdmin().find((c) => c.id === updates.categoryId);
    if (cat) updates.category = cat.name;
  }

  const updated = db.updateVideo(id, updates);
  if (!updated) {
    res.status(404).json({ error: 'Video not found.' });
    return;
  }

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'UPDATE_VIDEO',
      entityType: 'video',
      entityId: id,
      details: `Updated video attributes for: "${updated.title}"`,
      ipHash: req.ipHash,
    });
  }

  res.json(updated);
});

adminRouter.put('/videos/:id/status', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isPublished } = req.body;

  const updated = db.updateVideo(id, { isPublished: Boolean(isPublished) });
  if (!updated) {
    res.status(404).json({ error: 'Video not found.' });
    return;
  }

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: isPublished ? 'PUBLISH_VIDEO' : 'UNPUBLISH_VIDEO',
      entityType: 'video',
      entityId: id,
      details: `Changed visibility status to ${isPublished ? 'Published' : 'Draft'} for video "${updated.title}"`,
      ipHash: req.ipHash,
    });
  }

  res.json(updated);
});

adminRouter.delete('/videos/:id', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const video = db.getVideoById(id);
  const deleted = db.deleteVideo(id);

  if (!deleted) {
    res.status(404).json({ error: 'Video not found.' });
    return;
  }

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'DELETE_VIDEO',
      entityType: 'video',
      entityId: id,
      details: `Permanently deleted video: "${video?.title || id}"`,
      ipHash: req.ipHash,
    });
  }

  res.json({ success: true, message: 'Video permanently deleted from database.' });
});

// 4. Category Management CRUD
adminRouter.get('/categories', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  const categories = db.getAllCategoriesAdmin();
  res.json(categories);
});

adminRouter.post('/categories', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { name, slug, description, iconName, color, order, isActive } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }

  const generatedSlug = slug || name.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const newCat = db.createCategory({
    name: name.trim(),
    slug: (generatedSlug || `cat-${Date.now()}`).toLowerCase(),
    description: description ? description.trim() : '',
    iconName: iconName || 'Film',
    color: color || '#1769FF',
    order: order !== undefined ? parseInt(order, 10) : 99,
    isActive: isActive !== false,
  });

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'CREATE_CATEGORY',
      entityType: 'category',
      entityId: newCat.id,
      details: `Created category: "${newCat.name}" (slug: ${newCat.slug})`,
      ipHash: req.ipHash,
    });
  }

  res.status(201).json(newCat);
});

adminRouter.post('/categories/reorder', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { categoryIds } = req.body;
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    res.status(400).json({ error: 'categoryIds array is required.' });
    return;
  }

  const reordered = db.reorderCategories(categoryIds);

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'REORDER_CATEGORIES',
      entityType: 'category',
      details: 'Reordered category channels sequence',
      ipHash: req.ipHash,
    });
  }

  res.json(reordered);
});

adminRouter.put('/categories/reorder', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { categoryIds } = req.body;
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    res.status(400).json({ error: 'categoryIds array is required.' });
    return;
  }

  const reordered = db.reorderCategories(categoryIds);

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'REORDER_CATEGORIES',
      entityType: 'category',
      details: 'Reordered category channels sequence',
      ipHash: req.ipHash,
    });
  }

  res.json(reordered);
});

adminRouter.put('/categories/:id/status', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const existing = db.getAllCategoriesAdmin().find((c) => c.id === id);
  if (!existing) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  const newStatus = isActive !== undefined ? Boolean(isActive) : !existing.isActive;
  const updated = db.updateCategory(id, { isActive: newStatus });

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: newStatus ? 'ENABLE_CATEGORY' : 'DISABLE_CATEGORY',
      entityType: 'category',
      entityId: id,
      details: `${newStatus ? 'Enabled' : 'Disabled'} category channel "${existing.name}"`,
      ipHash: req.ipHash,
    });
  }

  res.json(updated);
});

adminRouter.put('/categories/:id', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.updateCategory(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'UPDATE_CATEGORY',
      entityType: 'category',
      entityId: id,
      details: `Updated category "${updated.name}" settings`,
      ipHash: req.ipHash,
    });
  }

  res.json(updated);
});

adminRouter.delete('/categories/:id', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteCategory(id);
  if (!deleted) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'DELETE_CATEGORY',
      entityType: 'category',
      entityId: id,
      details: `Deleted category: ${id}`,
      ipHash: req.ipHash,
    });
  }

  res.json({ success: true });
});

// 5. User Management
adminRouter.get('/users', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { search } = req.query;
  const users = db.getUsersAdmin(search as string);
  res.json(users);
});

adminRouter.put('/users/:id/status', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isSuspended, reason } = req.body;

  const success = db.setUserSuspension(id, Boolean(isSuspended), reason);
  if (!success) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: isSuspended ? 'SUSPEND_USER' : 'RESTORE_USER',
      entityType: 'user',
      entityId: id,
      details: `${isSuspended ? 'Suspended' : 'Restored'} user account ${id} (Reason: ${reason || 'Admin action'})`,
      ipHash: req.ipHash,
    });
  }

  res.json({ success: true });
});

// 6. Comments Moderation
adminRouter.get('/comments', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  const comments = db.getAllCommentsAdmin();
  res.json(comments);
});

adminRouter.delete('/comments/:id', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteComment(id);
  if (!deleted) {
    res.status(404).json({ error: 'Comment not found.' });
    return;
  }

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'DELETE_COMMENT',
      entityType: 'video',
      entityId: id,
      details: `Removed comment ${id}`,
      ipHash: req.ipHash,
    });
  }

  res.json({ success: true });
});

// 7. Content Reports Moderation
adminRouter.get('/reports', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const reports = db.getAllReportsAdmin(status as string);
  res.json(reports);
});

adminRouter.put('/reports/:id', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, actionTaken } = req.body;

  const updated = db.updateReportStatus(id, status, actionTaken);
  if (!updated) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'RESOLVE_REPORT',
      entityType: 'report',
      entityId: id,
      details: `Updated report status to "${status}" (Action: "${actionTaken || 'None'}")`,
      ipHash: req.ipHash,
    });
  }

  res.json(updated);
});

// 8. Advertisements Management
adminRouter.get('/advertisements', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  const ads = db.getAllAdsAdmin();
  res.json(ads);
});

adminRouter.post('/advertisements', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const {
    name,
    adType,
    title,
    tagline,
    bannerImage,
    targetUrl,
    placement,
    priority,
    isActive,
    startDate,
    endDate,
    mobileEnabled,
    desktopEnabled,
  } = req.body;

  if (!name || !bannerImage || !targetUrl || !placement) {
    res.status(400).json({ error: 'Name, Banner Image URL, Target URL, and Placement are required.' });
    return;
  }

  const ad = db.createAd({
    name,
    adType: adType || 'banner',
    title,
    tagline,
    bannerImage,
    targetUrl,
    placement,
    priority: priority !== undefined ? parseInt(priority, 10) : 5,
    isActive: isActive !== false,
    startDate,
    endDate,
    mobileEnabled: mobileEnabled !== false,
    desktopEnabled: desktopEnabled !== false,
  });

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'CREATE_AD',
      entityType: 'advertisement',
      entityId: ad.id,
      details: `Created advertisement unit "${ad.name}" for placement "${ad.placement}"`,
      ipHash: req.ipHash,
    });
  }

  res.status(201).json(ad);
});

adminRouter.put('/advertisements/:id', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.updateAd(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Advertisement unit not found.' });
    return;
  }

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'UPDATE_AD',
      entityType: 'advertisement',
      entityId: id,
      details: `Updated advertisement "${updated.name}" settings`,
      ipHash: req.ipHash,
    });
  }

  res.json(updated);
});

adminRouter.delete('/advertisements/:id', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteAd(id);
  if (!deleted) {
    res.status(404).json({ error: 'Advertisement unit not found.' });
    return;
  }

  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'DELETE_AD',
      entityType: 'advertisement',
      entityId: id,
      details: `Deleted ad unit: ${id}`,
      ipHash: req.ipHash,
    });
  }

  res.json({ success: true });
});

// 9. Traffic Analytics
adminRouter.get('/analytics/traffic', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const range = (req.query.range as any) || '7d';
  const analytics = db.getTrafficAnalytics(range);
  res.json(analytics);
});

// 10. Live Visitors Monitor
adminRouter.get('/analytics/live', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  const live = db.getLiveVisitors(5);
  res.json({
    activeCount: Math.max(1, live.length),
    visitors: live.map((s) => ({
      sessionId: s.sessionId,
      currentPage: s.currentPage,
      device: s.device,
      browser: s.browser,
      os: s.os,
      country: s.country,
      city: s.city,
      startedAt: s.startedAt,
      lastActiveAt: s.lastActiveAt,
      pageViewsCount: s.pageViewsCount,
    })),
  });
});

// 11. Video Granular Analytics
adminRouter.get('/analytics/videos', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  const analytics = db.getVideoAnalytics();
  res.json(analytics);
});

// 12. Advertisement Analytics
adminRouter.get('/analytics/ads', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  const ads = db.getAllAdsAdmin();
  const summary = ads.map((ad) => ({
    id: ad.id,
    name: ad.name,
    placement: ad.placement,
    impressions: ad.impressions,
    clicks: ad.clicks,
    ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) + '%' : '0.00%',
    isActive: ad.isActive,
  }));
  res.json(summary);
});

// 13. Export Analytics as CSV
adminRouter.get('/analytics/export', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const type = (req.query.type as string) || 'traffic';
  let csv = '';

  if (type === 'videos') {
    const videoData = db.getVideoAnalytics();
    csv = 'Video ID,Title,Category,Views,Unique Views,Avg Watch Seconds,Completion Rate,Likes,Bookmarks,Shares,Reports\n';
    videoData.forEach((v) => {
      csv += `"${v.videoId}","${v.title.replace(/"/g, '""')}","${v.category}",${v.views},${v.uniqueViews},${v.avgWatchSeconds},${v.completionRate}%,${v.likes},${v.bookmarks},${v.shares},${v.reports}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="porngabar-video-analytics.csv"');
    res.send(csv);
    return;
  }

  if (type === 'ads') {
    const ads = db.getAllAdsAdmin();
    csv = 'Ad ID,Name,Placement,Impressions,Clicks,CTR,Status\n';
    ads.forEach((ad) => {
      const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) + '%' : '0%';
      csv += `"${ad.id}","${ad.name.replace(/"/g, '""')}","${ad.placement}",${ad.impressions},${ad.clicks},"${ctr}","${ad.isActive ? 'Active' : 'Inactive'}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="porngabar-ads-analytics.csv"');
    res.send(csv);
    return;
  }

  // Default traffic export
  const traffic = db.getTrafficAnalytics('30d');
  csv = 'Metric,Value\n';
  csv += `"Total Sessions",${traffic.totalSessions}\n`;
  csv += `"Total Page Views",${traffic.totalPageViews}\n`;
  csv += `"Unique Visitors",${traffic.uniqueVisitors}\n`;
  csv += `"Active Visitors",${traffic.activeVisitors}\n`;
  csv += `"Bounce Rate","${traffic.bounceRate}"\n\n`;

  csv += 'Top Page,Views\n';
  traffic.topPages.forEach((p) => {
    csv += `"${p.path}",${p.views}\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="porngabar-traffic-analytics.csv"');
  res.send(csv);
});

// 14. Audit Logs
adminRouter.get('/audit-logs', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  const logs = db.getAuditLogs(100);
  res.json(logs);
});

// 15. Platform Settings
adminRouter.get('/settings', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  const settings = db.getSettings();
  res.json(settings);
});

adminRouter.put('/settings', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const updated = db.updateSettings(req.body);
  if (req.admin && req.ipHash) {
    db.addAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action: 'UPDATE_SETTINGS',
      entityType: 'setting',
      details: 'Updated global platform configuration and policy settings',
      ipHash: req.ipHash,
    });
  }
  res.json(updated);
});
