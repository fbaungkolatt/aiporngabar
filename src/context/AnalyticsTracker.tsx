import React, { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.tsx';

function getSessionId(): string {
  let id = sessionStorage.getItem('bluewave_session_id');
  if (!id) {
    id = 'sess-' + Math.random().toString(36).slice(2, 12) + '-' + Date.now().toString(36);
    sessionStorage.setItem('bluewave_session_id', id);
  }
  return id;
}

function detectDevice(): 'mobile' | 'tablet' | 'desktop' {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Browser';
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
}

function getTrafficSource(): {
  source: 'direct' | 'organic_search' | 'social_media' | 'referral' | 'advertisement' | 'other';
  referrer: string;
} {
  const ref = document.referrer;
  if (!ref) return { source: 'direct', referrer: 'Direct' };

  try {
    const url = new URL(ref);
    const host = url.hostname.toLowerCase();
    if (host.includes('google') || host.includes('bing') || host.includes('duckduckgo') || host.includes('yahoo')) {
      return { source: 'organic_search', referrer: host };
    }
    if (host.includes('twitter') || host.includes('t.co') || host.includes('facebook') || host.includes('instagram') || host.includes('youtube') || host.includes('reddit')) {
      return { source: 'social_media', referrer: host };
    }
    if (url.searchParams.has('utm_source')) {
      return { source: 'advertisement', referrer: host };
    }
    return { source: 'referral', referrer: host };
  } catch {
    return { source: 'direct', referrer: 'Direct' };
  }
}

export const AnalyticsTracker: React.FC<{ currentPath: string; currentVideoId?: string }> = ({
  currentPath,
  currentVideoId,
}) => {
  const { user } = useAuth();
  const lastTrackedPath = useRef<string>('');

  useEffect(() => {
    if (lastTrackedPath.current === currentPath) return;
    lastTrackedPath.current = currentPath;

    const sessionId = getSessionId();
    const params = new URLSearchParams(window.location.search);
    const { source, referrer } = getTrafficSource();

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userId: user?.id,
        path: currentPath,
        videoId: currentVideoId,
        device: detectDevice(),
        browser: detectBrowser(),
        os: detectOS(),
        country: 'United States',
        city: 'San Francisco',
        referrer,
        trafficSource: source,
        utmSource: params.get('utm_source') || undefined,
        utmMedium: params.get('utm_medium') || undefined,
        utmCampaign: params.get('utm_campaign') || undefined,
        utmTerm: params.get('utm_term') || undefined,
        utmContent: params.get('utm_content') || undefined,
      }),
    }).catch(() => {});
  }, [currentPath, currentVideoId, user]);

  // Heartbeat every 20 seconds for real-time live visitors monitor
  useEffect(() => {
    const sessionId = getSessionId();
    const interval = setInterval(() => {
      fetch('/api/analytics/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, path: currentPath }),
      }).catch(() => {});
    }, 20000);

    return () => clearInterval(interval);
  }, [currentPath]);

  return null;
};
