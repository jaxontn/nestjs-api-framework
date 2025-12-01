import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Patch, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import {
  CreateLoyaltyRuleDto,
  UpdateLoyaltyRuleDto,
  CreateLoyaltyTransactionDto,
  CustomerBalanceDto,
  CustomerMetricsDto,
  CreateLoyaltyRewardDto,
} from './dto/loyalty.dto';

@ApiTags('Loyalty')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // Loyalty Rules Management
  @Post('rules')
  @ApiOperation({ summary: 'Create new loyalty rule' })
  @ApiResponse({ status: 201, description: 'Loyalty rule created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createLoyaltyRule(@Body() createRuleData: CreateLoyaltyRuleDto) {
    const result = await this.loyaltyService.createLoyaltyRule(createRuleData);
    return {
      success: true,
      message: 'Loyalty rule created successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('rules/:merchantId')
  @ApiOperation({ summary: 'Get loyalty rules for merchant' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Loyalty rules retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getLoyaltyRules(@Param('merchantId') merchantId: string) {
    const result = await this.loyaltyService.getLoyaltyRules(merchantId);
    return {
      success: true,
      message: 'Loyalty rules retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('rules/:ruleId')
  @ApiOperation({ summary: 'Update loyalty rule' })
  @ApiParam({ name: 'ruleId', description: 'Rule ID' })
  @ApiResponse({ status: 200, description: 'Loyalty rule updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Loyalty rule not found' })
  async updateLoyaltyRule(
    @Param('ruleId') ruleId: string,
    @Body() updateData: UpdateLoyaltyRuleDto,
    @Query('merchant_id') merchantId: string,
  ): Promise<any> {
    const result = await this.loyaltyService.updateLoyaltyRule(ruleId, updateData);
    return {
      success: true,
      message: 'Loyalty rule updated successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('rules/:ruleId')
  @ApiOperation({ summary: 'Delete loyalty rule' })
  @ApiParam({ name: 'ruleId', description: 'Rule ID' })
  @ApiResponse({ status: 200, description: 'Loyalty rule deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Loyalty rule not found' })
  async deleteLoyaltyRule(
    @Param('ruleId') ruleId: string,
    @Query('merchant_id') merchantId: string,
  ) {
    const result = await this.loyaltyService.deleteLoyaltyRule(ruleId);
    return {
      success: true,
      message: 'Loyalty rule deleted successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Points System
  @Post('transactions')
  @ApiOperation({ summary: 'Record points transaction' })
  @ApiResponse({ status: 201, description: 'Points transaction recorded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async recordPointsTransaction(@Body() transactionData: CreateLoyaltyTransactionDto) {
    const result = await this.loyaltyService.recordPointsTransaction(transactionData);
    return {
      success: true,
      message: 'Points transaction recorded successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('transactions/:customerId')
  @ApiOperation({ summary: 'Get customer points transactions' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiQuery({ name: 'merchant_id', required: true, description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Points transactions retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getPointsTransactions(
    @Param('customerId') customerId: string,
    @Query('merchant_id') merchantId: string,
  ): Promise<any> {
    const result = await this.loyaltyService.getPointsTransactions(customerId, merchantId);
    return {
      success: true,
      message: 'Points transactions retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('transactions/:customerId/balance')
  @ApiOperation({ summary: 'Get customer points balance' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiQuery({ name: 'merchant_id', required: true, description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Customer points balance retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerPointsBalance(
    @Param('customerId') customerId: string,
    @Query('merchant_id') merchantId: string,
  ): Promise<any> {
    const result = await this.loyaltyService.getCustomerPointsBalance(customerId, merchantId);
    return {
      success: true,
      message: 'Customer points balance retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Rewards Catalog
  @Post('rewards')
  @ApiOperation({ summary: 'Create new reward' })
  @ApiResponse({ status: 201, description: 'Reward created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createReward(
    @Body() createRewardData: CreateLoyaltyRewardDto,
    @Query('merchant_id') merchantId: string,
  ) {
    const result = await this.loyaltyService.createReward(createRewardData);
    return {
      success: true,
      message: 'Reward created successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('rewards/:merchantId')
  @ApiOperation({ summary: 'Get rewards catalog' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Rewards catalog retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getRewardsCatalog(@Param('merchantId') merchantId: string): Promise<any> {
    const result = await this.loyaltyService.getRewardsCatalog(merchantId);
    return {
      success: true,
      message: 'Rewards catalog retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('rewards/:merchantId/:rewardId')
  @ApiOperation({ summary: 'Get specific reward' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiParam({ name: 'rewardId', description: 'Reward ID' })
  @ApiResponse({ status: 200, description: 'Reward retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Reward not found' })
  async getReward(
    @Param('merchantId') merchantId: string,
    @Param('rewardId') rewardId: string,
  ): Promise<any> {
    const result = await this.loyaltyService.getReward(merchantId, rewardId);
    return {
      success: true,
      message: 'Reward retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Analytics
  @Get('analytics/:merchantId')
  @ApiOperation({ summary: 'Get loyalty program analytics' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Loyalty analytics retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getLoyaltyAnalytics(@Param('merchantId') merchantId: string): Promise<any> {
    const result = await this.loyaltyService.getLoyaltyAnalytics(merchantId);
    return {
      success: true,
      message: 'Loyalty analytics retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('leaderboard/:merchantId')
  @ApiOperation({ summary: 'Get loyalty points leaderboard' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Loyalty leaderboard retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getLoyaltyLeaderboard(
    @Param('merchantId') merchantId: string,
  ): Promise<any> {
    const result = await this.loyaltyService.getLoyaltyLeaderboard(merchantId);
    return {
      success: true,
      message: 'Loyalty leaderboard retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}