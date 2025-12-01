import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { CampaignType } from './dto/create-qr-campaign.dto';

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);

  /**
   * Generate QR code for campaign
   */
  async generateQrCode(
    campaignId: string,
    merchantId: string,
    campaignType: CampaignType,
    baseUrl: string = 'http://localhost:3000',
  ): Promise<{ qr_url: string; qr_code_image: string }> {
    try {
      // Generate the QR URL based on campaign type
      let qrUrl: string;

      switch (campaignType) {
        case CampaignType.SINGLE_USE_QR:
          qrUrl = `${baseUrl}/play/${merchantId}/single-use/${campaignId}`;
          break;
        case CampaignType.VOUCHER:
          qrUrl = `${baseUrl}/play/${merchantId}/voucher/${campaignId}`;
          break;
        default:
          qrUrl = `${baseUrl}/play/${merchantId}?campaign=${campaignId}`;
      }

      // Generate QR code image as base64
      const qrCodeImage = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      this.logger.log(`QR code generated for campaign: ${campaignId}`);

      return {
        qr_url: qrUrl,
        qr_code_image: qrCodeImage,
      };
    } catch (error) {
      this.logger.error(`Failed to generate QR code for campaign ${campaignId}:`, error);
      throw new Error('QR code generation failed');
    }
  }

  /**
   * Generate unique campaign ID
   */
  generateCampaignId(): string {
    return `qr_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
  }

  /**
   * Validate QR code URL format
   */
  validateQrUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Generate landing page URL for campaign
   */
  generateLandingPageUrl(
    merchantId: string,
    campaignId: string,
    baseUrl: string = 'http://localhost:3000',
  ): string {
    return `${baseUrl}/play/${merchantId}?campaign=${campaignId}`;
  }

  /**
   * Get QR code analytics URL
   */
  getAnalyticsUrl(
    campaignId: string,
    baseUrl: string = 'http://localhost:3001',
  ): string {
    return `${baseUrl}/api/qr-campaigns/${campaignId}/analytics`;
  }
}