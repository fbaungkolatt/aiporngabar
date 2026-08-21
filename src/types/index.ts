export interface Video {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryId: string;
  tags: string[];
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  durationFormatted: string;
  views: number;
  likes: number;
  shares: number;
  isPremium: boolean;
  isPublished: boolean;
  isAgeRestricted: boolean;
  contentOwner: string;
  licenseInfo: string;
  copyrightStatus: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  featured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  color: string;
  order: number;
  isActive: boolean;
  videoCount?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  role: 'user' | 'vip' | 'admin';
  isSuspended: boolean;
  suspensionReason?: string;
  createdAt: string;
  lastLoginAt: string;
  favoriteCount?: number;
  historyCount?: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'moderator';
  createdAt: string;
  lastLoginAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  videoId: string;
  createdAt: string;
  video?: Video;
}

export interface WatchHistoryItem {
  id: string;
  userId: string;
  videoId: string;
  progressSeconds: number;
  durationSeconds: number;
  completionRate: number; // 0 to 100
  lastWatchedAt: string;
  video?: Video;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likes: number;
  createdAt: string;
  isModerated: boolean;
}

export interface ContentReport {
  id: string;
  videoId: string;
  videoTitle?: string;
  reporterUserId?: string;
  reporterEmail?: string;
  reason: 'copyright' | 'illegal' | 'spam' | 'abuse' | 'inappropriate' | 'other';
  notes: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  actionTaken?: string;
  createdAt: string;
  updatedAt: string;
}

export type AdPlacement = 
  | 'top_banner' 
  | 'home_feed' 
  | 'video_detail' 
  | 'before_video' 
  | 'after_video' 
  | 'sidebar' 
  | 'bottom_banner';

export interface Advertisement {
  id: string;
  name: string;
  adType: 'banner' | 'rich_text' | 'sponsored_card' | 'html_code';
  title?: string;
  tagline?: string;
  bannerImage: string;
  targetUrl: string;
  placement: AdPlacement;
  adSize?: string;
  codeSnippet?: string;
  priority: number; // 1 to 10
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  mobileEnabled: boolean;
  desktopEnabled: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorSession {
  sessionId: string;
  userId?: string;
  ipHash: string;
  currentPage: string;
  device: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  country: string;
  city: string;
  referrer: string;
  trafficSource: 'direct' | 'organic_search' | 'social_media' | 'referral' | 'advertisement' | 'other';
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  startedAt: string;
  lastActiveAt: string;
  pageViewsCount: number;
}

export interface PageViewRecord {
  id: string;
  sessionId: string;
  path: string;
  videoId?: string;
  timestamp: string;
  durationSeconds: number;
}

export interface VideoAnalyticsRecord {
  videoId: string;
  title: string;
  views: number;
  uniqueViews: number;
  avgWatchSeconds: number;
  completionRate: number;
  likes: number;
  bookmarks: number;
  shares: number;
  reports: number;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  entityType: 'video' | 'category' | 'user' | 'report' | 'advertisement' | 'setting' | 'auth';
  entityId?: string;
  details: string;
  timestamp: string;
  ipHash: string;
}

export interface PlatformSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
  enableAgeGate: boolean;
  allowPublicComments: boolean;
  defaultVideoQuality: string;
  adRotationFrequency: number;
  maintenanceMode: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'system' | 'video' | 'reward' | 'alert';
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}
