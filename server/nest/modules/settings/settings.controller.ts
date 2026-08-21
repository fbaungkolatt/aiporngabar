import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service.ts';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }
}
