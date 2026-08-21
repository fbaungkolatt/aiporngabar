import { Injectable } from '@nestjs/common';
import { db } from '../../../db.ts';

@Injectable()
export class AnalyticsService {
  trackPageView(data: any) {
    return db.trackPageView(data);
  }

  heartbeatSession(sessionId: string, path: string) {
    db.heartbeatSession(sessionId, path);
    return { success: true };
  }

  getTrafficAnalytics(range: '24h' | '7d' | '30d' | 'all' | 'today' | 'yesterday' | '90d' = '7d') {
    const mappedRange = range === '24h' ? 'today' : range;
    return db.getTrafficAnalytics(mappedRange);
  }

  getLiveVisitors(minutes: number = 5) {
    const live = db.getLiveVisitors(minutes);
    return {
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
    };
  }

  getVideoAnalytics() {
    return db.getVideoAnalytics();
  }

  getAdAnalytics() {
    const ads = db.getAllAdsAdmin();
    return ads.map((ad) => ({
      id: ad.id,
      name: ad.name,
      placement: ad.placement,
      impressions: ad.impressions,
      clicks: ad.clicks,
      ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) + '%' : '0.00%',
      isActive: ad.isActive,
    }));
  }

  exportCsv(type: string): { csv: string; filename: string } {
    let csv = '';
    let filename = 'porngabar-analytics.csv';

    if (type === 'videos') {
      const videoData = db.getVideoAnalytics();
      csv = 'Video ID,Title,Category,Views,Unique Views,Avg Watch Seconds,Completion Rate,Likes,Bookmarks,Shares,Reports\n';
      videoData.forEach((v) => {
        csv += `"${v.videoId}","${v.title.replace(/"/g, '""')}","${v.category}",${v.views},${v.uniqueViews},${v.avgWatchSeconds},${v.completionRate}%,${v.likes},${v.bookmarks},${v.shares},${v.reports}\n`;
      });
      filename = 'porngabar-video-analytics.csv';
    } else if (type === 'ads') {
      const ads = db.getAllAdsAdmin();
      csv = 'Ad ID,Name,Placement,Impressions,Clicks,CTR,Status\n';
      ads.forEach((ad) => {
        const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) + '%' : '0%';
        csv += `"${ad.id}","${ad.name.replace(/"/g, '""')}","${ad.placement}",${ad.impressions},${ad.clicks},"${ctr}","${ad.isActive ? 'Active' : 'Inactive'}"\n`;
      });
      filename = 'porngabar-ads-analytics.csv';
    } else {
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
      filename = 'porngabar-traffic-analytics.csv';
    }

    return { csv, filename };
  }
}
