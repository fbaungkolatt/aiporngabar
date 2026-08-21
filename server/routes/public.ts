import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { getIpHash, optionalUserAuth, AuthRequest } from '../auth.ts';

export const publicRouter = Router();

// Get list of videos with rich filters
publicRouter.get('/videos', (req: Request, res: Response) => {
  const { category, search, sort, premium, limit, offset, tag } = req.query;
  const result = db.getVideos({
    category: category as string,
    search: search as string,
    sort: sort as any,
    premiumOnly: premium === 'true',
    publishedOnly: true,
    limit: limit ? parseInt(limit as string, 10) : 24,
    offset: offset ? parseInt(offset as string, 10) : 0,
    tag: tag as string,
  });
  res.json(result);
});

// Get featured video for Hero banner
publicRouter.get('/videos/featured', (_req: Request, res: Response) => {
  const data = db.getVideos({ limit: 5, sort: 'popular', publishedOnly: true });
  const featured = data.videos.find((v) => v.featured) || data.videos[0];
  res.json(featured || null);
});

// Get single video details with related & recommended videos
publicRouter.get('/videos/:id', optionalUserAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const video = db.getVideoById(id);

  if (!video || !video.isPublished) {
    res.status(404).json({ error: 'Video not found or is currently private.' });
    return;
  }

  // Increment views
  db.incrementVideoViews(id);

  // Get related videos (same category)
  const related = db.getVideos({
    category: video.categoryId,
    limit: 8,
    publishedOnly: true,
  }).videos.filter((v) => v.id !== video.id);

  // Get recommended videos
  const recommended = db.getVideos({
    sort: 'popular',
    limit: 6,
    publishedOnly: true,
  }).videos.filter((v) => v.id !== video.id && !related.some((r) => r.id === v.id));

  // Check if bookmarked by current user if logged in
  let isBookmarked = false;
  if (req.user) {
    isBookmarked = db.isFavorite(req.user.id, video.id);
  }

  res.json({
    video: {
      ...video,
      views: video.views + 1,
    },
    related,
    recommended,
    isBookmarked,
  });
});

// Like video
publicRouter.post('/videos/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const newLikes = db.likeVideo(id);
  res.json({ success: true, likes: newLikes });
});

// Share video
publicRouter.post('/videos/:id/share', (req: Request, res: Response) => {
  const { id } = req.params;
  const newShares = db.shareVideo(id);
  res.json({ success: true, shares: newShares });
});

// Submit content report
publicRouter.post('/videos/:id/report', optionalUserAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reason, notes, email } = req.body;

  if (!reason || !notes) {
    res.status(400).json({ error: 'Please specify a valid reason and description notes.' });
    return;
  }

  const report = db.createReport({
    videoId: id,
    reporterUserId: req.user?.id,
    reporterEmail: email || req.user?.email || 'anonymous',
    reason,
    notes,
  });

  res.status(201).json({ success: true, reportId: report.id, message: 'Report received and submitted for administrative review.' });
});

// Get comments for video
publicRouter.get('/videos/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const comments = db.getCommentsByVideo(id);
  res.json(comments);
});

// Get categories
publicRouter.get('/categories', (_req: Request, res: Response) => {
  const categories = db.getCategories();
  res.json(categories);
});

// Live search autocomplete suggestions
publicRouter.get('/search/suggestions', (req: Request, res: Response) => {
  const q = (req.query.q as string || '').toLowerCase().trim();
  if (!q) {
    res.json({ suggestions: [] });
    return;
  }

  const { videos } = db.getVideos({ search: q, limit: 8 });
  const suggestions = videos.map((v) => ({
    id: v.id,
    title: v.title,
    category: v.category,
    thumbnailUrl: v.thumbnailUrl,
    durationFormatted: v.durationFormatted,
  }));

  res.json({ suggestions });
});

// Full search endpoint
publicRouter.get('/search', (req: Request, res: Response) => {
  const { q, category, sort, limit, offset } = req.query;
  const result = db.getVideos({
    search: q as string,
    category: category as string,
    sort: sort as any || 'latest',
    limit: limit ? parseInt(limit as string, 10) : 24,
    offset: offset ? parseInt(offset as string, 10) : 0,
    publishedOnly: true,
  });
  res.json(result);
});

// Active Advertisements for Rotation
publicRouter.get('/ads/active', (req: Request, res: Response) => {
  const { placement, isMobile } = req.query;
  const ads = db.getActiveAds(
    placement as string,
    isMobile !== undefined ? isMobile === 'true' : undefined
  );
  res.json(ads);
});

// Track Ad Impression
publicRouter.post('/ads/:id/impression', (req: Request, res: Response) => {
  const { id } = req.params;
  db.recordAdImpression(id);
  res.json({ success: true });
});

// Track Ad Click
publicRouter.post('/ads/:id/click', (req: Request, res: Response) => {
  const { id } = req.params;
  db.recordAdClick(id);
  res.json({ success: true });
});

// Track Page View / Visitor Session Beacon
publicRouter.post('/analytics/track', optionalUserAuth, (req: AuthRequest, res: Response) => {
  const {
    sessionId,
    path,
    videoId,
    device,
    browser,
    os,
    country,
    city,
    referrer,
    trafficSource,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
  } = req.body;

  if (!sessionId || !path) {
    res.status(400).json({ error: 'Missing session or path payload' });
    return;
  }

  const ipHash = getIpHash(req);

  db.trackPageView({
    sessionId,
    userId: req.user?.id,
    ipHash,
    path,
    videoId,
    device: device || 'desktop',
    browser: browser || 'Chrome',
    os: os || 'Windows',
    country: country || 'United States',
    city: city || 'San Francisco',
    referrer: referrer || 'Direct',
    trafficSource: trafficSource || 'direct',
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
  });

  res.json({ success: true });
});

// Heartbeat for real-time live monitor
publicRouter.post('/analytics/heartbeat', (req: Request, res: Response) => {
  const { sessionId, path } = req.body;
  if (sessionId && path) {
    db.heartbeatSession(sessionId, path);
  }
  res.json({ success: true });
});

// Public platform settings
publicRouter.get('/settings/public', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({
    siteName: settings.siteName,
    tagline: settings.tagline,
    enableAgeGate: settings.enableAgeGate,
    allowPublicComments: settings.allowPublicComments,
    defaultVideoQuality: settings.defaultVideoQuality,
  });
});
