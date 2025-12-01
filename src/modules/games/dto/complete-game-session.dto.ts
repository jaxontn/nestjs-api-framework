import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsString, IsOptional, IsInt, IsNumber, IsBoolean, IsEnum } from 'class-validator';

export class CompleteGameSessionDto {
  @ApiProperty({
    description: 'Final score achieved in the game session',
    example: 100
  })
  @IsDefined()
  @IsNumber()
  score: number;

  @ApiProperty({
    description: 'Points earned during the game session',
    example: 50
  })
  @IsDefined()
  @IsInt()
  points_earned: number;

  @ApiProperty({
    description: 'Total time spent in the game (in seconds)',
    example: 120
  })
  @IsDefined()
  @IsInt()
  session_duration: number;

  @ApiPropertyOptional({
    description: 'Prize won by the customer (prize ID)',
    example: 'prize_12345'
  })
  @IsOptional()
  @IsString()
  prize_won?: string;

  @ApiProperty({
    description: 'Game-specific data (moves, taps, words_found, colors_matched, etc.)',
    example: {
      spin_results: ['red', 'blue', 'green'],
      moves: 25,
      accuracy: 85
    }
  })
  @IsOptional()
  game_data?: Record<string, any>;

  @ApiProperty({
    description: 'Whether the game was completed successfully',
    example: true
  })
  @IsDefined()
  @IsBoolean()
  was_completed: boolean;

  @ApiPropertyOptional({
    description: 'Device information for analytics',
    example: {
      device_type: 'mobile',
      os: 'Android',
      browser: 'Chrome'
    }
  })
  @IsOptional()
  device_info?: Record<string, any>;
}