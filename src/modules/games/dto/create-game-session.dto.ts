import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsString, IsOptional, IsEnum, IsInt, IsNumber, IsBoolean, IsDateString } from 'class-validator';

export enum GameType {
  SPIN_WIN = 'spin-win',
  MEMORY_MATCH = 'memory-match',
  LUCKY_DICE = 'lucky-dice',
  QUICK_TAP = 'quick-tap',
  WORD_PUZZLE = 'word-puzzle',
  COLOR_MATCH = 'color-match'
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export class CreateGameSessionDto {
  @ApiProperty({
    description: 'Customer ID for game session',
    example: 'customer_12345'
  })
  @IsDefined()
  @IsString()
  customer_id: string;

  @ApiProperty({
    description: 'Campaign ID (optional)',
    example: 'campaign_67890',
    required: false
  })
  @IsOptional()
  @IsString()
  campaign_id?: string;

  @ApiProperty({
    description: 'Type of game being played',
    enum: GameType,
    example: GameType.SPIN_WIN
  })
  @IsDefined()
  @IsEnum(GameType)
  game_type: GameType;

  @ApiProperty({
    description: 'Difficulty level for the game',
    example: DifficultyLevel.MEDIUM,
    enum: DifficultyLevel,
    required: false,
    default: DifficultyLevel.MEDIUM
  })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty_level?: DifficultyLevel;

  @ApiProperty({
    description: 'Initial score (optional, defaults to 0)',
    example: 0,
    required: false,
    default: 0
  })
  @IsOptional()
  @IsInt()
  score?: number;

  @ApiProperty({
    description: 'Maximum time allowed for the game session (in seconds)',
    example: 60,
    required: false
  })
  @IsOptional()
  @IsInt()
  time_limit?: number;

  @ApiProperty({
    description: 'Device information for analytics',
    example: {
      device_type: 'mobile',
      os: 'iOS',
      browser: 'Safari',
      screen_resolution: '375x667'
    }
  })
  @IsOptional()
  device_info?: Record<string, any>;

  @ApiProperty({
    description: 'Merchant ID for the game session',
    example: 'merchant_001'
  })
  @IsDefined()
  @IsString()
  merchant_id: string;
}