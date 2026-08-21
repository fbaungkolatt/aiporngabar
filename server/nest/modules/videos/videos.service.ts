import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../../../db.ts';
import type { Video } from '../../../../src/types/index.ts';

@Injectable()
export class VideosService {
  getVideos(query: {
    category?: string;
    search?: string;
    sort?: 'latest' | 'popular' | 'trending' | 'views';
    premium?: string | boolean;
    limit?: number | string;
    offset?: number | string;
    tag?: string;
    publishedOnly?: boolean;
  }) {
    const limitNum = query.limit !== undefined ? Number(query.limit) : 24;
    const offsetNum = query.offset !== undefined ? Number(query.offset) : 0;
    const premiumOnly = query.premium === 'true' || query.premium === true;

    return db.getVideos({
      category: query.category,
      search: query.search,
      sort: query.sort || 'latest',
      premiumOnly,
      publishedOnly: query.publishedOnly !== false,
      limit: limitNum,
      offset: offsetNum,
      tag: query.tag,
    });
  }

  getFeatured(): Video | null {
    const data = db.getVideos({ limit: 5, sort: 'popular', publishedOnly: true });
    const featured = data.videos.find((v) => v.featured) || data.videos[0];
    return featured || null;
  }

  getVideoDetails(id: string, userId?: string) {
    const video = db.getVideoById(id);
    if (!video || !video.isPublished) {
      throw new NotFoundException('Video not found or is currently private.');
    }

    // Increment views in database
    db.incrementVideoViews(id);

    // Fetch related videos (same category)
    const related = db
      .getVideos({
        category: video.categoryId,
        limit: 8,
        publishedOnly: true,
      })
      .videos.filter((v) => v.id !== video.id);

    // Fetch recommended videos
    const recommended = db
      .getVideos({
        sort: 'popular',
        limit: 6,
        publishedOnly: true,
      })
      .videos.filter((v) => v.id !== video.id && !related.some((r) => r.id === v.id));

    let isBookmarked = false;
    if (userId) {
      isBookmarked = db.isFavorite(userId, video.id);
    }

    return {
      video: {
        ...video,
        views: video.views + 1,
      },
      related,
      recommended,
      isBookmarked,
    };
  }

  likeVideo(id: string): { success: boolean; likes: number } {
    const newLikes = db.likeVideo(id);
    return { success: true, likes: newLikes };
  }

  shareVideo(id: string): { success: boolean; shares: number } {
    const newShares = db.shareVideo(id);
    return { success: true, shares: newShares };
  }

  getComments(videoId: string) {
    return db.getCommentsByVideo(videoId);
  }

  createReport(data: {
    videoId: string;
    reporterUserId?: string;
    reporterEmail: string;
    reason: 'copyright' | 'illegal' | 'spam' | 'abuse' | 'inappropriate' | 'other';
    notes: string;
  }) {
    if (!data.reason || !data.notes) {
      throw new BadRequestException('Please specify a valid reason and description notes.');
    }
    const report = db.createReport(data);
    return {
      success: true,
      reportId: report.id,
      message: 'Report received and submitted for administrative review.',
    };
  }

  getSuggestions(query: string) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return { suggestions: [] };

    const { videos } = db.getVideos({ search: q, limit: 8 });
    const suggestions = videos.map((v) => ({
      id: v.id,
      title: v.title,
      category: v.category,
      thumbnailUrl: v.thumbnailUrl,
      durationFormatted: v.durationFormatted,
    }));
    return { suggestions };
  }
}
