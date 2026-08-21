import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { AdsService } from './ads.service.ts';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get('active')
  getActiveAds(@Query('placement') placement?: string, @Query('isMobile') isMobile?: string) {
    const mobileBool = isMobile !== undefined ? isMobile === 'true' : undefined;
    return this.adsService.getActiveAds(placement, mobileBool);
  }

  @Post(':id/impression')
  recordImpression(@Param('id') id: string) {
    return this.adsService.recordImpression(id);
  }

  @Post(':id/click')
  recordClick(@Param('id') id: string) {
    return this.adsService.recordClick(id);
  }
}
