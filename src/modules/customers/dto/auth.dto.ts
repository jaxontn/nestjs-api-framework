import { IsEmail, IsPhoneNumber, IsOptional, IsString, Matches, MinLength, MaxLength, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerLookupDto {
  @ApiProperty({
    description: 'Phone number or email address for customer lookup',
    example: '+1 (555) 123-4567 or customer@example.com',
  })
  @IsString()
  @IsNotEmpty()
  phone_or_email: string;
@ApiProperty({
  description: 'Merchant ID',
  example: 'merchant-123',
})
@IsString()
@IsNotEmpty()
merchant_id: string;
}

export class RegisterCustomerDto {
  @ApiProperty({
    description: 'Merchant ID for customer registration',
    example: 'merchant-123',
  })
  @IsString()
  @IsNotEmpty()
  merchant_id: string;

  @ApiProperty({
    description: 'Full name of the customer',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Phone number of the customer',
    example: '+1 (555) 123-4567',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Email address of the customer (optional)',
    example: 'customer@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Instagram handle of the customer (optional)',
    example: '@johndoe',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsOptional()
  instagram?: string;

  @ApiProperty({
    description: 'Avatar URL of the customer (optional)',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  @IsOptional()
  avatar_url?: string;

  @ApiProperty({
    description: 'Age group of the customer (optional)',
    example: '18-25',
    required: false,
  })
  @IsString()
  @Matches(/^(children|teen|young-adult|adult|senior)$/)
  @IsOptional()
  @IsOptional()
  age_group?: string;

  @ApiProperty({
    description: 'Gender of the customer (optional)',
    example: 'male',
    required: false,
  })
  @IsString()
  @Matches(/^(male|female|other|prefer-not-to-say)$/)
  @IsOptional()
  @IsOptional()
  gender?: string;

  @ApiProperty({
    description: 'Location of the customer (optional)',
    example: 'New York, NY',
    required: false,
  })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  @IsOptional()
  location?: string;
}

export class CreateCustomerSessionDto {
  @ApiProperty({
    description: 'Customer ID for session creation',
    example: 'customer-123',
  })
  @IsString()
  @IsNotEmpty()
  customer_id: string;

  @ApiProperty({
    description: 'Merchant ID for customer session',
    example: 'merchant-123',
  })
  @IsString()
  @IsNotEmpty()
  merchant_id: string;
}

export class CustomerSessionDataDto {
  @ApiProperty({
    description: 'Customer session data',
    example: {
      customer_id: 'customer-123',
      total_points: 150,
      games_played: 12,
      completion_rate: 83.33,
      achievements: ['First Win', 'Speed Demon'],
    }
  })
  customer_id: string;
  total_points: number;
  games_played: number;
  current_level: number;
  achievements: number;
  last_play_date: string;
  preferred_game_type: string;
  customer_segment: string;
  engagement_score: number;
  created_at: string;
}