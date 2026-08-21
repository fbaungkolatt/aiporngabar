import { Module } from '@nestjs/common';
import { AdsController } from './ads.controller.ts';
import { AdsService } from './ads.service.ts';

@Module({
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}
