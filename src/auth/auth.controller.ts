import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth
} from '@nestjs/swagger';
import { AuthService } from '../modules/customers/auth.service';
import { JwtAuthGuard } from '../modules/customers/jwt-auth.guard';
import {
  CustomerLookupDto,
  RegisterCustomerDto
} from '../modules/customers/dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // Customer Lookup (Login equivalent)
  @Post('customers/lookup')
  @ApiOperation({ summary: 'Customer phone/email lookup' })
  @ApiResponse({ status: 200, description: 'Customer profile retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async customerLookup(@Body() lookupDto: CustomerLookupDto) {
    const result = await this.authService.customerLookup(
      lookupDto.phone_or_email,
      lookupDto.merchant_id
    );

    return {
      success: true,
      message: 'Customer retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Get Customer by Phone/Email (direct access)
  @Get('customers/lookup/:phoneOrEmail')
  @ApiOperation({ summary: 'Get customer by phone/email' })
  @ApiParam({ name: 'phoneOrEmail', description: 'Phone number or email address' })
  @ApiQuery({ name: 'merchant_id', required: true, description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Merchant ID required' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerByPhoneOrEmail(
    @Param('phoneOrEmail') phoneOrEmail: string,
    @Query('merchant_id') merchantId: string
  ) {
    if (!merchantId) {
      return {
        success: false,
        message: 'merchant_id is required',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    const result = await this.authService.getCustomerByPhoneOrEmail(phoneOrEmail, merchantId);

    return {
      success: true,
      message: 'Customer retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Register New Customer
  @Post('customers/register')
  @ApiOperation({ summary: 'Register new customer' })
  @ApiResponse({ status: 201, description: 'Customer registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        merchant_id: { type: 'string', description: 'Merchant ID' },
        name: { type: 'string', description: 'Full name' },
        phone: { type: 'string', description: 'Phone number' },
        email: { type: 'string', description: 'Email address (optional)' },
        instagram: { type: 'string', description: 'Instagram handle (optional)' },
        avatar_url: { type: 'string', description: 'Avatar URL (optional)' },
        age_group: { type: 'string', description: 'Age group (optional)' },
        gender: { type: 'string', description: 'Gender (optional)' },
        location: { type: 'string', description: 'Location (optional)' },
      },
      required: ['merchant_id', 'name', 'phone'],
    }
  })
  async registerNewCustomer(@Body() registerDto: RegisterCustomerDto) {
    const result = await this.authService.registerNewCustomer(registerDto, registerDto.merchant_id);

    return {
      success: true,
      message: 'Customer registered successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Customer Session Management
  @Post('customers/session/create')
  @ApiOperation({ summary: 'Create customer session' })
  @ApiResponse({ status: 201, description: 'Customer session created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string', description: 'Customer ID' },
        merchant_id: { type: 'string', description: 'Merchant ID' },
      },
      required: ['customer_id', 'merchant_id'],
    }
  })
  async createCustomerSession(@Body() body: { customer_id: string; merchant_id: string }) {
    const result = await this.authService.createCustomerSession(body.customer_id);

    return {
      success: true,
      message: 'Customer session created successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('customers/session/:sessionId')
  @ApiOperation({ summary: 'End customer session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Customer session ended successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async endCustomerSession(@Param('sessionId') sessionId: string) {
    const result = await this.authService.endCustomerSession(sessionId);

    return {
      success: true,
      message: 'Customer session ended successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('customers/session/:sessionId')
  @ApiOperation({ summary: 'Get customer session data' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getCustomerSession(@Param('sessionId') sessionId: string) {
    const result = await this.authService.getCustomerSession(sessionId);

    return {
      success: true,
      message: 'Customer session retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Customer Data Retrieval
  @Get('customers/:id/progress')
  @ApiOperation({ summary: 'Get customer game progress and points' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiQuery({ name: 'merchant_id', required: true, description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Customer progress retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerProgress(
    @Param('id') customerId: string,
    @Query('merchant_id') merchantId: string
  ) {
    const result = await this.authService.getCustomerByPhoneOrEmail(customerId, merchantId);

    return {
      success: true,
      message: 'Customer progress retrieved successfully',
      data: {
        customer_id: customerId,
        total_points: result.data.total_points,
        games_played: result.data.games_played,
        current_level: Math.floor(result.data.total_points / 100), // 100 points per level
        achievements: result.data.total_prizes_won,
        last_play_date: result.data.last_play_date,
        preferred_game_type: result.data.preferred_game_type,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('customers/:id/achievements')
  @ApiOperation({ summary: 'Get customer achievements' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiQuery({ name: 'merchant_id', required: true, description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Customer achievements retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerAchievements(
    @Param('id') customerId: string,
    @Query('merchant_id') merchantId: string
  ) {
    const result = await this.authService.getCustomerByPhoneOrEmail(customerId, merchantId);

    return {
      success: true,
      message: 'Customer achievements retrieved successfully',
      data: result.data.total_prizes_won ? result.data.total_prizes_won : 0,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('customers/:id/game-history')
  @ApiOperation({ summary: 'Get customer game sessions' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiQuery({ name: 'merchant_id', required: true, description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Game history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerGameHistory(
    @Param('id') customerId: string,
    @Query('merchant_id') merchantId: string
  ) {
    // This would integrate with the existing GameSession entity for detailed history
    return {
      success: true,
      message: 'Game history retrieved successfully',
      data: {
        customer_id: customerId,
        recent_games: [], // Would be populated with actual game sessions
        total_games_played: 0,
        average_score: 0,
        favorite_game_type: null,
      },
      timestamp: new Date().toISOString(),
    };
  }
}