import { IsEmail, IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsDateString, IsUUID, IsInt, Min, Max, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType, ReportFormat, ReportStatus, DeliveryMethod } from '../entities/report.entity';
import { TemplateType, TemplateEngine } from '../entities/report-template.entity';
import { ScheduleFrequency, ScheduleStatus } from '../entities/scheduled-report.entity';

// Base Export DTO
export class BaseExportDto {
  @ApiPropertyOptional({ description: 'Report format' })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @ApiPropertyOptional({ description: 'Date range start' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Date range end' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Include only failed records' })
  @IsOptional()
  @IsBoolean()
  include_failures_only?: boolean;

  @ApiPropertyOptional({ description: 'Customer IDs to include' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  customer_ids?: string[];

  @ApiPropertyOptional({ description: 'Campaign IDs to include' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  campaign_ids?: string[];

  @ApiPropertyOptional({ description: 'Game session IDs to include' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  game_session_ids?: string[];

  @ApiPropertyOptional({ description: 'Leaderboard types to include' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  leaderboard_types?: string[];
}

// Data Export DTOs
export class CustomerExportDto extends BaseExportDto {
  @ApiPropertyOptional({ description: 'Export format for customer data' })
  @IsOptional()
  @IsEnum(['csv', 'json', 'xlsx'])
  export_format?: 'csv' | 'json' | 'xlsx';

  @ApiPropertyOptional({ description: 'Include customer game history' })
  @IsOptional()
  @IsBoolean()
  include_game_history?: boolean;

  @ApiPropertyOptional({ description: 'Include customer achievements' })
  @IsOptional()
  @IsBoolean()
  include_achievements?: boolean;
}

export class GameSessionExportDto extends BaseExportDto {
  @ApiPropertyOptional({ description: 'Include performance metrics' })
  @IsOptional()
  @IsBoolean()
  include_performance_metrics?: boolean;

  @ApiPropertyOptional({ description: 'Include detailed player actions' })
  @IsOptional()
  @IsBoolean()
  include_player_actions?: boolean;
}

export class CampaignExportDto extends BaseExportDto {
  @ApiPropertyOptional({ description: 'Include campaign analytics' })
  @IsOptional()
  @IsBoolean()
  include_analytics?: boolean;

  @ApiPropertyOptional({ description: 'Include participant data' })
  @IsOptional()
  @IsBoolean()
  include_participants?: boolean;
}

export class LeaderboardExportDto extends BaseExportDto {
  @ApiPropertyOptional({ description: 'Leaderboard type' })
  @IsOptional()
  @IsString()
  leaderboard_type?: string;

  @ApiPropertyOptional({ description: 'Limit number of entries' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}

// Report Generation DTOs
export class GenerateReportDto {
  @ApiProperty({ description: 'Merchant ID' })
  @IsUUID()
  merchant_id: string;

  @ApiProperty({ description: 'Report type' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiPropertyOptional({ description: 'Custom report name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Report description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Report format' })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @ApiPropertyOptional({ description: 'Report parameters' })
  @IsOptional()
  @IsObject()
  parameters?: object;

  @ApiPropertyOptional({ description: 'Delivery method' })
  @IsOptional()
  @IsEnum(DeliveryMethod)
  delivery_method?: DeliveryMethod;

  @ApiPropertyOptional({ description: 'Delivery address' })
  @IsOptional()
  @IsString()
  delivery_address?: string;

  @ApiPropertyOptional({ description: 'Report template ID' })
  @IsOptional()
  @IsUUID()
  template_id?: string;

  @ApiPropertyOptional({ description: 'Schedule report' })
  @IsOptional()
  @IsObject()
  schedule?: {
    name?: string;
    frequency?: ScheduleFrequency;
    end_date?: string;
    recipients?: string[];
    delivery_method?: DeliveryMethod;
    webhook_url?: string;
    parameters?: object;
  };
}

export class GenerateCustomReportDto extends GenerateReportDto {
  @ApiProperty({ description: 'Custom report template content' })
  @IsString()
  template_content: string;

  @ApiPropertyOptional({ description: 'Template variables' })
  @IsOptional()
  @IsObject()
  variables?: object;
}

// Template Management DTOs
export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Template type' })
  @IsOptional()
  @IsEnum(TemplateType)
  type?: TemplateType;

  @ApiPropertyOptional({ description: 'Template engine' })
  @IsOptional()
  @IsEnum(TemplateEngine)
  engine?: TemplateEngine;

  @ApiProperty({ description: 'Template description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Template content' })
  @IsString()
  template: string;

  @ApiPropertyOptional({ description: 'Available variables' })
  @IsOptional()
  @IsObject()
  variables?: object;

  @ApiPropertyOptional({ description: 'Default parameter values' })
  @IsOptional()
  @IsObject()
  default_parameters?: object;

  @ApiPropertyOptional({ description: 'Template tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Is system template' })
  @IsOptional()
  @IsBoolean()
  is_system_template?: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Template content' })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({ description: 'Available variables' })
  @IsOptional()
  @IsObject()
  variables?: object;

  @ApiPropertyOptional({ description: 'Default parameter values' })
  @IsOptional()
  @IsObject()
  default_parameters?: object;

  @ApiPropertyOptional({ description: 'Template tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// Scheduling DTOs
export class CreateScheduleDto {
  @ApiProperty({ description: 'Report template ID' })
  @IsUUID()
  template_id: string;

  @ApiProperty({ description: 'Schedule name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Schedule description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Report parameters' })
  @IsOptional()
  @IsObject()
  parameters?: object;

  @ApiProperty({ description: 'Schedule frequency' })
  @IsEnum(ScheduleFrequency)
  frequency: ScheduleFrequency;

  @ApiPropertyOptional({ description: 'When to start the schedule' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'When to end the schedule' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({ description: 'Recipients for email delivery' })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  recipients?: string[];

  @ApiPropertyOptional({ description: 'Delivery method' })
  @IsOptional()
  @IsEnum(['email', 'download', 'webhook'])
  delivery_method?: 'email' | 'download' | 'webhook';

  @ApiPropertyOptional({ description: 'Webhook URL for delivery' })
  @IsOptional()
  @IsString()
  webhook_url?: string;
}

export class UpdateScheduleDto {
  @ApiPropertyOptional({ description: 'Schedule name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Schedule description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Report parameters' })
  @IsOptional()
  @IsObject()
  parameters?: object;

  @ApiPropertyOptional({ description: 'Schedule frequency' })
  @IsOptional()
  @IsEnum(ScheduleFrequency)
  frequency?: ScheduleFrequency;

  @ApiPropertyOptional({ description: 'New start date' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'New end date' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Update recipients' })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  recipients?: string[];

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// Query DTOs
export class GetReportsDto {
  @ApiPropertyOptional({ description: 'Merchant ID' })
  @IsOptional()
  @IsUUID()
  merchant_id?: string;

  @ApiPropertyOptional({ description: 'Filter by report type' })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({ description: 'Filter by date start' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Filter by date end' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Limit results' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset results' })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ description: 'Include expired reports' })
  @IsOptional()
  @IsBoolean()
  include_expired?: boolean;
}

export class GetTemplatesDto {
  @ApiPropertyOptional({ description: 'Merchant ID' })
  @IsOptional()
  @IsUUID()
  merchant_id?: string;

  @ApiPropertyOptional({ description: 'Filter by template type' })
  @IsOptional()
  @IsEnum(TemplateType)
  type?: TemplateType;

  @ApiPropertyOptional({ description: 'Include system templates' })
  @IsOptional()
  @IsBoolean()
  include_system?: boolean;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Limit results' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset results' })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

export class GetSchedulesDto {
  @ApiPropertyOptional({ description: 'Merchant ID' })
  @IsOptional()
  @IsUUID()
  merchant_id?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @ApiPropertyOptional({ description: 'Filter by frequency' })
  @IsOptional()
  @IsEnum(ScheduleFrequency)
  frequency?: ScheduleFrequency;

  @ApiPropertyOptional({ description: 'Include inactive schedules' })
  @IsOptional()
  @IsBoolean()
  include_inactive?: boolean;

  @ApiPropertyOptional({ description: 'Limit results' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset results' })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

// Response DTOs
export class ReportResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Report data' })
  data: any;

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;
}

export class ReportsListResponseDto extends ReportResponseDto {
  @ApiPropertyOptional({ description: 'Total reports' })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page' })
  page?: number;

  @ApiPropertyOptional({ description: 'Page size' })
  limit?: number;
}

export class TemplateResponseDto extends ReportResponseDto {}

export class TemplatesListResponseDto extends ReportResponseDto {
  @ApiPropertyOptional({ description: 'Total templates' })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page' })
  page?: number;

  @ApiPropertyOptional({ description: 'Page size' })
  limit?: number;
}

export class SchedulesListResponseDto extends ReportResponseDto {
  @ApiPropertyOptional({ description: 'Total schedules' })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page' })
  page?: number;

  @ApiPropertyOptional({ description: 'Page size' })
  limit?: number;
}

export class ReportHistoryResponseDto extends ReportResponseDto {
  @ApiPropertyOptional({ description: 'Report generation history' })
  history?: Array<{
    id: string;
    name: string;
    type: ReportType;
    status: ReportStatus;
    created_at: string;
    generated_at?: string;
    file_size?: number;
  }>;
}

export class DownloadStatsDto extends ReportResponseDto {
  @ApiPropertyOptional({ description: 'Download count' })
  download_count?: number;

  @ApiPropertyOptional({ description: 'Last downloaded at' })
  last_downloaded_at?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  file_size_bytes?: number;

  @ApiPropertyOptional({ description: 'File size in MB' })
  file_size_mb?: number;
}

export class ScheduleResponseDto extends ReportResponseDto {
  @ApiPropertyOptional({ description: 'Next run time' })
  next_run_at?: string;

  @ApiPropertyOptional({ description: 'Schedule status' })
  status?: ScheduleStatus;

  @ApiPropertyOptional({ description: 'Remaining runs' })
  remaining_runs?: number;

  @ApiPropertyOptional({ description: 'Total runs' })
  total_runs?: number;
}