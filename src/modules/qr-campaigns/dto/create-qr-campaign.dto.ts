import { IsString, IsOptional, IsObject, IsNumber, IsDecimal, IsDateString, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CampaignType {
  REGULAR = 'regular',
  SINGLE_USE_QR = 'single_use_qr',
  VOUCHER = 'voucher',
  EVENT = 'event',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  USED = 'used', // For single-use QR campaigns
}

export class CreateQrCampaignDto {
  @ApiProperty({ description: 'Campaign name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Campaign type', enum: CampaignType })
  @IsEnum(CampaignType)
  campaign_type: CampaignType;

  @ApiPropertyOptional({ description: 'Game settings JSON configuration' })
  @IsOptional()
  @IsObject()
  game_settings?: {
    game_type?: string;
    points_config?: {
      base_points?: number;
      bonus_points?: number;
      difficulty_multiplier?: number;
    };
    daily_play_limit?: number;
    auto_expire?: boolean; // For single-use campaigns
    expiration_days?: number; // Default 30
  };

  @ApiPropertyOptional({ description: 'Target audience JSON configuration' })
  @IsOptional()
  @IsObject()
  target_audience?: {
    age_range?: { min: number; max: number };
    gender?: string[];
    location?: string[];
    merchant_name?: string; // For branding
    theme_color?: string; // For branding
  };

  @ApiPropertyOptional({ description: 'Campaign start date' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Campaign end date' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Campaign budget' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ description: 'Target ROI percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  target_roi?: number;
}