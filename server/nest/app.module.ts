import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.ts';
import { CategoriesModule } from './modules/categories/categories.module.ts';
import { VideosModule } from './modules/videos/videos.module.ts';
import { UsersModule } from './modules/users/users.module.ts';
import { AdminModule } from './modules/admin/admin.module.ts';
import { AnalyticsModule } from './modules/analytics/analytics.module.ts';
import { AdsModule } from './modules/ads/ads.module.ts';
import { SettingsModule } from './modules/settings/settings.module.ts';

@Module({
  imports: [
    CategoriesModule,
    VideosModule,
    UsersModule,
    AdminModule,
    AnalyticsModule,
    AdsModule,
    SettingsModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
