import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsArray, IsNotEmpty, IsDateString, Min, Max, ValidateNested, IsJSON } from 'class-validator';
import { Type } from 'class-transformer';

// Challenge Types
export enum ChallengeType {
  GAME_MASTER = 'game_master',
  POINTS_COLLECTOR = 'points_collector',
  DAILY_STREAK = 'daily_streak',
  SOCIAL = 'social'
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

// Challenge DTOs
export class CreateChallengeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ChallengeType)
  challenge_type: ChallengeType;

  @IsInt()
  @Min(1)
  target_value: number;

  @IsInt()
  @Min(0)
  reward_points: number;

  @IsOptional()
  @IsString()
  reward_type?: string;

  @IsOptional()
  @IsString()
  badge_icon?: string;

  @IsOptional()
  @IsString()
  badge_color?: string;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty_level?: DifficultyLevel;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_participants?: number;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsJSON()
  target_audience?: any;

  @IsString()
  merchant_id: string;
}

export class UpdateChallengeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ChallengeType)
  challenge_type?: ChallengeType;

  @IsOptional()
  @IsInt()
  @Min(1)
  target_value?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reward_points?: number;

  @IsOptional()
  @IsString()
  reward_type?: string;

  @IsOptional()
  @IsString()
  badge_icon?: string;

  @IsOptional()
  @IsString()
  badge_color?: string;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty_level?: DifficultyLevel;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_participants?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsJSON()
  target_audience?: any;
}

// User Challenge DTOs
export class JoinChallengeDto {
  @IsString()
  @IsNotEmpty()
  challenge_id: string;

  @IsString()
  @IsNotEmpty()
  customer_id: string;

  @IsOptional()
  @IsJSON()
  initial_progress?: any;
}

export class UpdateProgressDto {
  @IsInt()
  @Min(0)
  progress_increment: number;

  @IsOptional()
  @IsString()
  activity_type?: string; // 'game_play', 'points_earned', 'daily_login', etc.

  @IsOptional()
  @IsJSON()
  metadata?: any;
}

export class CompleteChallengeDto {
  @IsString()
  @IsNotEmpty()
  customer_id: string;

  @IsOptional()
  @IsBoolean()
  auto_claim_reward?: boolean;

  @IsOptional()
  @IsJSON()
  completion_data?: any;
}

// Achievement DTOs
export class CreateAchievementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  icon: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(AchievementTier)
  tier?: AchievementTier;

  @IsOptional()
  @IsInt()
  @Min(0)
  points_reward?: number;

  @IsOptional()
  @IsJSON()
  criteria?: any;

  @IsString()
  @IsNotEmpty()
  merchant_id: string;
}

export class UpdateAchievementDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(AchievementTier)
  tier?: AchievementTier;

  @IsOptional()
  @IsInt()
  @Min(0)
  points_reward?: number;

  @IsOptional()
  @IsJSON()
  criteria?: any;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UnlockAchievementDto {
  @IsString()
  @IsNotEmpty()
  customer_id: string;

  @IsOptional()
  @IsJSON()
  progress_data?: any;
}

// Analytics DTOs
export class ChallengeAnalyticsDto {
  @IsString()
  @IsNotEmpty()
  merchant_id: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  challenge_types?: ChallengeType[];

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty_level?: DifficultyLevel;
}