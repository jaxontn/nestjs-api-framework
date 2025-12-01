import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, IsArray, IsEnum } from 'class-validator';

export class UpdateGameSettingsDto {
  @ApiPropertyOptional({
    description: 'Game type to update',
    example: 'spin-win'
  })
  @IsString()
  game_type: string;

  @ApiPropertyOptional({
    description: 'Whether the game is currently active',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Daily play limit per user',
    example: 5
  })
  @IsOptional()
  @IsInt()
  daily_play_limit?: number;

  @ApiPropertyOptional({
    description: 'Base points awarded for playing',
    example: 10
  })
  @IsOptional()
  @IsInt()
  base_points?: number;

  @ApiPropertyOptional({
    description: 'Default difficulty level',
    example: 'medium',
    enum: ['easy', 'medium', 'hard']
  })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: string;

  @ApiPropertyOptional({
    description: 'Game-specific configuration settings',
    example: {
      wheel_segments: 6,
      spin_duration: 3000,
      min_score: 100
    }
  })
  @IsOptional()
  configuration?: Record<string, any>;
}