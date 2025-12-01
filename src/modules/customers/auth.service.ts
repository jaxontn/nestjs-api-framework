import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThanOrEqual } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Customer } from '../../entities/customer.entity';
import { Merchant } from '../../entities/merchant.entity';
import { GameSession } from '../../entities/game-session.entity';
import { Leaderboard } from '../../entities/leaderboard.entity';
import { LoyaltyTransaction } from '../../entities/loyalty-transaction.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
    @InjectRepository(Leaderboard)
    private readonly leaderboardRepository: Repository<Leaderboard>,
    @InjectRepository(LoyaltyTransaction)
    private readonly loyaltyTransactionRepository: Repository<LoyaltyTransaction>,
    private readonly jwtService: JwtService,
  ) {}

  // Customer Portal Lookup (Login equivalent)
  async customerLookup(phoneOrEmail: string, merchantId: string): Promise<any> {
    try {
      // Validate input
      if (!phoneOrEmail || !phoneOrEmail.trim()) {
        throw new BadRequestException('Phone number or email is required');
      }

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

      // Search for customer by phone or email
      const customer = await this.customerRepository.findOne({
        where: [
          { merchant_id: merchantId, phone: phoneOrEmail, is_active: true },
          { merchant_id: merchantId, email: phoneOrEmail, is_active: true },
        ],
        relations: ['game_sessions', 'leaderboards', 'loyalty_transactions'],
      });

      if (!customer) {
        throw new NotFoundException('Customer not found. Please register first.');
      }

      // Calculate customer metrics
      const metrics = await this.calculateCustomerMetrics(customer);

      // Generate temporary session token
      const sessionToken = await this.generateCustomerSessionToken(customer);

      // Log the lookup attempt
      this.logger.log(`Customer lookup successful: ${phoneOrEmail} for merchant ${merchantId}`);

      return {
        success: true,
        message: 'Customer profile retrieved successfully',
        data: {
          customer_id: customer.id,
          name: customer.name,
          masked_phone: this.maskPhoneNumber(customer.phone),
          email: customer.email,
          avatar_url: customer.avatar_url,
          total_points: customer.total_points,
          games_played: customer.games_played,
          preferred_game_type: customer.preferred_game_type,
          customer_segment: customer.customer_segment,
          engagement_score: Number(customer.engagement_score),
          last_play_date: customer.last_play_date,
          created_at: customer.created_at,
        },
        metrics: {
          total_sessions: metrics.totalSessions,
          total_points_earned: metrics.totalPointsEarned,
          total_prizes_won: metrics.totalPrizesWon,
          average_score: metrics.averageScore,
          best_game_type: metrics.bestGameType,
          completion_rate: metrics.completionRate,
          current_leaderboard_position: metrics.leaderboardPosition,
        },
        session_token: sessionToken,
        session_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Customer lookup failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Get customer by phone/email (for direct lookup)
  async getCustomerByPhoneOrEmail(phoneOrEmail: string, merchantId: string): Promise<any> {
    try {
      if (!phoneOrEmail || !phoneOrEmail.trim()) {
        throw new BadRequestException('Phone number or email is required');
      }

      const customer = await this.customerRepository.findOne({
        where: [
          { merchant_id: merchantId, phone: phoneOrEmail, is_active: true },
          { merchant_id: merchantId, email: phoneOrEmail, is_active: true },
        ],
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      const metrics = await this.calculateCustomerMetrics(customer);

      return {
        success: true,
        message: 'Customer retrieved successfully',
        data: {
          customer_id: customer.id,
          name: customer.name,
          masked_phone: this.maskPhoneNumber(customer.phone),
          email: customer.email,
          avatar_url: customer.avatar_url,
          total_points: customer.total_points,
          games_played: customer.games_played,
          preferred_game_type: customer.preferred_game_type,
          customer_segment: customer.customer_segment,
          engagement_score: Number(customer.engagement_score),
          last_play_date: customer.last_play_date,
          created_at: customer.created_at,
        },
        metrics: metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get customer failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Create customer session token
  async createCustomerSession(customerId: string): Promise<any> {
    try {
      const sessionId = `customer_session_${customerId}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // In a real implementation, you'd store this in Redis or database
      // For now, we'll generate a JWT with shorter expiration
      const payload = {
        customer_id: customerId,
        session_id: sessionId,
        type: 'customer_session',
      };

      const token = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '30m',
      });

      this.logger.log(`Customer session created: ${sessionId}`);

      return {
        success: true,
        message: 'Customer session created successfully',
        data: {
          session_id: sessionId,
          customer_id: customerId,
          token: token,
          expires_at: expiresAt.toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Create customer session failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // End customer session
  async endCustomerSession(sessionId: string): Promise<any> {
    try {
      this.logger.log(`Customer session ended: ${sessionId}`);

      return {
        success: true,
        message: 'Customer session ended successfully',
        data: {
          session_id: sessionId,
          ended_at: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`End customer session failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Get customer session data
  async getCustomerSession(sessionId: string): Promise<any> {
    try {
      this.logger.log(`Retrieving customer session: ${sessionId}`);

      return {
        success: true,
        message: 'Customer session retrieved successfully',
        data: {
          session_id: sessionId,
          valid: true,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get customer session failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Register new customer (for first-time players)
  async registerNewCustomer(registerData: any, merchantId: string): Promise<any> {
    try {
      // Validate required fields
      const { name, phone, email } = registerData;
      if (!name || !name.trim()) {
        throw new BadRequestException('Name is required');
      }

      if (!phone || !phone.trim()) {
        throw new BadRequestException('Phone number is required');
      }

      // Check if customer already exists
      const existingCustomer = await this.customerRepository.findOne({
        where: [
          { merchant_id: merchantId, phone, is_active: true },
          { merchant_id: merchantId, email: email, is_active: true },
        ],
      });

      if (existingCustomer) {
        throw new BadRequestException('Customer with this phone or email already exists');
      }

      // Verify merchant exists
      const merchant = await this.merchantRepository.findOne({
        where: { id: merchantId },
      });

      if (!merchant) {
        throw new NotFoundException('Merchant not found');
      }

      // Create new customer
      const customerId = `customer_${merchantId}_${Date.now()}`;
      const customer = this.customerRepository.create({
        id: customerId,
        merchant_id: merchantId,
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        instagram: registerData.instagram?.trim() || null,
        avatar_url: registerData.avatar_url || null,
        age_group: registerData.age_group || null,
        gender: registerData.gender || null,
        location: registerData.location || null,
        total_points: 0,
        games_played: 0,
        total_session_duration: 0,
        average_session_duration: 0,
        engagement_score: 0,
        customer_segment: 'new',
        is_active: true,
      });

      const savedCustomer = await this.customerRepository.save(customer);

      this.logger.log(`New customer registered: ${phone} for merchant ${merchantId}`);

      return {
        success: true,
        message: 'Customer registered successfully',
        data: {
          customer_id: savedCustomer.id,
          name: savedCustomer.name,
          masked_phone: this.maskPhoneNumber(savedCustomer.phone),
          email: savedCustomer.email,
          total_points: savedCustomer.total_points,
          customer_segment: savedCustomer.customer_segment,
          created_at: savedCustomer.created_at,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Customer registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper methods
  private async calculateCustomerMetrics(customer: Customer): Promise<any> {
    try {
      // Get recent game sessions
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentSessions = await this.gameSessionRepository.find({
        where: {
          customer_id: customer.id,
          started_at: MoreThanOrEqual(thirtyDaysAgo),
        },
        order: { started_at: 'DESC' },
        take: 100,
      });

      const totalSessions = await this.gameSessionRepository.count({
        where: { customer_id: customer.id },
      });

      const completedSessions = await this.gameSessionRepository.count({
        where: {
          customer_id: customer.id,
          was_completed: true
        },
      });

      const totalPointsEarned = await this.gameSessionRepository
        .createQueryBuilder('session')
        .select('SUM(session.points_earned)', 'total')
        .where('session.customer_id = :customerId', { customerId: customer.id })
        .getRawOne();

      const totalPrizesWon = await this.leaderboardRepository.count({
        where: {
          customer_id: customer.id,
          achievement: Like('%') // Not null
        },
      });

      const averageScore = await this.gameSessionRepository
        .createQueryBuilder('session')
        .select('AVG(session.score)', 'average')
        .where('session.customer_id = :customerId AND session.was_completed = :completed', {
          customerId: customer.id,
          completed: true
        })
        .getRawOne();

      const bestGameType = await this.gameSessionRepository
        .createQueryBuilder('session')
        .select('session.game_type', 'gameType')
        .addSelect('COUNT(*)', 'count')
        .where('session.customer_id = :customerId AND session.was_completed = :completed', {
          customerId: customer.id,
          completed: true
        })
        .groupBy('session.game_type')
        .orderBy('count', 'DESC')
        .limit(1)
        .getRawOne();

      const currentLeaderboardPosition = await this.leaderboardRepository.findOne({
        where: {
          customer_id: customer.id,
          merchant_id: customer.merchant_id
        },
        order: { best_score: 'DESC' },
      });

      return {
        total_sessions: totalSessions,
        recent_sessions: recentSessions.length,
        completed_sessions: completedSessions,
        total_points_earned: Number(totalPointsEarned?.total) || 0,
        total_prizes_won: totalPrizesWon,
        average_score: Number(averageScore?.average) || 0,
        best_game_type: bestGameType?.gameType || null,
        completion_rate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
        leaderboard_position: currentLeaderboardPosition?.rank_position || null,
      };
    } catch (error) {
      this.logger.error(`Calculate customer metrics failed: ${error.message}`, error.stack);
      return {
        total_sessions: 0,
        recent_sessions: 0,
        completed_sessions: 0,
        total_points_earned: 0,
        total_prizes_won: 0,
        average_score: 0,
        best_game_type: null,
        completion_rate: 0,
        leaderboard_position: null,
      };
    }
  }

  private maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 4) return phone;

    return phone.substring(0, 3) + 'XXX' + phone.substring(phone.length - 4);
  }

  private generateCustomerSessionToken(customer: Customer): string {
    const payload = {
      customer_id: customer.id,
      session_id: `session_${customer.id}_${Date.now()}`,
      type: 'customer_lookup',
    };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '30m',
    });
  }

  // Cleanup expired sessions (can be run as a scheduled job)
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSessions() {
    try {
      this.logger.log('Running cleanup of expired customer sessions');
      // In a real implementation, you'd remove expired sessions from Redis/database
      // This is a placeholder for the scheduled job
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions', error.stack);
    }
  }
}