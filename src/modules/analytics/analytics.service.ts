import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { DailyAnalytic } from '../../entities/daily-analytic.entity';
import { Merchant } from '../../entities/merchant.entity';
import { Customer } from '../../entities/customer.entity';
import { GameSession } from '../../entities/game-session.entity';
import { QrCampaign } from '../../entities/qr-campaign.entity';
import { Leaderboard } from '../../entities/leaderboard.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(DailyAnalytic)
    private readonly dailyAnalyticRepository: Repository<DailyAnalytic>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
    @InjectRepository(QrCampaign)
    private readonly qrCampaignRepository: Repository<QrCampaign>,
    @InjectRepository(Leaderboard)
    private readonly leaderboardRepository: Repository<Leaderboard>,
  ) {}

  // Dashboard Analytics
  async getDashboardAnalytics(merchantId: string) {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Get basic merchant stats
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    // Get recent analytics data
    const recentAnalytics = await this.dailyAnalyticRepository.find({
      where: {
        merchant_id: merchantId,
        date: Between(thirtyDaysAgo, today),
      },
      order: { date: 'DESC' },
      take: 30,
    });

    // Get active campaigns
    const activeCampaigns = await this.qrCampaignRepository.find({
      where: {
        merchant_id: merchantId,
        status: 'active',
      },
    });

    // Calculate dashboard metrics
    const totalSessions = recentAnalytics.reduce((sum, analytics) => sum + analytics.total_sessions, 0);
    const totalUsers = recentAnalytics.reduce((sum, analytics) => sum + analytics.unique_users, 0);
    const totalGamesPlayed = recentAnalytics.reduce((sum, analytics) => sum + analytics.game_sessions, 0);
    const totalPointsAwarded = recentAnalytics.reduce((sum, analytics) => sum + analytics.total_points_awarded, 0);

    // Get today's data for real-time metrics
    const todayAnalytics = await this.dailyAnalyticRepository.findOne({
      where: {
        merchant_id: merchantId,
        date: today,
      },
    });

    return {
      merchant: {
        id: merchant.id,
        name: merchant.business_name,
        logo: merchant.logo_url,
      },
      overview: {
        total_sessions: totalSessions,
        unique_users: totalUsers,
        games_played: totalGamesPlayed,
        points_awarded: totalPointsAwarded,
        active_campaigns: activeCampaigns.length,
      },
      today: {
        sessions: todayAnalytics?.total_sessions || 0,
        users: todayAnalytics?.unique_users || 0,
        games_completed: todayAnalytics?.games_completed || 0,
        points_awarded: todayAnalytics?.total_points_awarded || 0,
        engagement_rate: todayAnalytics?.engagement_rate || 0,
      },
      growth_rates: this.calculateGrowthRates(recentAnalytics),
    };
  }

  // Overview Analytics
  async getBusinessOverview(merchantId: string) {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const analytics = await this.dailyAnalyticRepository.find({
      where: {
        merchant_id: merchantId,
        date: MoreThanOrEqual(ninetyDaysAgo),
      },
      order: { date: 'ASC' },
    });

    // Customer segmentation
    const customerSegments = await this.getCustomerSegments(merchantId);

    // Top performing games
    const topGames = await this.getTopPerformingGames(merchantId);

    // Campaign performance
    const campaignPerformance = await this.getCampaignPerformance(merchantId);

    return {
      period: {
        start: ninetyDaysAgo,
        end: new Date(),
      },
      metrics: {
        total_revenue: analytics.reduce((sum, a) => sum + Number(a.revenue_generated), 0),
        total_customers: analytics.reduce((sum, a) => sum + a.unique_users, 0),
        total_sessions: analytics.reduce((sum, a) => sum + a.total_sessions, 0),
        avg_engagement_rate: analytics.reduce((sum, a) => sum + Number(a.engagement_rate), 0) / analytics.length || 0,
        avg_retention_rate: analytics.reduce((sum, a) => sum + Number(a.retention_rate), 0) / analytics.length || 0,
      },
      customer_segments: customerSegments,
      top_games: topGames,
      campaign_performance: campaignPerformance,
    };
  }

  // Daily Analytics
  async getDailyAnalytics(merchantId: string, startDate?: Date, endDate?: Date) {
    const query: any = { merchant_id: merchantId };

    if (startDate && endDate) {
      query.date = Between(startDate, endDate);
    }

    const analytics = await this.dailyAnalyticRepository.find({
      where: query,
      order: { date: 'DESC' },
    });

    return {
      data: analytics,
      summary: this.summarizeAnalytics(analytics),
    };
  }

  // Generate Daily Analytics
  async generateDailyAnalytics(merchantId: string, date: Date = new Date()) {
    const existingAnalytics = await this.dailyAnalyticRepository.findOne({
      where: {
        merchant_id: merchantId,
        date: date,
      },
    });

    if (existingAnalytics) {
      throw new BadRequestException('Analytics for this date already exist');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get sessions for the day
    const sessions = await this.gameSessionRepository.find({
      where: {
        customer: {
          merchant_id: merchantId,
        },
        started_at: Between(startOfDay, endOfDay),
      },
      relations: ['customer'],
    });

    // Get unique users
    const uniqueUsers = new Set(sessions.map(s => s.customer_id)).size;

    // Get QR scans
    const qrScans = await this.qrCampaignRepository
      .createQueryBuilder('campaign')
      .leftJoin('campaign.game_sessions', 'session')
      .where('campaign.merchant_id = :merchantId', { merchantId })
      .andWhere('session.created_at BETWEEN :start AND :end', { start: startOfDay, end: endOfDay })
      .getCount();

    // Calculate metrics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.was_completed).length;
    const totalPointsAwarded = sessions.reduce((sum, s) => sum + (s.points_earned || 0), 0);
    const avgSessionDuration = sessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / totalSessions || 0;

    const analytics = this.dailyAnalyticRepository.create({
      id: `${merchantId}_${date.toISOString().split('T')[0]}`,
      merchant_id: merchantId,
      date: date,
      total_sessions: totalSessions,
      unique_users: uniqueUsers,
      new_users: await this.getNewUsersCount(merchantId, startOfDay, endOfDay),
      returning_users: uniqueUsers - await this.getNewUsersCount(merchantId, startOfDay, endOfDay),
      qr_scans: qrScans,
      game_sessions: totalSessions,
      games_completed: completedSessions,
      total_points_awarded: totalPointsAwarded,
      avg_session_duration: Math.round(avgSessionDuration),
      engagement_rate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      conversion_rate: qrScans > 0 ? (uniqueUsers / qrScans) * 100 : 0,
    });

    return this.dailyAnalyticRepository.save(analytics);
  }

  // Customer Analytics
  async getCustomerAnalytics(merchantId: string) {
    const customers = await this.customerRepository.find({
      where: { merchant_id: merchantId },
    });

    const segments = await this.getCustomerSegments(merchantId);

    // Get customer activity
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeCustomers = customers.filter(c => c.last_play_date &&
      new Date(c.last_play_date) > thirtyDaysAgo).length;

    return {
      total_customers: customers.length,
      active_customers: activeCustomers,
      customer_segments: segments,
      acquisition_trends: await this.getAcquisitionTrends(merchantId),
      retention_metrics: await this.getRetentionMetrics(merchantId),
      loyalty_metrics: await this.getLoyaltyMetrics(merchantId),
    };
  }

  // Game Analytics
  async getGameAnalytics(merchantId: string) {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await this.gameSessionRepository.find({
      where: {
        customer: { merchant_id: merchantId },
        started_at: MoreThanOrEqual(thirtyDaysAgo),
      },
      relations: ['customer'],
    });

    const gameTypeBreakdown = sessions.reduce((acc: any, session) => {
      const gameType = session.game_type || 'unknown';
      if (!acc[gameType]) {
        acc[gameType] = {
          total_sessions: 0,
          completed_sessions: 0,
          total_points: 0,
          avg_score: 0,
        };
      }
      acc[gameType].total_sessions++;
      if (session.was_completed) {
        acc[gameType].completed_sessions++;
      }
      acc[gameType].total_points += session.points_earned || 0;
      return acc;
    }, {});

    return {
      period: {
        start: thirtyDaysAgo,
        end: new Date(),
      },
      total_sessions: sessions.length,
      game_type_breakdown: gameTypeBreakdown,
      top_performing_games: this.getTopPerformingGamesByType(gameTypeBreakdown),
      engagement_metrics: await this.getGameEngagementMetrics(merchantId),
    };
  }

  // Game-Specific Analytics
  async getGameSpecificAnalytics(merchantId: string, gameType: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await this.gameSessionRepository.find({
      where: {
        customer: { merchant_id: merchantId },
        game_type: gameType,
        started_at: MoreThanOrEqual(thirtyDaysAgo),
      },
      relations: ['customer'],
    });

    const completedSessions = sessions.filter(s => s.was_completed);
    const avgScore = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length
      : 0;

    return {
      game_type: gameType,
      period: {
        start: thirtyDaysAgo,
        end: new Date(),
      },
      metrics: {
        total_sessions: sessions.length,
        completed_sessions: completedSessions.length,
        completion_rate: sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0,
        avg_score: Math.round(avgScore),
        total_points_earned: sessions.reduce((sum, s) => sum + (s.points_earned || 0), 0),
        avg_duration: sessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / sessions.length || 0,
      },
    };
  }

  // Engagement Analytics
  async getEngagementAnalytics(merchantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyAnalytics = await this.dailyAnalyticRepository.find({
      where: {
        merchant_id: merchantId,
        date: MoreThanOrEqual(thirtyDaysAgo),
      },
      order: { date: 'ASC' },
    });

    const avgEngagementRate = dailyAnalytics.reduce((sum, a) => sum + Number(a.engagement_rate), 0) / dailyAnalytics.length || 0;
    const avgRetentionRate = dailyAnalytics.reduce((sum, a) => sum + Number(a.retention_rate), 0) / dailyAnalytics.length || 0;

    return {
      period: {
        start: thirtyDaysAgo,
        end: new Date(),
      },
      engagement_metrics: {
        avg_engagement_rate: Math.round(avgEngagementRate * 100) / 100,
        avg_retention_rate: Math.round(avgRetentionRate * 100) / 100,
        daily_engagement_trend: dailyAnalytics.map(a => ({
          date: a.date,
          engagement_rate: Number(a.engagement_rate),
          retention_rate: Number(a.retention_rate),
        })),
      },
      user_behavior: await this.getUserBehaviorAnalytics(merchantId),
    };
  }

  // Private helper methods
  private calculateGrowthRates(analytics: DailyAnalytic[]) {
    if (analytics.length < 2) return { sessions: 0, users: 0, games: 0 };

    const recentWeek = analytics.slice(0, 7);
    const previousWeek = analytics.slice(7, 14);

    const recentSessions = recentWeek.reduce((sum, a) => sum + a.total_sessions, 0);
    const previousSessions = previousWeek.reduce((sum, a) => sum + a.total_sessions, 0);
    const sessionsGrowth = previousSessions > 0 ? ((recentSessions - previousSessions) / previousSessions) * 100 : 0;

    const recentUsers = recentWeek.reduce((sum, a) => sum + a.unique_users, 0);
    const previousUsers = previousWeek.reduce((sum, a) => sum + a.unique_users, 0);
    const usersGrowth = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers) * 100 : 0;

    const recentGames = recentWeek.reduce((sum, a) => sum + a.games_completed, 0);
    const previousGames = previousWeek.reduce((sum, a) => sum + a.games_completed, 0);
    const gamesGrowth = previousGames > 0 ? ((recentGames - previousGames) / previousGames) * 100 : 0;

    return {
      sessions: Math.round(sessionsGrowth * 100) / 100,
      users: Math.round(usersGrowth * 100) / 100,
      games: Math.round(gamesGrowth * 100) / 100,
    };
  }

  private summarizeAnalytics(analytics: DailyAnalytic[]) {
    return {
      total_sessions: analytics.reduce((sum, a) => sum + a.total_sessions, 0),
      total_users: analytics.reduce((sum, a) => sum + a.unique_users, 0),
      total_games_completed: analytics.reduce((sum, a) => sum + a.games_completed, 0),
      total_points_awarded: analytics.reduce((sum, a) => sum + a.total_points_awarded, 0),
      avg_engagement_rate: analytics.reduce((sum, a) => sum + Number(a.engagement_rate), 0) / analytics.length || 0,
    };
  }

  private async getCustomerSegments(merchantId: string) {
    const customers = await this.customerRepository.find({
      where: { merchant_id: merchantId },
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const newCustomers = customers.filter(c => new Date(c.created_at) > thirtyDaysAgo).length;
    const activeCustomers = customers.filter(c => c.last_play_date && new Date(c.last_play_date) > thirtyDaysAgo).length;
    const atRiskCustomers = customers.filter(c => c.last_play_date && new Date(c.last_play_date) < ninetyDaysAgo).length;

    return {
      new: newCustomers,
      active: activeCustomers,
      at_risk: atRiskCustomers,
      dormant: customers.length - activeCustomers,
    };
  }

  private async getTopPerformingGames(merchantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await this.gameSessionRepository.find({
      where: {
        customer: { merchant_id: merchantId },
        started_at: MoreThanOrEqual(thirtyDaysAgo),
      },
      relations: ['customer'],
    });

    const gameCounts = sessions.reduce((acc: any, session) => {
      const gameType = session.game_type || 'unknown';
      acc[gameType] = (acc[gameType] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(gameCounts)
      .sort(([, a]: any, [, b]: any) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([gameType, count]) => ({ game_type: gameType, sessions: count }));
  }

  private async getCampaignPerformance(merchantId: string) {
    const campaigns = await this.qrCampaignRepository.find({
      where: { merchant_id: merchantId },
    });

    return {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      paused: campaigns.filter(c => c.status === 'paused').length,
      completed: campaigns.filter(c => c.status === 'completed').length,
    };
  }

  private async getNewUsersCount(merchantId: string, startDate: Date, endDate: Date): Promise<number> {
    return this.customerRepository.count({
      where: {
        merchant_id: merchantId,
        created_at: Between(startDate, endDate),
      },
    });
  }

  private async getAcquisitionTrends(merchantId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const customers = await this.customerRepository.find({
      where: {
        merchant_id: merchantId,
        created_at: MoreThanOrEqual(thirtyDaysAgo),
      },
    });

    const dailyAcquisitions = customers.reduce((acc: any, customer) => {
      const date = customer.created_at.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(dailyAcquisitions)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, new_customers: count }));
  }

  private async getRetentionMetrics(merchantId: string) {
    const customers = await this.customerRepository.find({
      where: { merchant_id: merchantId },
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const weeklyActive = customers.filter(c => c.last_play_date && new Date(c.last_play_date) > sevenDaysAgo).length;
    const monthlyActive = customers.filter(c => c.last_play_date && new Date(c.last_play_date) > thirtyDaysAgo).length;

    return {
      weekly_active_users: weeklyActive,
      monthly_active_users: monthlyActive,
      retention_rate: customers.length > 0 ? (monthlyActive / customers.length) * 100 : 0,
    };
  }

  private async getLoyaltyMetrics(merchantId: string) {
    // This would integrate with loyalty entities when implemented
    return {
      total_points_issued: 0,
      total_points_redeemed: 0,
      active_members: 0,
      rewards_redemption_rate: 0,
    };
  }

  private async getGameEngagementMetrics(merchantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await this.gameSessionRepository.find({
      where: {
        customer: { merchant_id: merchantId },
        started_at: MoreThanOrEqual(thirtyDaysAgo),
      },
      relations: ['customer'],
    });

    const completedSessions = sessions.filter(s => s.was_completed);
    const avgCompletionTime = completedSessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / completedSessions.length || 0;

    return {
      completion_rate: sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0,
      avg_completion_time: Math.round(avgCompletionTime),
      repeat_players: new Set(sessions.map(s => s.customer_id)).size,
    };
  }

  private getTopPerformingGamesByType(gameTypeBreakdown: any) {
    return Object.entries(gameTypeBreakdown)
      .sort(([, a]: any, [, b]: any) => b.total_sessions - a.total_sessions)
      .slice(0, 3)
      .map(([gameType, stats]: any) => ({
        game_type: gameType,
        ...stats,
        completion_rate: stats.total_sessions > 0 ? (stats.completed_sessions / stats.total_sessions) * 100 : 0,
      }));
  }

  private async getUserBehaviorAnalytics(merchantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await this.gameSessionRepository.find({
      where: {
        customer: { merchant_id: merchantId },
        started_at: MoreThanOrEqual(thirtyDaysAgo),
      },
      relations: ['customer'],
    });

    const userSessions = sessions.reduce((acc: any, session) => {
      const customerId = session.customer_id;
      if (!acc[customerId]) {
        acc[customerId] = {
          total_sessions: 0,
          total_time: 0,
          games_played: new Set(),
        };
      }
      acc[customerId].total_sessions++;
      acc[customerId].total_time += session.session_duration || 0;
      acc[customerId].games_played.add(session.game_type);
      return acc;
    }, {});

    const userBehavior = Object.values(userSessions) as any[];

    return {
      avg_sessions_per_user: userBehavior.length > 0
        ? userBehavior.reduce((sum: number, user: any) => sum + user.total_sessions, 0) / userBehavior.length
        : 0,
      avg_session_time: userBehavior.length > 0
        ? userBehavior.reduce((sum: number, user: any) => sum + (user.total_time / user.total_sessions), 0) / userBehavior.length
        : 0,
      avg_games_diversity: userBehavior.length > 0
        ? userBehavior.reduce((sum: number, user: any) => sum + user.games_played.size, 0) / userBehavior.length
        : 0,
    };
  }
}
