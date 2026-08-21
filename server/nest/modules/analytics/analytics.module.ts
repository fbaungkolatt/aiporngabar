import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller.ts';
import { AnalyticsService } from './analytics.service.ts';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
