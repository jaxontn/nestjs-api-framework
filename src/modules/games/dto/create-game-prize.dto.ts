import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDefined, IsInt, IsNumber, IsBoolean, IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum PrizeType {
  POINTS = 'points',
  DISCOUNT = 'discount',
  FREE_ITEM = 'free_item',
  VOUCHER = 'voucher',
  BADGE = 'badge'
}

export class CreateGamePrizeDto {
  @ApiProperty({
    description: 'Prize name that will be displayed to users',
    example: '100 Points Bonus'
  })
  @IsDefined()
  @IsString()
  prize_name: string;

  @ApiProperty({
    description: 'Detailed description of the prize',
    example: 'Win 100 points bonus reward for completing the spin wheel challenge'
  })
  @IsDefined()
  @IsString()
  prize_description: string;

  @ApiProperty({
    description: 'Type of prize being offered',
    enum: PrizeType,
    example: PrizeType.POINTS
  })
  @IsDefined()
  @IsEnum(PrizeType)
  prize_type: PrizeType;

  @ApiProperty({
    description: 'Specific game this prize applies to (null for all games)',
    example: 'spin-win',
    required: false
  })
  @IsOptional()
  @IsString()
  game_type?: string;

  @ApiProperty({
    description: 'Prize value in JSON format (points_amount, discount_percentage, item_value, etc.)',
    example: {
      points_amount: 100,
      bonus_multiplier: 2
    }
  })
  @IsDefined()
  @IsDefined()
  prize_value: Record<string, any>;

  @ApiProperty({
    description: 'Probability of winning (0.0 to 1.0)',
    example: 0.15
  })
  @IsDefined()
  @IsNumber()
  win_probability: number;

  @ApiProperty({
    description: 'Total quantity available for this prize',
    example: 100
  })
  @IsDefined()
  @IsInt()
  quantity_available: number;

  @ApiProperty({
    description: 'Minimum score required to win this prize',
    example: 500,
    required: false
  })
  @IsOptional()
  @IsInt()
  min_score_required?: number;

  @ApiProperty({
    description: 'Required difficulty level to win this prize',
    example: 'medium',
    required: false,
    enum: ['easy', 'medium', 'hard']
  })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty_required?: string;

  @ApiProperty({
    description: 'Start date when prize becomes available',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString()
  start_date?: Date;

  @ApiProperty({
    description: 'End date when prize is no longer available',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDateString()
  end_date?: Date;
}