import { Injectable } from '@nestjs/common';
import { db } from '../../../db.ts';

@Injectable()
export class AdsService {
  getActiveAds(placement?: string, isMobile?: boolean) {
    return db.getActiveAds(placement, isMobile);
  }

  recordImpression(id: string) {
    db.recordAdImpression(id);
    return { success: true };
  }

  recordClick(id: string) {
    db.recordAdClick(id);
    return { success: true };
  }
}
