import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  IsDateString,
  Min,
  Max,
  IsBoolean
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional
} from '@nestjs/swagger';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

export enum RuleType {
  MULTIPLIER = 'multiplier',
  POINTS_PER_DOLLAR = 'points_per_dollar',
  MIN_POINTS_REQUIRED = 'min_points_required',
  MAX_POINTS_PER_DAY = 'max_points_per_day',
  VALIDITY_DAYS = 'validity_days',
  TARGET_AUDIENCE = 'target_audience',
  CUSTOMER_SEGMENT_FILTER = 'customer_segment_filter'
}

export enum TransactionType {
  EARNED = 'earned',
  REDEEMED = 'redeemed',
  ADJUSTMENT = 'adjustment',
  REFUND = 'refund',
  BONUS = 'bonus'
}

export class CreateLoyaltyRuleDto {
  @ApiProperty({
    description: 'Rule name',
    example: 'Birthday Bonus Multiplier',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Rule description',
    example: 'Double points on customer birthday',
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Type of loyalty rule',
    example: 'multiplier',
  })
  @IsEnum(RuleType)
  @IsNotEmpty()
  rule_type: RuleType;

  @ApiProperty({
    description: 'Points awarded per dollar spent',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  points_per_dollar: number;

  @ApiProperty({
    description: 'Minimum points required to activate rule',
    example: 50,
  })
  @IsInt()
  @IsOptional()
  min_points_required: number;

  @ApiProperty({
    description: 'Points multiplier',
    example: 1.5,
  })
  @IsNumber()
  @IsOptional()
  multiplier: number;

  @ApiProperty({
    description: 'Maximum points per customer per day',
    example: 500,
  })
  @IsInt()
  @IsOptional()
  max_points_per_day: number;

  @ApiProperty({
    description: 'How many days the rule is valid',
    example: 30,
  })
  @IsInt()
  @IsOptional()
  validity_days: number;

  @ApiProperty({
    description: 'Rule only applies to new customers',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  applies_to_new_customers_only: boolean;

  @ApiProperty({
    description: 'Target audience for this rule',
    example: 'all',
  })
  @IsOptional()
  target_audience: string;

  @ApiProperty({
    description: 'Customer segments this rule applies to',
    example: 'vip',
  })
  @IsOptional()
  customer_segment_filter: string;

  @ApiProperty({
    description: 'Start date for rule',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  start_date: Date;

  @ApiProperty({
    description: 'End date for rule',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  end_date: Date;

  @ApiProperty({
    description: 'Merchant ID for rule',
    example: 'merchant-123',
  })
  @IsString()
  @IsNotEmpty()
  merchant_id: string;
}

export class UpdateLoyaltyRuleDto {
  @ApiProperty({
    description: 'Rule ID',
    example: 'rule-123',
  })
  @IsUUID()
  rule_id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  rule_type: RuleType;

  @ApiProperty({
    description: 'Points awarded per dollar spent',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  points_per_dollar: number;

  @ApiProperty({
    description: 'Minimum points required to activate rule',
    example: 50,
  })
  @IsInt()
  @IsOptional()
  min_points_required: number;

  @ApiProperty({
    description: 'Points multiplier',
    example: 1.5,
  })
  @IsNumber()
  @IsOptional()
  multiplier: number;

  @ApiProperty({
    description: 'Maximum points per customer per day',
    example: 500,
  })
  @IsInt()
  @IsOptional()
  max_points_per_day: number;

  @ApiProperty({
    description: 'How many days the rule is valid',
    example: 30,
  })
  @IsInt()
  @IsOptional()
  validity_days: number;

  @ApiProperty({
    description: 'Rule only applies to new customers',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  applies_to_new_customers_only: boolean;

  @ApiProperty()
  @IsOptional()
  target_audience: string;

  @ApiProperty()
  @IsOptional()
  customer_segment_filter: string;

  @ApiProperty({
    description: 'Start date for rule',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  start_date: Date;

  @ApiProperty()
  @IsOptional()
  end_date: Date;

  @ApiProperty({
    description: 'Whether rule is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active: boolean;
}

export class CreateLoyaltyTransactionDto {
  @ApiProperty({
    description: 'Transaction ID',
    example: 'txn-123',
  })
  @IsUUID()
  transaction_id: string;

  @ApiProperty({
    description: 'Customer ID',
    example: 'customer-123',
  })
  @IsUUID()
  customer_id: string;

  @ApiProperty({
    description: 'Type of transaction',
    example: 'earned',
  })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  transaction_type: TransactionType;

  @ApiProperty({
    description: 'Points change amount',
    example: 50,
  })
  @IsInt()
  @IsOptional()
  points_change: number;

  @ApiProperty({
    description: 'Balance before transaction',
    example: 100.50,
  })
  @IsNumber()
  @IsOptional()
  balance_before: number;

  @ApiProperty({
    description: 'Balance after transaction',
    example: 150.50,
  })
  @IsNumber()
  @IsOptional()
  balance_after: number;

  @ApiProperty({
    description: 'Reference ID (e.g., receipt number)',
    example: 'receipt-123',
  })
  @IsString()
  @IsOptional()
  reference_id: string;

  @ApiProperty({
    description: 'Reward ID if applicable',
    example: 'reward-123',
  })
  @IsUUID()
  @IsOptional()
  reward_id: string;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Birthday bonus earned',
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    description: 'Additional transaction metadata',
    example: '{"source": "mobile_app"}',
  })
  @IsOptional()
  metadata: any;

  @ApiProperty({
    description: 'Expiration date for points/rewards',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  expires_at: Date;

  @ApiProperty({
    description: 'Merchant ID',
    example: 'merchant-123',
  })
  @IsUUID()
  merchant_id: string;
}

export class CreateLoyaltyRewardDto {
  @ApiProperty({
    description: 'Reward name',
    example: 'Free Coffee',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Reward description',
    example: 'Free coffee for every 100 points',
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    description: 'Points cost to redeem reward',
    example: 100,
  })
  @IsInt()
  @IsOptional()
  points_cost: number;

  @ApiProperty({
    description: 'Available quantity',
    example: 50,
  })
  @IsInt()
  @IsOptional()
  stock_quantity: number;

  @ApiProperty({
    description: 'Reward available from date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  available_from: Date;

  @ApiProperty({
    description: 'Reward available until date',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  available_until: Date;

  @ApiProperty({
    description: 'Target audience for this reward',
    example: 'all',
  })
  @IsOptional()
  target_audience: string;

  @ApiProperty({
    description: 'Customer segments this reward applies to',
    example: 'vip',
  })
  @IsOptional()
  customer_segment_filter: string;

  @ApiProperty({
    description: 'Merchant ID',
    example: 'merchant-123',
  })
  @IsUUID()
  merchant_id: string;
}

export class CustomerBalanceDto {
  @ApiProperty({
    description: 'Customer ID',
    example: 'customer-123',
  })
  @IsUUID()
  customer_id: string;

  @ApiProperty({
    description: 'Total points available',
    example: 150,
  })
  @IsInt()
  @IsOptional()
  points_available: number;
}

export class CustomerMetricsDto {
  @ApiProperty({
    description: 'Total transactions',
    example: 25,
  })
  @IsInt()
  @IsOptional()
  total_transactions: number;

  @ApiProperty({
    description: 'Total points earned',
    example: 500,
  })
  @IsInt()
  @IsOptional()
  total_points_earned: number;

  @ApiProperty({
    description: 'Total points redeemed',
    example: 2,
  })
  @IsInt()
  @IsOptional()
  total_points_redeemed: number;

  @ApiProperty({
    description: 'Net points pending',
    example: 498,
  })
  @IsInt()
  @IsOptional()
  net_points_pending: number;

  @ApiProperty({
    description: 'Current engagement score',
    example: 0.85,
  })
  @IsNumber()
  @IsOptional()
  engagement_score: number;

  @ApiProperty({
    description: 'Customer segment',
    example: 'vip',
  })
  @IsString()
  @IsOptional()
  customer_segment: string;

  @ApiProperty({
    description: 'Last activity date',
    example: '2024-12-15T10:30:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  last_activity: Date;
}