import { Injectable } from '@nestjs/common';
import { db } from '../../../db.ts';

@Injectable()
export class SettingsService {
  getPublicSettings() {
    const settings = db.getSettings();
    return {
      siteName: settings.siteName,
      tagline: settings.tagline,
      enableAgeGate: settings.enableAgeGate,
      allowPublicComments: settings.allowPublicComments,
      defaultVideoQuality: settings.defaultVideoQuality,
    };
  }
}
