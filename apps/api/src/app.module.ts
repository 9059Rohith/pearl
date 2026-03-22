import { Module } from '@nestjs/common';
import { PagesModule } from './pages/pages.module';
import { BrandsModule } from './brands/brands.module';
import { LeadsModule } from './leads/leads.module';
import { EmailModule } from './email/email.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [PagesModule, BrandsModule, LeadsModule, EmailModule, AnalyticsModule],
})
export class AppModule {}
