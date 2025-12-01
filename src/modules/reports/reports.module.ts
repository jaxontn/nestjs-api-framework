import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from './entities/report.entity';
import { ReportTemplate } from './entities/report-template.entity';
import { ScheduledReport } from './entities/scheduled-report.entity';
import { MerchantUser } from '../../entities/merchant-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, ReportTemplate, ScheduledReport, MerchantUser])
  ],
  controllers: [ReportsController],
  providers: [ReportsService]
})
export class ReportsModule { }
