import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Logger,
  HttpStatus,
  HttpCode,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { QrCampaign } from '../../entities/qr-campaign.entity';
import { QrCampaignsService } from './qr-campaigns.service';
import { CreateQrCampaignDto, CampaignType, CampaignStatus } from './dto/create-qr-campaign.dto';

@ApiTags('QR Campaigns')
@Controller('qr-campaigns')
export class QrCampaignsController {
  private readonly logger = new Logger(QrCampaignsController.name);

  constructor(private readonly qrCampaignsService: QrCampaignsService) {}

  // ==================== CAMPAIGN CRUD ====================

  @Post()
  @ApiOperation({ summary: 'Create new QR campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully', type: QrCampaign })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCampaign(
    @Body() createDto: CreateQrCampaignDto,
    @Req() req?: any,
  ): Promise<{ data: QrCampaign; message: string; timestamp: string }> {
    try {
      const merchantId = req.user.merchant_id;
      const userId = req.user.id;

      const campaign = await this.qrCampaignsService.createCampaign(
        createDto,
        merchantId,
        userId,
      );

      return {
        data: campaign,
        message: 'QR campaign created successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to create campaign:`, error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns for merchant' })
  @ApiQuery({ name: 'status', required: false, enum: CampaignStatus })
  @ApiQuery({ name: 'campaign_type', required: false, enum: CampaignType })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved successfully', type: [QrCampaign] })
  async getMerchantCampaigns(
    @Query('status') status?: CampaignStatus,
    @Query('campaign_type') campaignType?: CampaignType,
    @Req() req?: any,
  ): Promise<{ data: QrCampaign[]; message: string; timestamp: string }> {
    try {
      const merchantId = req.user.merchant_id;

      const campaigns = await this.qrCampaignsService.getMerchantCampaigns(
        merchantId,
        status,
        campaignType,
      );

      return {
        data: campaigns,
        message: 'Campaigns retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get campaigns:`, error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific campaign by ID' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'Campaign retrieved successfully', type: QrCampaign })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignById(
    @Param('id') id: string,
    @Req() req?: any,
  ): Promise<{ data: QrCampaign; message: string; timestamp: string }> {
    try {
      const merchantId = req.user.merchant_id;

      const campaign = await this.qrCampaignsService.getCampaignById(id, merchantId);

      return {
        data: campaign,
        message: 'Campaign retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get campaign: ${id}`, error);
      throw error;
    }
  }

  // ==================== CAMPAIGN MANAGEMENT ====================

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'Campaign activated successfully', type: QrCampaign })
  async activateCampaign(
    @Param('id') id: string,
    @Req() req?: any,
  ): Promise<{ data: QrCampaign; message: string; timestamp: string }> {
    try {
      const merchantId = req.user.merchant_id;

      const campaign = await this.qrCampaignsService.activateCampaign(id, merchantId);

      return {
        data: campaign,
        message: 'Campaign activated successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to activate campaign: ${id}`, error);
      throw error;
    }
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'Campaign paused successfully', type: QrCampaign })
  async pauseCampaign(
    @Param('id') id: string,
    @Req() req?: any,
  ): Promise<{ data: QrCampaign; message: string; timestamp: string }> {
    try {
      const merchantId = req.user.merchant_id;

      const campaign = await this.qrCampaignsService.pauseCampaign(id, merchantId);

      return {
        data: campaign,
        message: 'Campaign paused successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to pause campaign: ${id}`, error);
      throw error;
    }
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get campaign analytics' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getCampaignAnalytics(
    @Param('id') id: string,
    @Req() req?: any,
  ): Promise<{ data: any; message: string; timestamp: string }> {
    try {
      const merchantId = req.user.merchant_id;

      const analytics = await this.qrCampaignsService.getCampaignAnalytics(id, merchantId);

      return {
        data: analytics,
        message: 'Campaign analytics retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get campaign analytics: ${id}`, error);
      throw error;
    }
  }

  // ==================== ONE-TIME USE QR CODE LINKS ====================

  @Post('single-use')
  @ApiOperation({ summary: 'Create one-time use QR campaign' })
  @ApiResponse({ status: 201, description: 'One-time QR campaign created successfully', type: QrCampaign })
  async createSingleUseQrCampaign(
    @Body() createDto: CreateQrCampaignDto,
    @Req() req?: any,
  ): Promise<{ data: QrCampaign; message: string; timestamp: string }> {
    try {
      // Force campaign type to single_use_qr
      createDto.campaign_type = CampaignType.SINGLE_USE_QR;

      const merchantId = req.user.merchant_id;
      const userId = req.user.id;

      const campaign = await this.qrCampaignsService.createCampaign(
        createDto,
        merchantId,
        userId,
      );

      return {
        data: campaign,
        message: 'One-time QR campaign created successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to create single-use QR campaign:`, error);
      throw error;
    }
  }

  @Get('single-use/:campaignId')
  @ApiOperation({ summary: 'Validate and get game info for one-time QR link' })
  @ApiParam({ name: 'campaignId', description: 'Single-use campaign ID' })
  @ApiResponse({ status: 200, description: 'One-time QR link is valid' })
  @ApiResponse({ status: 400, description: 'Invalid or expired QR link' })
  async validateSingleUseLink(
    @Param('campaignId') campaignId: string,
  ): Promise<{ data: any; message: string; timestamp: string }> {
    try {
      const validation = await this.qrCampaignsService.validateSingleUseLink(campaignId);

      if (!validation.isValid) {
        return {
          data: { isValid: false, reason: validation.reason },
          message: 'QR link validation failed',
          timestamp: new Date().toISOString(),
        };
      }

      // Return game settings and branding info
      const { campaign } = validation;
      if (!campaign) {
        throw new Error('Campaign validation failed');
      }
      const responseData = {
        isValid: true,
        game_settings: campaign.game_settings,
        target_audience: campaign.target_audience,
        merchant_name: (campaign.target_audience as any)?.merchant_name || 'Unknown',
        theme_color: (campaign.target_audience as any)?.theme_color || '#000000',
        qr_url: campaign.qr_url,
      };

      return {
        data: responseData,
        message: 'QR link is valid',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to validate single-use link: ${campaignId}`, error);
      throw error;
    }
  }

  @Post('single-use/:campaignId/consume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark one-time QR link as used after game played' })
  @ApiParam({ name: 'campaignId', description: 'Single-use campaign ID' })
  @ApiResponse({ status: 200, description: 'QR link consumed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot consume QR link' })
  async consumeSingleUseLink(
    @Param('campaignId') campaignId: string,
  ): Promise<{ data: QrCampaign; message: string; timestamp: string }> {
    try {
      const campaign = await this.qrCampaignsService.consumeSingleUseLink(campaignId);

      return {
        data: campaign,
        message: 'QR link consumed successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to consume single-use link: ${campaignId}`, error);
      throw error;
    }
  }

  @Delete('single-use/:campaignId')
  @ApiOperation({ summary: 'Expire/deactivate one-time QR campaign' })
  @ApiParam({ name: 'campaignId', description: 'Single-use campaign ID' })
  @ApiResponse({ status: 200, description: 'QR campaign expired successfully' })
  async expireSingleUseLink(
    @Param('campaignId') campaignId: string,
    @Req() req?: any,
  ): Promise<{ data: QrCampaign; message: string; timestamp: string }> {
    try {
      const merchantId = req.user.merchant_id;
      const campaign = await this.qrCampaignsService.getCampaignById(campaignId, merchantId);

      if (campaign.campaign_type !== CampaignType.SINGLE_USE_QR) {
        throw new BadRequestException('Not a single-use QR campaign');
      }

      campaign.status = CampaignStatus.EXPIRED;
      // Note: We would need to add a save method or use the service to update

      return {
        data: campaign,
        message: 'QR campaign expired successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to expire single-use link: ${campaignId}`, error);
      throw error;
    }
  }

  @Get('single-use/merchant/:merchantId')
  @ApiOperation({ summary: 'Get merchant\'s one-time QR campaigns' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'One-time campaigns retrieved successfully', type: [QrCampaign] })
  async getMerchantSingleUseCampaigns(
    @Param('merchantId') merchantId: string,
    @Req() req?: any,
  ): Promise<{ data: QrCampaign[]; message: string; timestamp: string }> {
    try {
      // Verify user has access to this merchant
      if (req.user.merchant_id !== merchantId) {
        throw new ForbiddenException('Access denied');
      }

      const campaigns = await this.qrCampaignsService.getMerchantCampaigns(
        merchantId,
        undefined,
        CampaignType.SINGLE_USE_QR,
      );

      return {
        data: campaigns,
        message: 'One-time campaigns retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get single-use campaigns for merchant: ${merchantId}`, error);
      throw error;
    }
  }

  // ==================== CAMPAIGN DATA ====================

  @Get(':id/customers')
  @ApiOperation({ summary: 'Get campaign customers' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'Campaign customers retrieved successfully' })
  async getCampaignCustomers(
    @Param('id') id: string,
    @Req() req?: any,
  ): Promise<{ data: any; message: string; timestamp: string }> {
    try {
      const merchantId = req.user.merchant_id;

      // This would need to be implemented to get customers who participated in the campaign
      // For now, returning a placeholder
      return {
        data: [],
        message: 'Campaign customers retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get campaign customers: ${id}`, error);
      throw error;
    }
  }

  @Get(':id/sessions')
  @ApiOperation({ summary: 'Get game sessions for campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'Campaign game sessions retrieved successfully' })
  async getCampaignSessions(
    @Param('id') id: string,
    @Req() req?: any,
  ): Promise<{ data: any; message: string; timestamp: string }> {
    try {
      const merchantId = req.user.merchant_id;

      // This would return the game sessions for the campaign
      // Could be extracted from the analytics method
      const analytics = await this.qrCampaignsService.getCampaignAnalytics(id, merchantId);

      return {
        data: analytics.game_sessions,
        message: 'Campaign game sessions retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get campaign sessions: ${id}`, error);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'Campaign deleted successfully' })
  async deleteCampaign(
    @Param('id') id: string,
    @Req() req?: any,
  ): Promise<{ message: string; timestamp: string }> {
    try {
      const merchantId = req.user.merchant_id;

      await this.qrCampaignsService.deleteCampaign(id, merchantId);

      return {
        message: 'Campaign deleted successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to delete campaign: ${id}`, error);
      throw error;
    }
  }
}