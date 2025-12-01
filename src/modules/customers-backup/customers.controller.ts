import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerLookupDto,
  CustomerSearchDto,
  UpdateCustomerSegmentDto,
  CustomerSegment
} from './dto/customer.dto';
import { JwtAuthGuard } from '../customers/jwt-auth.guard';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // Customer CRUD Operations
  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    const customer = await this.customersService.create(createCustomerDto);
    return {
      success: true,
      message: 'Customer created successfully',
      data: customer,
      timestamp: new Date().toISOString()
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers for a merchant' })
  @ApiQuery({ name: 'merchant_id', required: true, description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('merchant_id') merchant_id: string) {
    if (!merchant_id) {
      return {
        success: false,
        message: 'merchant_id is required',
        data: null,
        timestamp: new Date().toISOString()
      };
    }

    const customers = await this.customersService.findAll(merchant_id);
    return {
      success: true,
      message: 'Customers retrieved successfully',
      data: customers,
      count: customers.length,
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const customer = await this.customersService.findOne(id);
    return {
      success: true,
      message: 'Customer retrieved successfully',
      data: customer,
      timestamp: new Date().toISOString()
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto
  ) {
    const customer = await this.customersService.update(id, updateCustomerDto);
    return {
      success: true,
      message: 'Customer updated successfully',
      data: customer,
      timestamp: new Date().toISOString()
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer (soft delete)' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    await this.customersService.remove(id);
    return {
      success: true,
      message: 'Customer deleted successfully',
      data: null,
      timestamp: new Date().toISOString()
    };
  }

  // Customer Management
  @Post('search')
  @ApiOperation({ summary: 'Search customers by name/phone/email with filters' })
  @ApiResponse({ status: 200, description: 'Customers searched successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async search(@Body() searchDto: CustomerSearchDto) {
    const result = await this.customersService.searchCustomers(searchDto);
    return {
      success: true,
      message: 'Customers searched successfully',
      data: result.customers,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit)
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get customer game history and achievements' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getHistory(@Param('id') id: string) {
    const history = await this.customersService.getCustomerHistory(id);
    return {
      success: true,
      message: 'Customer history retrieved successfully',
      data: history,
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id/achievements')
  @ApiOperation({ summary: 'Get customer achievements' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer achievements retrieved successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getAchievements(@Param('id') id: string) {
    const achievements = await this.customersService.getCustomerAchievements(id);
    return {
      success: true,
      message: 'Customer achievements retrieved successfully',
      data: achievements,
      count: achievements.length,
      timestamp: new Date().toISOString()
    };
  }

  @Post(':id/segment')
  @ApiOperation({ summary: 'Update customer segment' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer segment updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateSegment(
    @Param('id') id: string,
    @Body() segmentDto: UpdateCustomerSegmentDto
  ) {
    const customer = await this.customersService.updateCustomerSegment(id, segmentDto);
    return {
      success: true,
      message: 'Customer segment updated successfully',
      data: customer,
      timestamp: new Date().toISOString()
    };
  }

  // Data Operations
  @Post('export')
  @ApiOperation({ summary: 'Export customer data (CSV/JSON)' })
  @ApiResponse({ status: 200, description: 'Customers exported successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async export(
    @Body('merchant_id') merchant_id: string,
    @Body('format') format: 'csv' | 'json' = 'csv'
  ) {
    if (!merchant_id) {
      return {
        success: false,
        message: 'merchant_id is required',
        data: null,
        timestamp: new Date().toISOString()
      };
    }

    const exportData = await this.customersService.exportCustomers(merchant_id, format);
    return {
      success: true,
      message: `Customers exported successfully as ${format.toUpperCase()}`,
      data: exportData,
      count: Array.isArray(exportData) ? exportData.length : 0,
      format,
      timestamp: new Date().toISOString()
    };
  }

  @Get('segments/merchant/:merchant_id')
  @ApiOperation({ summary: 'Get customer segment breakdown' })
  @ApiParam({ name: 'merchant_id', description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Customer segments retrieved successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getSegments(@Param('merchant_id') merchant_id: string) {
    const segments = await this.customersService.getCustomerSegments(merchant_id);
    return {
      success: true,
      message: 'Customer segments retrieved successfully',
      data: segments,
      timestamp: new Date().toISOString()
    };
  }

  @Get('analytics/merchant/:merchant_id')
  @ApiOperation({ summary: 'Get customer analytics' })
  @ApiParam({ name: 'merchant_id', description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Customer analytics retrieved successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getAnalytics(@Param('merchant_id') merchant_id: string) {
    const analytics = await this.customersService.getCustomerAnalytics(merchant_id);
    return {
      success: true,
      message: 'Customer analytics retrieved successfully',
      data: analytics,
      timestamp: new Date().toISOString()
    };
  }

  // Customer Authentication (No JWT required - for customer portal)
  @Post('lookup')
  @ApiOperation({ summary: 'Customer phone/email lookup for customer portal' })
  @ApiResponse({ status: 200, description: 'Customer lookup completed' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @HttpCode(HttpStatus.OK)
  async lookup(@Body() lookupDto: CustomerLookupDto) {
    const customer = await this.customersService.lookupCustomer(lookupDto);

    if (!customer) {
      return {
        success: false,
        message: 'Customer not found',
        data: null,
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      message: 'Customer found',
      data: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone, // Already masked
        email: customer.email,
        total_points: customer.total_points,
        games_played: customer.games_played,
        last_play_date: customer.last_play_date,
        customer_segment: customer.customer_segment,
        engagement_score: customer.engagement_score
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get customer profile with progress' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getProfile(@Param('id') id: string) {
    const customer = await this.customersService.findOne(id);

    // Mask phone number for privacy
    const maskedPhone = this.maskPhoneNumber(customer.phone);

    return {
      success: true,
      message: 'Customer profile retrieved successfully',
      data: {
        id: customer.id,
        name: customer.name,
        phone: maskedPhone,
        email: customer.email,
        instagram: customer.instagram,
        avatar_url: customer.avatar_url,
        total_points: customer.total_points,
        games_played: customer.games_played,
        last_play_date: customer.last_play_date,
        first_play_date: customer.first_play_date,
        average_session_duration: customer.average_session_duration,
        preferred_game_type: customer.preferred_game_type,
        engagement_score: customer.engagement_score,
        customer_segment: customer.customer_segment,
        // Include recent achievements count
        recent_achievements: await this.customersService.getCustomerAchievements(id)
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get customer game progress and points' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer progress retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getProgress(@Param('id') id: string) {
    const customer = await this.customersService.findOne(id);

    return {
      success: true,
      message: 'Customer progress retrieved successfully',
      data: {
        total_points: customer.total_points,
        games_played: customer.games_played,
        total_session_duration: customer.total_session_duration,
        average_session_duration: customer.average_session_duration,
        last_play_date: customer.last_play_date,
        engagement_score: customer.engagement_score,
        customer_segment: customer.customer_segment,
        // Calculate level based on points (100 points per level from spec)
        current_level: Math.floor(customer.total_points / 100),
        points_to_next_level: 100 - (customer.total_points % 100),
        progress_percentage: (customer.total_points % 100)
      },
      timestamp: new Date().toISOString()
    };
  }

  // Private helper method
  private maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 4) return phone;
    const lastFour = phone.slice(-4);
    const maskedPart = '*'.repeat(Math.max(0, phone.length - 4));
    return maskedPart + lastFour;
  }
}
