import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Like } from 'typeorm';
import { Customer } from '../../entities/customer.entity';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';
import { LoyaltyRule } from './entities/loyalty-rule.entity';
import { Merchant } from '../../entities/merchant.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LoyaltyAnalyticsService {
  private readonly logger = new Logger(LoyaltyAnalyticsService.name);

  constructor(
    @InjectRepository(LoyaltyTransaction)
    private readonly loyaltyTransactionRepository: Repository<LoyaltyTransaction>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  async getLoyaltyAnalytics(merchantId: string): Promise<any> {
    try {
      if (!merchantId || !merchantId.trim()) {
        throw new BadRequestException('Merchant ID is required');
      }

      // Verify merchant exists
      const merchant = await this.merchantRepository.findOne({
        where: { id: merchantId },
      });

      if (!merchant) {
        throw new NotFoundException('Merchant not found');
      }

      // Get date range for analytics (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Total customers with points balance
      const totalCustomers = await this.customerRepository.count({
        where: { merchant_id: merchantId, total_points: MoreThanOrEqual(0) }
      });

      // Total transactions
      const totalTransactions = await this.loyaltyTransactionRepository.count({
        where: { merchant_id: merchantId },
      });

      // Total points earned
      const pointsEarnedResult = await this.loyaltyTransactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.points_change)', 'total')
        .where('transaction.merchant_id = :merchantId AND transaction.transaction_type = :earned')
        .setParameter('merchantId', merchantId)
        .setParameter('earned', 'earned')
        .getRawOne();

      const totalPointsEarned = Number(pointsEarnedResult?.total) || 0;

      // Total points redeemed
      const pointsRedeemedResult = await this.loyaltyTransactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(ABS(transaction.points_change))', 'total')
        .where('transaction.merchant_id = :merchantId AND transaction.transaction_type = :redeemed')
        .setParameter('merchantId', merchantId)
        .setParameter('redeemed', 'redeemed')
        .getRawOne();

      const totalPointsRedeemed = Number(pointsRedeemedResult?.total) || 0;

      // Net points pending
      const netPointsPending = totalPointsEarned - totalPointsRedeemed;

      // Average transaction value
      const averageTransactionValue = await this.loyaltyTransactionRepository
        .createQueryBuilder('transaction')
        .select('AVG(ABS(transaction.points_change))', 'average')
        .where('transaction.merchant_id = :merchantId AND transaction.transaction_type = :earned')
        .setParameter('merchantId', merchantId)
        .setParameter('earned', 'earned')
        .getRawOne();

      // Average engagement score (from customer table)
      const averageEngagementScoreResult = await this.customerRepository
        .createQueryBuilder('customer')
        .select('AVG(customer.engagement_score)', 'average')
        .where('customer.merchant_id = :merchantId')
        .setParameter('merchantId', merchantId)
        .getRawOne();

      // Top performing segments
      const topSegmentsResult = await this.customerRepository
        .createQueryBuilder('customer')
        .select('customer.customer_segment', 'COUNT(*) as count')
        .where('customer.merchant_id = :merchantId')
        .andWhere('customer.customer_segment IS NOT NULL')
        .groupBy('customer.customer_segment')
        .orderBy('count', 'DESC')
        .limit(5)
        .setParameter('merchantId', merchantId)
        .getRawMany();

      const topPerformingSegments = topSegmentsResult.map(segment => ({
        customer_segment: segment.customer_segment,
        count: Number(segment.count),
      }));

      // Redemption rate
      const redemptionRate = totalPointsEarned > 0 ?
        ((totalPointsRedeemed / (totalPointsEarned + totalPointsRedeemed)) * 100) :
        0;

      // Get customer segmentation breakdown
      const segmentBreakdown = await this.customerRepository
        .createQueryBuilder('customer')
        .select('customer.customer_segment', 'COUNT(*) as count')
        .where('customer.merchant_id = :merchantId')
        .andWhere('customer.customer_segment IS NOT NULL')
        .groupBy('customer.customer_segment')
        .orderBy('count', 'DESC')
        .limit(10)
        .setParameter('merchantId', merchantId)
        .getRawMany();

      return {
        success: true,
        message: 'Loyalty analytics retrieved successfully',
        data: {
          total_customers: totalCustomers,
          total_transactions: totalTransactions,
          total_points_earned: totalPointsEarned,
          total_points_redeemed: totalPointsRedeemed,
          net_points_pending: netPointsPending,
          average_transaction_value: Number(averageTransactionValue?.average) || 0,
          average_engagement_score: Number(averageEngagementScoreResult?.average) || 0,
          top_performing_segments: topPerformingSegments,
          redemption_rate: redemptionRate,
          customer_segments: segmentBreakdown,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get loyalty analytics failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Top Customers Leaderboard
  async getLoyaltyLeaderboard(merchantId: string): Promise<any> {
    try {
      if (!merchantId || !merchantId.trim()) {
        throw new BadRequestException('Merchant ID is required');
      }

      // Get top customers by points
      const topCustomers = await this.customerRepository.find({
        where: {
          merchant_id: merchantId,
          total_points: MoreThanOrEqual(0),
          is_active: true,
        },
        order: { total_points: 'DESC' },
        take: 10,
      });

      if (!topCustomers || topCustomers.length === 0) {
        return {
          success: true,
          message: 'No customers found',
          data: [],
          timestamp: new Date().toISOString(),
        };
      }

      // Get leaderboard entries for top customers
      const leaderboardEntries = await Promise.all(
        topCustomers.slice(0, 10).map(async (customer, index) => {
          const customerMetrics = await this.calculateCustomerMetrics(customer);

          // Get customer's rank on leaderboard
          const leaderboardPosition = await this.getLeaderboardPosition(customer.id, merchantId);

          return {
            customer_id: customer.id,
            name: customer.name,
            total_points: customer.total_points,
            customer_segment: customer.customer_segment,
            engagement_score: Number(customer.engagement_score),
            rank_position: leaderboardPosition?.rank_position || null,
            last_activity: customer.last_play_date,
            created_at: customer.created_at,
          };
        }),
      );

      return {
        success: true,
        message: 'Loyalty leaderboard retrieved successfully',
        data: {
          total_customers: topCustomers.length,
          leaderboard: leaderboardEntries,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get loyalty leaderboard failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper method to calculate customer metrics
  private async calculateCustomerMetrics(customer: Customer): Promise<any> {
    try {
      // Get date range for analytics (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get total transactions
      const totalTransactions = await this.loyaltyTransactionRepository.count({
        where: { customer_id: customer.id },
      });

      // Get completed transactions
      const completedTransactions = await this.loyaltyTransactionRepository.count({
        where: {
          customer_id: customer.id,
          transaction_type: 'completed'
        },
      });

      // Get total points earned
      const totalPointsEarned = await this.loyaltyTransactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.points_change)', 'total')
        .where('transaction.customer_id = :customerId AND transaction.transaction_type = :earned')
        .setParameter('customerId', customer.id)
        .setParameter('earned', 'earned')
        .getRawOne();

      const pointsEarned = Number(totalPointsEarned?.total) || 0;

      // Get total points redeemed
      const totalPointsRedeemed = await this.loyaltyTransactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(ABS(transaction.points_change))', 'total')
        .where('transaction.customer_id = :customerId AND transaction.transaction_type = :redeemed')
        .setParameter('customerId', customer.id)
        .setParameter('redeemed', 'redeemed')
        .getRawOne();

      const pointsRedeemed = Number(totalPointsRedeemed?.total) || 0;

      // Net points pending
      const netPointsPending = pointsEarned - pointsRedeemed;

      // Average transaction value
      const averageTransactionValue = await this.loyaltyTransactionRepository
        .createQueryBuilder('transaction')
        .select('AVG(ABS(transaction.points_change))', 'average')
        .where('transaction.customer_id = :customerId AND transaction.transaction_type = :earned')
        .setParameter('customerId', customer.id)
        .setParameter('earned', 'earned')
        .getRawOne();

      // Average engagement score
      const averageEngagementScore = await this.loyaltyTransactionRepository
        .createQueryBuilder('transaction')
        .select('AVG(transaction.score)', 'average')
        .where('transaction.customer_id = :customerId AND transaction.transaction_type = :earned')
        .setParameter('customerId', customer.id)
        .setParameter('earned', 'earned')
        .getRawOne();

      // Redemption rate
      const redemptionRate = pointsEarned > 0 ?
          ((pointsRedeemed / (pointsEarned + pointsRedeemed)) * 100) :
          0;

      return {
        total_transactions: totalTransactions,
        total_points_earned: pointsEarned,
        total_points_redeemed: pointsRedeemed,
        net_points_pending: netPointsPending,
        average_transaction_value: Number(averageTransactionValue?.average) || 0,
        average_engagement_score: Number(averageEngagementScore?.average) || 0,
        redemption_rate: redemptionRate,
      };
    } catch (error) {
      this.logger.error(`Calculate customer metrics failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getLeaderboardPosition(customerId: string, merchantId: string): Promise<any> {
    try {
      const leaderboardEntry = await this.loyaltyTransactionRepository.findOne({
        where: {
          customer_id: customerId,
          merchant_id: merchantId,
        },
        order: { id: 'DESC' },
      });

      if (!leaderboardEntry) {
        return null;
      }

      return {
        rank_position: 1, // This would be calculated based on all customers
      };
    } catch (error) {
      this.logger.error(`Get leaderboard position failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Cleanup expired transactions (can be run as a scheduled job)
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTransactions() {
    try {
      this.logger.log('Running cleanup of expired loyalty transactions');

      // This would remove expired transactions or update statuses
      // Implementation depends on business requirements
    } catch (error) {
      this.logger.error('Failed to cleanup expired transactions', error.stack);
      throw error;
    }
  }
}