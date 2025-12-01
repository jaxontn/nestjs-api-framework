import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { QrCampaign } from '../../entities/qr-campaign.entity';
import { Merchant } from '../../entities/merchant.entity';
import { MerchantUser } from '../../entities/merchant-user.entity';
import { GameSession } from '../../entities/game-session.entity';
import { CampaignType, CampaignStatus } from './dto/create-qr-campaign.dto';
import { CreateQrCampaignDto } from './dto/create-qr-campaign.dto';
import { QrCodeService } from './qr-code.service';

@Injectable()
export class QrCampaignsService {
  private readonly logger = new Logger(QrCampaignsService.name);

  constructor(
    @InjectRepository(QrCampaign)
    private readonly qrCampaignRepository: Repository<QrCampaign>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(MerchantUser)
    private readonly merchantUserRepository: Repository<MerchantUser>,
    private readonly qrCodeService: QrCodeService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create new QR campaign
   */
  async createCampaign(
    createDto: CreateQrCampaignDto,
    merchantId: string,
    createdBy: string,
  ): Promise<QrCampaign> {
    try {
      // Verify merchant exists
      const merchant = await this.merchantRepository.findOne({
        where: { id: merchantId },
      });
      if (!merchant) {
        throw new NotFoundException('Merchant not found');
      }

      // Verify merchant user exists
      const merchantUser = await this.merchantUserRepository.findOne({
        where: { id: createdBy, merchant_id: merchantId },
      });
      if (!merchantUser) {
        throw new ForbiddenException('Invalid merchant user');
      }

      // Generate campaign ID
      const campaignId = this.qrCodeService.generateCampaignId();

      // Set default values for single-use campaigns
      const gameSettings = createDto.game_settings || {};
      if (createDto.campaign_type === CampaignType.SINGLE_USE_QR) {
        gameSettings.auto_expire = true;
        gameSettings.expiration_days = gameSettings.expiration_days || 30;
      }

      // Create campaign
      const campaign = new QrCampaign();
      campaign.id = campaignId;
      campaign.merchant_id = merchantId;
      campaign.name = createDto.name;
      campaign.description = createDto.description || '';
      campaign.campaign_type = createDto.campaign_type;
      campaign.game_settings = gameSettings;
      campaign.target_audience = createDto.target_audience || {};
      campaign.start_date = createDto.start_date ? new Date(createDto.start_date) : new Date();
      campaign.end_date = createDto.end_date ? new Date(createDto.end_date) : new Date();
      campaign.budget = createDto.budget || 0;
      campaign.target_roi = createDto.target_roi || 0;
      campaign.status = CampaignStatus.DRAFT;
      campaign.created_by = createdBy;

      // Generate QR code
      const { qr_url, qr_code_image } = await this.qrCodeService.generateQrCode(
        campaignId,
        merchantId,
        createDto.campaign_type,
      );

      campaign.qr_url = qr_url;
      campaign.qr_code_image = qr_code_image;
      campaign.landing_page_url = this.qrCodeService.generateLandingPageUrl(
        merchantId,
        campaignId,
      );

      const savedCampaign = await this.qrCampaignRepository.save(campaign);

      this.logger.log(`Created QR campaign: ${campaignId} for merchant: ${merchantId}`);
      return savedCampaign;
    } catch (error) {
      this.logger.error(`Failed to create campaign:`, error);
      throw error;
    }
  }

  /**
   * Get all campaigns for a merchant
   */
  async getMerchantCampaigns(
    merchantId: string,
    status?: CampaignStatus,
    campaignType?: CampaignType,
  ): Promise<QrCampaign[]> {
    try {
      const whereConditions: any = { merchant_id: merchantId };

      if (status) {
        whereConditions.status = status;
      }
      if (campaignType) {
        whereConditions.campaign_type = campaignType;
      }

      return await this.qrCampaignRepository.find({
        where: whereConditions,
        order: { created_at: 'DESC' },
        relations: ['created_by_user'],
      });
    } catch (error) {
      this.logger.error(`Failed to get campaigns for merchant: ${merchantId}`, error);
      throw error;
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string, merchantId?: string): Promise<QrCampaign> {
    try {
      const whereCondition: any = { id: campaignId };
      if (merchantId) {
        whereCondition.merchant_id = merchantId;
      }

      const campaign = await this.qrCampaignRepository.findOne({
        where: whereCondition,
        relations: ['merchant', 'created_by_user'],
      });

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      return campaign;
    } catch (error) {
      this.logger.error(`Failed to get campaign: ${campaignId}`, error);
      throw error;
    }
  }

  /**
   * Activate campaign
   */
  async activateCampaign(campaignId: string, merchantId: string): Promise<QrCampaign> {
    try {
      const campaign = await this.getCampaignById(campaignId, merchantId);

      if (campaign.status !== CampaignStatus.DRAFT) {
        throw new BadRequestException('Only draft campaigns can be activated');
      }

      campaign.status = CampaignStatus.ACTIVE;
      campaign.activated_at = new Date();

      const savedCampaign = await this.qrCampaignRepository.save(campaign);

      this.logger.log(`Activated campaign: ${campaignId}`);
      return savedCampaign;
    } catch (error) {
      this.logger.error(`Failed to activate campaign: ${campaignId}`, error);
      throw error;
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string, merchantId: string): Promise<QrCampaign> {
    try {
      const campaign = await this.getCampaignById(campaignId, merchantId);

      if (campaign.status !== CampaignStatus.ACTIVE) {
        throw new BadRequestException('Only active campaigns can be paused');
      }

      campaign.status = CampaignStatus.PAUSED;
      const savedCampaign = await this.qrCampaignRepository.save(campaign);

      this.logger.log(`Paused campaign: ${campaignId}`);
      return savedCampaign;
    } catch (error) {
      this.logger.error(`Failed to pause campaign: ${campaignId}`, error);
      throw error;
    }
  }

  /**
   * Validate single-use QR link
   */
  async validateSingleUseLink(campaignId: string): Promise<{
    isValid: boolean;
    campaign?: QrCampaign;
    reason?: string;
  }> {
    try {
      const campaign = await this.qrCampaignRepository.findOne({
        where: {
          id: campaignId,
          campaign_type: CampaignType.SINGLE_USE_QR,
        },
      });

      if (!campaign) {
        return { isValid: false, reason: 'Campaign not found or not a single-use QR' };
      }

      // Check if campaign is active
      if (campaign.status !== CampaignStatus.ACTIVE) {
        return { isValid: false, reason: 'Campaign is not active', campaign };
      }

      // Check if expired
      if (campaign.end_date && new Date() > campaign.end_date) {
        return { isValid: false, reason: 'Campaign has expired', campaign };
      }

      // Check if already used
      if (campaign.total_participants >= 1) {
        return { isValid: false, reason: 'Link has already been used', campaign };
      }

      return { isValid: true, campaign };
    } catch (error) {
      this.logger.error(`Failed to validate single-use link: ${campaignId}`, error);
      return { isValid: false, reason: 'Validation error' };
    }
  }

  /**
   * Consume single-use QR link (mark as used after game played)
   */
  async consumeSingleUseLink(campaignId: string): Promise<QrCampaign> {
    try {
      const campaign = await this.qrCampaignRepository.findOne({
        where: {
          id: campaignId,
          campaign_type: CampaignType.SINGLE_USE_QR,
        },
      });

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      if (campaign.status !== CampaignStatus.ACTIVE) {
        throw new BadRequestException('Campaign is not active');
      }

      if (campaign.total_participants >= 1) {
        throw new BadRequestException('Link has already been used');
      }

      // Update campaign status and tracking
      campaign.status = CampaignStatus.USED;
      campaign.total_participants = 1;
      campaign.unique_scans = 1;
      campaign.conversion_rate = 100;

      const savedCampaign = await this.qrCampaignRepository.save(campaign);

      this.logger.log(`Consumed single-use link: ${campaignId}`);
      return savedCampaign;
    } catch (error) {
      this.logger.error(`Failed to consume single-use link: ${campaignId}`, error);
      throw error;
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string, merchantId: string) {
    try {
      const campaign = await this.getCampaignById(campaignId, merchantId);

      // Get game sessions for this campaign
      const gameSessions = await this.dataSource
        .getRepository(GameSession)
        .find({
          where: { campaign_id: campaignId },
          order: { started_at: 'DESC' },
        });

      const totalSessions = gameSessions.length;
      const completedSessions = gameSessions.filter(session => session.was_completed).length;
      const totalPointsAwarded = gameSessions.reduce((sum, session) => sum + session.points_earned, 0);
      const averageSessionDuration = totalSessions > 0
        ? gameSessions.reduce((sum, session) => sum + (session.session_duration || 0), 0) / totalSessions
        : 0;

      return {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          type: campaign.campaign_type,
          status: campaign.status,
        },
        metrics: {
          total_scans: campaign.total_scans,
          unique_scans: campaign.unique_scans,
          total_participants: campaign.total_participants,
          total_sessions: totalSessions,
          completed_sessions: completedSessions,
          completion_rate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
          total_points_awarded: totalPointsAwarded,
          average_session_duration: averageSessionDuration,
          conversion_rate: campaign.conversion_rate,
          revenue_generated: campaign.revenue_generated,
          budget: campaign.budget,
          total_spent: campaign.total_spent,
          roi: campaign.actual_roi,
        },
        game_sessions: gameSessions,
      };
    } catch (error) {
      this.logger.error(`Failed to get campaign analytics: ${campaignId}`, error);
      throw error;
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string, merchantId: string): Promise<void> {
    try {
      const campaign = await this.getCampaignById(campaignId, merchantId);

      // Only allow deletion of draft or expired campaigns
      if (!['draft', 'expired', 'used'].includes(campaign.status)) {
        throw new BadRequestException('Cannot delete active or paused campaigns');
      }

      await this.qrCampaignRepository.remove(campaign);

      this.logger.log(`Deleted campaign: ${campaignId}`);
    } catch (error) {
      this.logger.error(`Failed to delete campaign: ${campaignId}`, error);
      throw error;
    }
  }
}