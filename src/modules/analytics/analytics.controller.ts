import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseDatePipe,
  ParseIntPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../customers/jwt-auth.guard';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Dashboard Analytics
  @Get('dashboard/:merchantId')
  @ApiOperation({ summary: 'Get dashboard overview analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard analytics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  async getDashboardAnalytics(@Param('merchantId') merchantId: string) {
    const analytics = await this.analyticsService.getDashboardAnalytics(merchantId);
    return {
      success: true,
      message: 'Dashboard analytics retrieved successfully',
      data: analytics,
      timestamp: new Date().toISOString(),
    };
  }

  // Business Overview
  @Get('overview/:merchantId')
  @ApiOperation({ summary: 'Get business overview metrics' })
  @ApiResponse({ status: 200, description: 'Business overview retrieved successfully' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  async getBusinessOverview(@Param('merchantId') merchantId: string) {
    const overview = await this.analyticsService.getBusinessOverview(merchantId);
    return {
      success: true,
      message: 'Business overview retrieved successfully',
      data: overview,
      timestamp: new Date().toISOString(),
    };
  }

  // Performance Analytics
  @Get('performance/:merchantId')
  @ApiOperation({ summary: 'Get performance analytics' })
  @ApiResponse({ status: 200, description: 'Performance analytics retrieved successfully' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  async getPerformanceAnalytics(@Param('merchantId') merchantId: string) {
    const performance = await this.analyticsService.getBusinessOverview(merchantId);
    return {
      success: true,
      message: 'Performance analytics retrieved successfully',
      data: {
        period: performance.period,
        metrics: performance.metrics,
        growth_rates: {
          revenue_growth: 0, // This would be calculated from historical data
          customer_growth: 0,
          engagement_growth: 0,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Daily Analytics
  @Get('daily/:merchantId')
  @ApiOperation({ summary: 'Get daily analytics data' })
  @ApiResponse({ status: 200, description: 'Daily analytics retrieved successfully' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getDailyAnalytics(
    @Param('merchantId') merchantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const analytics = await this.analyticsService.getDailyAnalytics(merchantId, start, end);
    return {
      success: true,
      message: 'Daily analytics retrieved successfully',
      data: analytics,
      timestamp: new Date().toISOString(),
    };
  }

  // Generate Daily Analytics
  @Post('daily/:merchantId/generate')
  @ApiOperation({ summary: 'Generate daily analytics for a specific date' })
  @ApiResponse({ status: 201, description: 'Daily analytics generated successfully' })
  @ApiResponse({ status: 400, description: 'Analytics already exist for this date' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date', description: 'Date to generate analytics for (YYYY-MM-DD)' }
      }
    }
  })
  async generateDailyAnalytics(
    @Param('merchantId') merchantId: string,
    @Body() body: { date?: string }
  ) {
    const date = body.date ? new Date(body.date) : new Date();
    const analytics = await this.analyticsService.generateDailyAnalytics(merchantId, date);
    return {
      success: true,
      message: 'Daily analytics generated successfully',
      data: analytics,
      timestamp: new Date().toISOString(),
    };
  }

  // Trends Analysis
  @Get('trends/:merchantId')
  @ApiOperation({ summary: 'Get trend analysis' })
  @ApiResponse({ status: 200, description: 'Trend analysis retrieved successfully' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiQuery({ name: 'period', required: false, enum: ['7', '30', '90'], description: 'Period in days' })
  async getTrendsAnalytics(
    @Param('merchantId') merchantId: string,
    @Query('period') period: string = '30'
  ) {
    const days = parseInt(period, 10);
    const overview = await this.analyticsService.getBusinessOverview(merchantId);

    // Extract trends from the data
    const trends = {
      period: overview.period,
      customer_trends: overview.customer_segments,
      game_trends: overview.top_games,
      campaign_trends: overview.campaign_performance,
      engagement_trends: {
        avg_engagement_rate: overview.metrics.avg_engagement_rate,
        avg_retention_rate: overview.metrics.avg_retention_rate,
      },
    };

    return {
      success: true,
      message: 'Trend analysis retrieved successfully',
      data: trends,
      timestamp: new Date().toISOString(),
    };
  }

  // Customer Analytics
  @Get('customers/:merchantId')
  @ApiOperation({ summary: 'Get customer analytics' })
  @ApiResponse({ status: 200, description: 'Customer analytics retrieved successfully' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  async getCustomerAnalytics(@Param('merchantId') merchantId: string) {
    const analytics = await this.analyticsService.getCustomerAnalytics(merchantId);
    return {
      success: true,
      message: 'Customer analytics retrieved successfully',
      data: analytics,
      timestamp: new Date().toISOString(),
    };
  }

  // Demographics Analytics
  @Get('demographics/:merchantId')
  @ApiOperation({ summary: 'Get demographic breakdown analytics' })
  @ApiResponse({ status: 200, description: 'Demographic analytics retrieved successfully' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  async getDemographicsAnalytics(@Param('merchantId') merchantId: string) {
    const overview = await this.analyticsService.getBusinessOverview(merchantId);

    return {
      success: true,
      message: 'Demographic analytics retrieved successfully',
      data: {
        period: overview.period,
        customer_segments: overview.customer_segments,
        acquisition_trends: overview.customer_segments, // This would be more detailed in production
        behavior_patterns: {
          avg_sessions_per_user: 0, // This would be calculated from actual data
          avg_session_duration: 0,
          game_type_preferences: overview.top_games,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Segments Analytics
  @Get('segments/:merchantId')
  @ApiOperation({ summary: 'Get customer segment analysis' })
  @ApiResponse({ status: 200, description: 'Segment analytics retrieved successfully' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  async getSegmentsAnalytics(@Param('merchantId') merchantId: string) {
    const customerAnalytics = await this.analyticsService.getCustomerAnalytics(merchantId);

    return {
      success: true,
      message: 'Segment analytics retrieved successfully',
      data: {
        customer_segments: customerAnalytics.customer_segments,
        acquisition_trends: customerAnalytics.acquisition_trends,
        retention_metrics: customerAnalytics.retention_metrics,
        loyalty_metrics: customerAnalytics.loyalty_metrics,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Games Analytics
  @Get('games/:merchantId')
  @ApiOperation({ summary: 'Get game performance analytics' })
  @ApiResponse({ status: 200, description: 'Game analytics retrieved successfully' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  async getGamesAnalytics(@Param('merchantId') merchantId: string) {
    const analytics = await this.analyticsService.getGameAnalytics(merchantId);
    return {
      success: true,
      message: 'Game analytics retrieved successfully',
      data: analytics,
      timestamp: new Date().toISOString(),
    };
  }

  // Game-Specific Analytics
  @Get('games/:merchantId/:gameType')
  @ApiOperation({ summary: 'Get analytics for a specific game type' })
  @ApiResponse({ status: 200, description: 'Game-specific analytics retrieved successfully' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiParam({ name: 'gameType', description: 'Game type (memory-match, spin-win, etc.)' })
  async getGameSpecificAnalytics(
    @Param('merchantId') merchantId: string,
    @Param('gameType') gameType: string
  ) {
    const analytics = await this.analyticsService.getGameSpecificAnalytics(merchantId, gameType);
    return {
      success: true,
      message: 'Game-specific analytics retrieved successfully',
      data: analytics,
      timestamp: new Date().toISOString(),
    };
  }

  // Engagement Analytics
  @Get('engagement/:merchantId')
  @ApiOperation({ summary: 'Get engagement metrics analytics' })
  @ApiResponse({ status: 200, description: 'Engagement analytics retrieved successfully' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  async getEngagementAnalytics(@Param('merchantId') merchantId: string) {
    const analytics = await this.analyticsService.getEngagementAnalytics(merchantId);
    return {
      success: true,
      message: 'Engagement analytics retrieved successfully',
      data: analytics,
      timestamp: new Date().toISOString(),
    };
  }

  // Export Analytics Data
  @Post('export/:merchantId')
  @ApiOperation({ summary: 'Export analytics data' })
  @ApiResponse({ status: 200, description: 'Analytics data exported successfully' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['customers', 'game-sessions', 'campaigns', 'leaderboard'],
          description: 'Type of data to export'
        },
        format: {
          type: 'string',
          enum: ['csv', 'json', 'pdf'],
          description: 'Export format'
        },
        startDate: { type: 'string', format: 'date', description: 'Start date' },
        endDate: { type: 'string', format: 'date', description: 'End date' }
      },
      required: ['type', 'format']
    }
  })
  async exportAnalyticsData(
    @Param('merchantId') merchantId: string,
    @Body() body: {
      type: 'customers' | 'game-sessions' | 'campaigns' | 'leaderboard';
      format: 'csv' | 'json' | 'pdf';
      startDate?: string;
      endDate?: string;
    }
  ) {
    // This would integrate with a reports module when implemented
    return {
      success: true,
      message: `Analytics data export initiated successfully for ${body.type} in ${body.format} format`,
      data: {
        export_id: `export_${Date.now()}`,
        merchant_id: merchantId,
        type: body.type,
        format: body.format,
        date_range: {
          start: body.startDate || null,
          end: body.endDate || null,
        },
        status: 'processing',
        estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Generate Custom Report
  @Post('reports/generate')
  @ApiOperation({ summary: 'Generate custom analytics report' })
  @ApiResponse({ status: 201, description: 'Custom report generation initiated' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        merchant_id: { type: 'string', description: 'Merchant ID' },
        report_type: {
          type: 'string',
          enum: ['performance', 'customer', 'campaign', 'comprehensive'],
          description: 'Report type'
        },
        date_range: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date' },
            end: { type: 'string', format: 'date' }
          }
        },
        metrics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific metrics to include'
        },
        format: {
          type: 'string',
          enum: ['csv', 'json', 'pdf'],
          description: 'Report format'
        }
      },
      required: ['merchant_id', 'report_type', 'format']
    }
  })
  async generateCustomReport(@Body() body: {
    merchant_id: string;
    report_type: 'performance' | 'customer' | 'campaign' | 'comprehensive';
    date_range?: { start?: string; end?: string };
    metrics?: string[];
    format: 'csv' | 'json' | 'pdf';
  }) {
    // This would integrate with a reports module when implemented
    const reportId = `report_${body.merchant_id}_${Date.now()}`;

    return {
      success: true,
      message: 'Custom report generation initiated successfully',
      data: {
        report_id: reportId,
        merchant_id: body.merchant_id,
        report_type: body.report_type,
        date_range: body.date_range || { start: null, end: null },
        metrics: body.metrics || ['all'],
        format: body.format,
        status: 'processing',
        estimated_completion: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Get Report Templates
  @Get('reports/templates')
  @ApiOperation({ summary: 'Get available report templates' })
  @ApiResponse({ status: 200, description: 'Report templates retrieved successfully' })
  async getReportTemplates() {
    const templates = [
      {
        id: 'daily_performance',
        name: 'Daily Performance Report',
        description: 'Daily overview of business metrics and KPIs',
        metrics: ['sessions', 'users', 'games_completed', 'points_awarded'],
        formats: ['csv', 'json', 'pdf'],
      },
      {
        id: 'customer_analysis',
        name: 'Customer Analysis Report',
        description: 'Comprehensive customer behavior and segmentation analysis',
        metrics: ['customer_segments', 'retention', 'loyalty', 'demographics'],
        formats: ['csv', 'json', 'pdf'],
      },
      {
        id: 'campaign_performance',
        name: 'Campaign Performance Report',
        description: 'Detailed campaign ROI and performance metrics',
        metrics: ['campaign_metrics', 'conversion_rates', 'roi', 'engagement'],
        formats: ['csv', 'json', 'pdf'],
      },
      {
        id: 'game_analytics',
        name: 'Game Analytics Report',
        description: 'Game-specific performance and user engagement metrics',
        metrics: ['game_completion', 'scores', 'duration', 'preferences'],
        formats: ['csv', 'json', 'pdf'],
      },
    ];

    return {
      success: true,
      message: 'Report templates retrieved successfully',
      data: templates,
      timestamp: new Date().toISOString(),
    };
  }

  // Get Generated Report
  @Get('reports/:reportId')
  @ApiOperation({ summary: 'Get generated report status and download link' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiParam({ name: 'reportId', description: 'Report ID' })
  async getGeneratedReport(@Param('reportId') reportId: string) {
    // This would check the actual report status in a real implementation
    return {
      success: true,
      message: 'Report retrieved successfully',
      data: {
        report_id: reportId,
        status: 'completed',
        download_url: `/api/analytics/reports/${reportId}/download`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        file_size: '2.5MB',
        format: 'pdf',
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Download Report
  @Get('reports/:reportId/download')
  @ApiOperation({ summary: 'Download generated report' })
  @ApiResponse({ status: 200, description: 'Report downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Report not found or expired' })
  @ApiParam({ name: 'reportId', description: 'Report ID' })
  async downloadReport(@Param('reportId') reportId: string) {
    // This would stream the actual file in a real implementation
    return {
      success: true,
      message: 'Report download initiated',
      data: {
        report_id: reportId,
        download_url: `/api/analytics/reports/${reportId}/download`,
        file_name: `analytics_report_${reportId}.pdf`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Get Scheduled Reports
  @Get('reports/scheduled/:merchantId')
  @ApiOperation({ summary: 'Get scheduled reports for merchant' })
  @ApiResponse({ status: 200, description: 'Scheduled reports retrieved successfully' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  async getScheduledReports(@Param('merchantId') merchantId: string) {
    // This would fetch actual scheduled reports from the database
    return {
      success: true,
      message: 'Scheduled reports retrieved successfully',
      data: [], // No scheduled reports initially
      timestamp: new Date().toISOString(),
    };
  }

  // Schedule Report
  @Post('reports/scheduled')
  @ApiOperation({ summary: 'Schedule recurring report generation' })
  @ApiResponse({ status: 201, description: 'Report scheduled successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        merchant_id: { type: 'string', description: 'Merchant ID' },
        report_type: { type: 'string', description: 'Report type' },
        schedule: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly'],
          description: 'Schedule frequency'
        },
        recipients: {
          type: 'array',
          items: { type: 'string' },
          description: 'Email addresses to send report to'
        },
        format: { type: 'string', enum: ['csv', 'json', 'pdf'] }
      },
      required: ['merchant_id', 'report_type', 'schedule', 'format']
    }
  })
  async scheduleReport(@Body() body: {
    merchant_id: string;
    report_type: string;
    schedule: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: 'csv' | 'json' | 'pdf';
  }) {
    const scheduleId = `schedule_${body.merchant_id}_${Date.now()}`;

    return {
      success: true,
      message: 'Report scheduled successfully',
      data: {
        schedule_id: scheduleId,
        merchant_id: body.merchant_id,
        report_type: body.report_type,
        schedule: body.schedule,
        recipients: body.recipients,
        format: body.format,
        status: 'active',
        next_run: this.calculateNextRun(body.schedule),
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Cancel Scheduled Report
  @Delete('reports/scheduled/:scheduleId')
  @ApiOperation({ summary: 'Cancel scheduled report' })
  @ApiResponse({ status: 200, description: 'Scheduled report cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Scheduled report not found' })
  @ApiParam({ name: 'scheduleId', description: 'Schedule ID' })
  async cancelScheduledReport(@Param('scheduleId') scheduleId: string) {
    return {
      success: true,
      message: 'Scheduled report cancelled successfully',
      data: {
        schedule_id: scheduleId,
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Helper method to calculate next run time
  private calculateNextRun(schedule: 'daily' | 'weekly' | 'monthly'): string {
    const now = new Date();
    let nextRun = new Date(now);

    switch (schedule) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1);
        nextRun.setHours(9, 0, 0, 0); // 9 AM next day
        break;
      case 'weekly':
        nextRun.setDate(now.getDate() + 7);
        nextRun.setHours(9, 0, 0, 0); // 9 AM next week
        break;
      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1);
        nextRun.setDate(1);
        nextRun.setHours(9, 0, 0, 0); // 9 AM first day of next month
        break;
    }

    return nextRun.toISOString();
  }
}
