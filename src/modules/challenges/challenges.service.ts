import { Injectable, NotFoundException, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThan, Not } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { UserChallenge } from './entities/user-challenge.entity';
import { Achievement, UserAchievement } from './entities/achievement.entity';
import { Customer } from '../../entities/customer.entity';
import { Merchant } from '../../entities/merchant.entity';
import { GameSession } from '../../entities/game-session.entity';
import {
  CreateChallengeDto,
  UpdateChallengeDto,
  JoinChallengeDto,
  UpdateProgressDto,
  CompleteChallengeDto,
  CreateAchievementDto,
  UpdateAchievementDto,
  UnlockAchievementDto,
  ChallengeAnalyticsDto
} from './dto/challenges.dto';

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    @InjectRepository(UserChallenge)
    private readonly userChallengeRepository: Repository<UserChallenge>,
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepository: Repository<UserAchievement>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
  ) {}

  // Challenge Management
  async createChallenge(createChallengeData: CreateChallengeDto): Promise<any> {
    try {
      const { merchant_id, title, challenge_type, target_value, start_date, end_date } = createChallengeData;

      // Validate merchant exists
      const merchant = await this.merchantRepository.findOne({
        where: { id: merchant_id },
      });

      if (!merchant) {
        throw new NotFoundException('Merchant not found');
      }

      // Validate dates
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }

      // Check for duplicate active challenges with same title for merchant
      const existingChallenge = await this.challengeRepository.findOne({
        where: {
          merchant_id,
          title,
          is_active: true,
          end_date: MoreThanOrEqual(new Date()),
        },
      });

      if (existingChallenge) {
        throw new ConflictException('An active challenge with this title already exists for this merchant');
      }

      // Create new challenge
      const challenge = this.challengeRepository.create({
        id: `challenge_${merchant_id}_${Date.now()}`,
        merchant_id,
        title,
        description: createChallengeData.description,
        challenge_type,
        target_value,
        reward_points: createChallengeData.reward_points,
        reward_type: createChallengeData.reward_type,
        badge_icon: createChallengeData.badge_icon,
        badge_color: createChallengeData.badge_color,
        difficulty_level: createChallengeData.difficulty_level || 'medium',
        max_participants: createChallengeData.max_participants,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
      });

      const savedChallenge = await this.challengeRepository.save(challenge);

      this.logger.log(`Challenge created: ${savedChallenge.id} for merchant ${merchant_id}`);

      return {
        success: true,
        message: 'Challenge created successfully',
        data: {
          challenge_id: savedChallenge.id,
          title: savedChallenge.title,
          challenge_type: savedChallenge.challenge_type,
          target_value: savedChallenge.target_value,
          reward_points: savedChallenge.reward_points,
          difficulty_level: savedChallenge.difficulty_level,
          start_date: savedChallenge.start_date,
          end_date: savedChallenge.end_date,
          max_participants: savedChallenge.max_participants,
          is_active: savedChallenge.is_active,
          created_at: savedChallenge.created_at,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Create challenge failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getChallenges(merchantId: string): Promise<any> {
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

      const challenges = await this.challengeRepository.find({
        where: {
          merchant_id: merchantId,
          is_active: true,
        },
        order: { created_at: 'DESC' },
      });

      return {
        success: true,
        message: 'Challenges retrieved successfully',
        data: challenges.map(challenge => ({
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          challenge_type: challenge.challenge_type,
          target_value: challenge.target_value,
          reward_points: challenge.reward_points,
          reward_type: challenge.reward_type,
          badge_icon: challenge.badge_icon,
          badge_color: challenge.badge_color,
          difficulty_level: challenge.difficulty_level,
          max_participants: challenge.max_participants,
          current_participants: challenge.current_participants,
          completion_count: challenge.completion_count,
          start_date: challenge.start_date,
          end_date: challenge.end_date,
          is_active: challenge.is_active,
          created_at: challenge.created_at,
          updated_at: challenge.updated_at,
        })),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get challenges failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getChallenge(challengeId: string): Promise<any> {
    try {
      if (!challengeId || !challengeId.trim()) {
        throw new BadRequestException('Challenge ID is required');
      }

      const challenge = await this.challengeRepository.findOne({
        where: { id: challengeId },
      });

      if (!challenge) {
        throw new NotFoundException('Challenge not found');
      }

      return {
        success: true,
        message: 'Challenge retrieved successfully',
        data: {
          id: challenge.id,
          merchant_id: challenge.merchant_id,
          title: challenge.title,
          description: challenge.description,
          challenge_type: challenge.challenge_type,
          target_value: challenge.target_value,
          reward_points: challenge.reward_points,
          reward_type: challenge.reward_type,
          badge_icon: challenge.badge_icon,
          badge_color: challenge.badge_color,
          difficulty_level: challenge.difficulty_level,
          max_participants: challenge.max_participants,
          current_participants: challenge.current_participants,
          completion_count: challenge.completion_count,
          start_date: challenge.start_date,
          end_date: challenge.end_date,
          is_active: challenge.is_active,
          created_at: challenge.created_at,
          updated_at: challenge.updated_at,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get challenge failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateChallenge(challengeId: string, updateData: UpdateChallengeDto): Promise<any> {
    try {
      if (!challengeId || !challengeId.trim()) {
        throw new BadRequestException('Challenge ID is required');
      }

      const challenge = await this.challengeRepository.findOne({
        where: { id: challengeId },
      });

      if (!challenge) {
        throw new NotFoundException('Challenge not found');
      }

      // Validate dates if provided
      if (updateData.start_date || updateData.end_date) {
        const startDate = updateData.start_date ? new Date(updateData.start_date) : challenge.start_date;
        const endDate = updateData.end_date ? new Date(updateData.end_date) : challenge.end_date;

        if (startDate >= endDate) {
          throw new BadRequestException('End date must be after start date');
        }
      }

      // Update challenge
      Object.assign(challenge, updateData);
      const updatedChallenge = await this.challengeRepository.save(challenge);

      this.logger.log(`Challenge updated: ${challengeId}`);

      return {
        success: true,
        message: 'Challenge updated successfully',
        data: {
          challenge_id: updatedChallenge.id,
          title: updatedChallenge.title,
          updated_at: updatedChallenge.updated_at,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Update challenge failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteChallenge(challengeId: string): Promise<any> {
    try {
      if (!challengeId || !challengeId.trim()) {
        throw new BadRequestException('Challenge ID is required');
      }

      const challenge = await this.challengeRepository.findOne({
        where: { id: challengeId },
      });

      if (!challenge) {
        throw new NotFoundException('Challenge not found');
      }

      // Soft delete by setting is_active to false
      challenge.is_active = false;
      challenge.updated_at = new Date();
      await this.challengeRepository.save(challenge);

      this.logger.log(`Challenge deleted: ${challengeId}`);

      return {
        success: true,
        message: 'Challenge deleted successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Delete challenge failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // User Challenge Progress
  async joinChallenge(joinData: JoinChallengeDto): Promise<any> {
    try {
      const { challenge_id, customer_id } = joinData;

      // Validate challenge exists and is active
      const challenge = await this.challengeRepository.findOne({
        where: {
          id: challenge_id,
          is_active: true,
          end_date: MoreThanOrEqual(new Date()),
        },
      });

      if (!challenge) {
        throw new NotFoundException('Challenge not found or not active');
      }

      // Validate customer exists
      const customer = await this.customerRepository.findOne({
        where: { id: customer_id },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      // Check if customer has already joined this challenge
      const existingUserChallenge = await this.userChallengeRepository.findOne({
        where: {
          customer_id,
          challenge_id,
        },
      });

      if (existingUserChallenge) {
        throw new ConflictException('Customer has already joined this challenge');
      }

      // Check max participants limit
      if (challenge.max_participants && challenge.current_participants >= challenge.max_participants) {
        throw new BadRequestException('Challenge has reached maximum participants');
      }

      // Create user challenge entry
      const userChallenge = this.userChallengeRepository.create({
        id: `user_challenge_${customer_id}_${challenge_id}_${Date.now()}`,
        customer_id,
        challenge_id,
        current_progress: 0,
        is_completed: false,
        started_at: new Date(),
      });

      const savedUserChallenge = await this.userChallengeRepository.save(userChallenge);

      // Update challenge participant count
      challenge.current_participants += 1;
      await this.challengeRepository.save(challenge);

      this.logger.log(`Customer ${customer_id} joined challenge ${challenge_id}`);

      return {
        success: true,
        message: 'Successfully joined challenge',
        data: {
          user_challenge_id: savedUserChallenge.id,
          challenge_title: challenge.title,
          target_value: challenge.target_value,
          current_progress: savedUserChallenge.current_progress,
          reward_points: challenge.reward_points,
          started_at: savedUserChallenge.started_at,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Join challenge failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateChallengeProgress(challengeId: string, progressData: UpdateProgressDto): Promise<any> {
    try {
      const { progress_increment, activity_type, metadata } = progressData;

      const userChallenge = await this.userChallengeRepository.findOne({
        where: {
          challenge_id: challengeId,
          is_completed: false,
        },
        relations: ['challenge'],
      });

      if (!userChallenge) {
        throw new NotFoundException('Active user challenge not found');
      }

      const oldProgress = userChallenge.current_progress;
      userChallenge.current_progress += progress_increment;

      // Check if challenge is completed
      if (userChallenge.current_progress >= userChallenge.challenge.target_value) {
        userChallenge.is_completed = true;
        userChallenge.completed_at = new Date();

        // Update challenge completion count
        userChallenge.challenge.completion_count += 1;
        await this.challengeRepository.save(userChallenge.challenge);

        // Award points to customer
        const customer = await this.customerRepository.findOne({
          where: { id: userChallenge.customer_id },
        });

        if (customer) {
          customer.total_points += userChallenge.challenge.reward_points;
          await this.customerRepository.save(customer);
        }

        this.logger.log(`Challenge ${challengeId} completed by customer ${userChallenge.customer_id}`);
      }

      await this.userChallengeRepository.save(userChallenge);

      return {
        success: true,
        message: 'Challenge progress updated',
        data: {
          user_challenge_id: userChallenge.id,
          old_progress: oldProgress,
          new_progress: userChallenge.current_progress,
          target_value: userChallenge.challenge.target_value,
          is_completed: userChallenge.is_completed,
          points_awarded: userChallenge.is_completed ? userChallenge.challenge.reward_points : 0,
          activity_type,
          metadata,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Update challenge progress failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async completeChallenge(challengeId: string, completeData: CompleteChallengeDto): Promise<any> {
    try {
      const { customer_id, auto_claim_reward, completion_data } = completeData;

      const userChallenge = await this.userChallengeRepository.findOne({
        where: {
          challenge_id: challengeId,
          customer_id,
        },
        relations: ['challenge'],
      });

      if (!userChallenge) {
        throw new NotFoundException('User challenge not found');
      }

      if (userChallenge.is_completed) {
        throw new ConflictException('Challenge already completed');
      }

      // Mark as completed
      userChallenge.is_completed = true;
      userChallenge.completed_at = new Date();

      if (auto_claim_reward) {
        userChallenge.reward_claimed = true;
        userChallenge.claimed_at = new Date();
      }

      await this.userChallengeRepository.save(userChallenge);

      // Update challenge completion count
      userChallenge.challenge.completion_count += 1;
      await this.challengeRepository.save(userChallenge.challenge);

      this.logger.log(`Challenge ${challengeId} marked as complete for customer ${customer_id}`);

      return {
        success: true,
        message: 'Challenge completed successfully',
        data: {
          user_challenge_id: userChallenge.id,
          challenge_title: userChallenge.challenge.title,
          completed_at: userChallenge.completed_at,
          reward_points: userChallenge.challenge.reward_points,
          reward_claimed: userChallenge.reward_claimed,
          claimed_at: userChallenge.claimed_at,
          completion_data,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Complete challenge failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getChallengeParticipants(challengeId: string): Promise<any> {
    try {
      if (!challengeId || !challengeId.trim()) {
        throw new BadRequestException('Challenge ID is required');
      }

      const participants = await this.userChallengeRepository.find({
        where: { challenge_id: challengeId },
        relations: ['customer'],
        order: { current_progress: 'DESC' },
      });

      return {
        success: true,
        message: 'Challenge participants retrieved successfully',
        data: {
          total_participants: participants.length,
          participants: participants.map(participant => ({
            user_challenge_id: participant.id,
            customer_id: participant.customer_id,
            customer_name: participant.customer?.name,
            current_progress: participant.current_progress,
            is_completed: participant.is_completed,
            completed_at: participant.completed_at,
            reward_claimed: participant.reward_claimed,
            started_at: participant.started_at,
          })),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get challenge participants failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Achievement System
  async createAchievement(createAchievementData: CreateAchievementDto): Promise<any> {
    try {
      const { merchant_id, title, icon } = createAchievementData;

      // Validate merchant exists
      const merchant = await this.merchantRepository.findOne({
        where: { id: merchant_id },
      });

      if (!merchant) {
        throw new NotFoundException('Merchant not found');
      }

      // Create new achievement
      const achievement = this.achievementRepository.create({
        id: `achievement_${merchant_id}_${Date.now()}`,
        merchant_id,
        title,
        description: createAchievementData.description,
        icon,
        category: createAchievementData.category,
        tier: createAchievementData.tier || 'bronze',
        points_reward: createAchievementData.points_reward || 0,
        criteria: createAchievementData.criteria || {},
        is_active: true,
      });

      const savedAchievement = await this.achievementRepository.save(achievement);

      this.logger.log(`Achievement created: ${savedAchievement.id} for merchant ${merchant_id}`);

      return {
        success: true,
        message: 'Achievement created successfully',
        data: {
          achievement_id: savedAchievement.id,
          title: savedAchievement.title,
          icon: savedAchievement.icon,
          category: savedAchievement.category,
          tier: savedAchievement.tier,
          points_reward: savedAchievement.points_reward,
          created_at: savedAchievement.created_at,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Create achievement failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAchievements(merchantId: string): Promise<any> {
    try {
      if (!merchantId || !merchantId.trim()) {
        throw new BadRequestException('Merchant ID is required');
      }

      const achievements = await this.achievementRepository.find({
        where: {
          merchant_id: merchantId,
          is_active: true,
        },
        order: { created_at: 'DESC' },
      });

      return {
        success: true,
        message: 'Achievements retrieved successfully',
        data: achievements.map(achievement => ({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          tier: achievement.tier,
          points_reward: achievement.points_reward,
          criteria: achievement.criteria,
          is_active: achievement.is_active,
          created_at: achievement.created_at,
        })),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get achievements failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getCustomerAchievements(customerId: string): Promise<any> {
    try {
      if (!customerId || !customerId.trim()) {
        throw new BadRequestException('Customer ID is required');
      }

      const userAchievements = await this.userAchievementRepository.find({
        where: { customer_id: customerId },
        relations: ['achievement'],
        order: { unlocked_at: 'DESC' },
      });

      return {
        success: true,
        message: 'Customer achievements retrieved successfully',
        data: userAchievements.map(userAchievement => ({
          user_achievement_id: userAchievement.id,
          achievement_id: userAchievement.achievement_id,
          title: userAchievement.achievement?.title,
          description: userAchievement.achievement?.description,
          icon: userAchievement.achievement?.icon,
          category: userAchievement.achievement?.category,
          tier: userAchievement.achievement?.tier,
          points_reward: userAchievement.achievement?.points_reward,
          unlocked_at: userAchievement.unlocked_at,
          progress_data: userAchievement.progress_data,
        })),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get customer achievements failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async unlockAchievement(achievementId: string, unlockData: UnlockAchievementDto): Promise<any> {
    try {
      const { customer_id, progress_data } = unlockData;

      // Validate achievement exists and is active
      const achievement = await this.achievementRepository.findOne({
        where: {
          id: achievementId,
          is_active: true,
        },
      });

      if (!achievement) {
        throw new NotFoundException('Achievement not found or not active');
      }

      // Check if customer has already unlocked this achievement
      const existingUserAchievement = await this.userAchievementRepository.findOne({
        where: {
          customer_id,
          achievement_id: achievementId,
        },
      });

      if (existingUserAchievement) {
        throw new ConflictException('Customer has already unlocked this achievement');
      }

      // Create user achievement entry
      const userAchievement = this.userAchievementRepository.create({
        id: `user_achievement_${customer_id}_${achievementId}_${Date.now()}`,
        customer_id,
        achievement_id: achievementId,
        unlocked_at: new Date(),
        progress_data: progress_data || {},
      });

      const savedUserAchievement = await this.userAchievementRepository.save(userAchievement);

      // Award points to customer
      const customer = await this.customerRepository.findOne({
        where: { id: customer_id },
      });

      if (customer && achievement.points_reward > 0) {
        customer.total_points += achievement.points_reward;
        await this.customerRepository.save(customer);
      }

      this.logger.log(`Achievement ${achievementId} unlocked by customer ${customer_id}`);

      return {
        success: true,
        message: 'Achievement unlocked successfully',
        data: {
          user_achievement_id: savedUserAchievement.id,
          achievement_title: achievement.title,
          points_awarded: achievement.points_reward,
          tier: achievement.tier,
          unlocked_at: savedUserAchievement.unlocked_at,
          progress_data,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Unlock achievement failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Automatic challenge completion detection (called from game sessions)
  async detectChallengeCompletion(gameSession: GameSession): Promise<any> {
    try {
      const customer_id = gameSession.customer_id;

      // For now, extract merchant_id from available data
      // In a real implementation, this would come from customer->merchant relationship
      const merchant_id = (gameSession as any).merchant_id || gameSession.customer_id;
      const game_type = gameSession.game_type;
      const score = gameSession.score;
      const points_earned = gameSession.points_earned || 0;

      // Find active challenges for this customer
      const activeChallenges = await this.userChallengeRepository.find({
        where: {
          customer_id,
          is_completed: false,
        },
        relations: ['challenge'],
      });

      const updatedChallenges: any[] = [];

      for (const userChallenge of activeChallenges) {
        const challenge = userChallenge.challenge;
        let progressIncrement = 0;

        switch (challenge.challenge_type) {
          case 'game_master':
            if (game_type === challenge.title || challenge.title.includes('All Games')) {
              progressIncrement = 1; // Count games played
            }
            break;

          case 'points_collector':
            progressIncrement = points_earned || 0;
            break;

          case 'daily_streak':
            // Check if this is the first game today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayGames = await this.gameSessionRepository.count({
              where: {
                customer_id,
                started_at: MoreThanOrEqual(today),
              },
            });

            if (todayGames === 1) { // First game today
              progressIncrement = 1;
            }
            break;

          case 'social':
            // Social challenges would be handled differently
            progressIncrement = 0;
            break;
        }

        if (progressIncrement > 0) {
          await this.updateChallengeProgress(challenge.id, {
            progress_increment: progressIncrement,
            activity_type: 'game_play',
            metadata: {
              game_session_id: gameSession.id,
              game_type,
              score,
              points_earned,
            },
          });

          updatedChallenges.push({
            challenge_id: challenge.id,
            title: challenge.title,
            old_progress: userChallenge.current_progress,
            new_progress: Math.min(userChallenge.current_progress + progressIncrement, challenge.target_value),
            target_value: challenge.target_value,
          });
        }
      }

      return {
        success: true,
        message: 'Challenge completion detection completed',
        data: {
          challenges_checked: activeChallenges.length,
          challenges_updated: updatedChallenges.length,
          updated_challenges: updatedChallenges,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Detect challenge completion failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Analytics Methods
  async getChallengeAnalytics(merchantId: string, analyticsQuery: ChallengeAnalyticsDto): Promise<any> {
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

      const { start_date, end_date, challenge_types, difficulty_level } = analyticsQuery;

      // Build date filters
      let dateFilter: any = {};
      if (start_date || end_date) {
        if (start_date) {
          dateFilter.start_date = MoreThanOrEqual(new Date(start_date));
        }
        if (end_date) {
          dateFilter.end_date = LessThan(new Date(end_date));
        }
      }

      // Build filters
      let whereCondition: any = {
        merchant_id: merchantId,
        is_active: true,
      };

      // Add date filters
      if (start_date && dateFilter.start_date) {
        whereCondition.start_date = dateFilter.start_date;
      }
      if (end_date && dateFilter.end_date) {
        whereCondition.end_date = dateFilter.end_date;
      }

      // Add type filter
      if (challenge_types && challenge_types.length > 0) {
        whereCondition.challenge_type = challenge_types;
      }

      // Add difficulty filter
      if (difficulty_level) {
        whereCondition.difficulty_level = difficulty_level;
      }

      // Get challenges with filters
      const challenges = await this.challengeRepository.find({
        where: whereCondition,
        relations: ['userChallenges'],
      });

      // Calculate analytics
      const totalChallenges = challenges.length;
      const totalParticipants = challenges.reduce((sum, challenge) => sum + challenge.current_participants, 0);
      const totalCompletions = challenges.reduce((sum, challenge) => sum + challenge.completion_count, 0);

      // Challenge type breakdown
      const challengeTypeBreakdown = {};
      challenges.forEach(challenge => {
        if (!challengeTypeBreakdown[challenge.challenge_type]) {
          challengeTypeBreakdown[challenge.challenge_type] = {
            count: 0,
            participants: 0,
            completions: 0,
            avg_completion_rate: 0,
          };
        }
        challengeTypeBreakdown[challenge.challenge_type].count += 1;
        challengeTypeBreakdown[challenge.challenge_type].participants += challenge.current_participants;
        challengeTypeBreakdown[challenge.challenge_type].completions += challenge.completion_count;

        const completionRate = challenge.current_participants > 0
          ? (challenge.completion_count / challenge.current_participants) * 100
          : 0;
        challengeTypeBreakdown[challenge.challenge_type].avg_completion_rate += completionRate;
      });

      // Calculate averages
      Object.keys(challengeTypeBreakdown).forEach(type => {
        const data = challengeTypeBreakdown[type];
        if (data.count > 0) {
          data.avg_completion_rate = data.avg_completion_rate / data.count;
        }
      });

      // Difficulty breakdown
      const difficultyBreakdown = {};
      challenges.forEach(challenge => {
        if (!difficultyBreakdown[challenge.difficulty_level]) {
          difficultyBreakdown[challenge.difficulty_level] = {
            count: 0,
            participants: 0,
            completions: 0,
            total_reward_points: 0,
          };
        }
        difficultyBreakdown[challenge.difficulty_level].count += 1;
        difficultyBreakdown[challenge.difficulty_level].participants += challenge.current_participants;
        difficultyBreakdown[challenge.difficulty_level].completions += challenge.completion_count;
        difficultyBreakdown[challenge.difficulty_level].total_reward_points += challenge.reward_points;
      });

      // Top performing challenges
      const topPerformingChallenges = challenges
        .sort((a, b) => b.completion_count - a.completion_count)
        .slice(0, 10)
        .map(challenge => ({
          id: challenge.id,
          title: challenge.title,
          challenge_type: challenge.challenge_type,
          difficulty_level: challenge.difficulty_level,
          participants: challenge.current_participants,
          completions: challenge.completion_count,
          completion_rate: challenge.current_participants > 0
            ? (challenge.completion_count / challenge.current_participants) * 100
            : 0,
          reward_points: challenge.reward_points,
        }));

      return {
        success: true,
        message: 'Challenge analytics retrieved successfully',
        data: {
          summary: {
            total_challenges: totalChallenges,
            total_participants: totalParticipants,
            total_completions: totalCompletions,
            overall_completion_rate: totalParticipants > 0
              ? (totalCompletions / totalParticipants) * 100
              : 0,
          },
          challenge_type_breakdown: challengeTypeBreakdown,
          difficulty_breakdown: difficultyBreakdown,
          top_performing_challenges: topPerformingChallenges,
          analytics_period: {
            start_date: start_date || 'all time',
            end_date: end_date || 'present',
            filters_applied: {
              challenge_types: challenge_types || 'all',
              difficulty_level: difficulty_level || 'all',
            },
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get challenge analytics failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getChallengeLeaderboard(merchantId: string, leaderboardQuery: any): Promise<any> {
    try {
      // Build customer stats by customer
      const customerStats: any = {};
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

      const { challenge_type, time_period, limit = 50 } = leaderboardQuery;

      // Build filters
      let challengeFilter: any = { merchant_id: merchantId, is_active: true };
      if (challenge_type) {
        challengeFilter = { ...challengeFilter, challenge_type };
      }

      // Get challenges
      const challenges = await this.challengeRepository.find({
        where: challengeFilter,
        relations: ['userChallenges'],
      });

      // Get all user challenges for this merchant
      const challengeIds = challenges.map(c => c.id);
      const userChallengeFilter: any = {
        challenge_id: challengeIds.length > 0 ? { $in: challengeIds } : undefined,
        is_completed: true,
      };

      // Apply time period filter if specified
      if (time_period && time_period !== 'all') {
        const now = new Date();
        let startDate;

        switch (time_period) {
          case 'daily':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'weekly':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = null;
        }

        if (startDate) {
          userChallengeFilter['completed_at'] = MoreThanOrEqual(startDate);
        }
      }

      const userChallenges = await this.userChallengeRepository.find({
        where: userChallengeFilter,
        relations: ['customer', 'challenge'],
        order: { completed_at: 'DESC' },
      });

      // Build leaderboard by customer
      const leaderboardStats: any = {};
      userChallenges.forEach(userChallenge => {
        const customerId = userChallenge.customer_id;
        const customerName = userChallenge.customer?.name || 'Anonymous';

        if (!leaderboardStats[customerId]) {
          leaderboardStats[customerId] = {
            customer_id: customerId,
            customer_name: customerName,
            challenges_completed: 0,
            total_points_earned: 0,
            challenge_types: new Set(),
            last_activity: null,
            merchant_id: merchantId,
          };
        }

        leaderboardStats[customerId].challenges_completed += 1;
        leaderboardStats[customerId].total_points_earned += userChallenge.challenge?.reward_points || 0;
        leaderboardStats[customerId].challenge_types.add(userChallenge.challenge?.challenge_type);

        if (!leaderboardStats[customerId].last_activity ||
            userChallenge.completed_at > leaderboardStats[customerId].last_activity) {
          leaderboardStats[customerId].last_activity = userChallenge.completed_at;
        }
      });

      // Convert to array and sort
      const leaderboard = Object.values(leaderboardStats)
        .sort((a: any, b: any) => {
          // Primary sort: total points earned
          if (b.total_points_earned !== a.total_points_earned) {
            return b.total_points_earned - a.total_points_earned;
          }
          // Secondary sort: challenges completed
          return b.challenges_completed - a.challenges_completed;
        })
        .slice(0, limit)
        .map((entry: any, index) => ({
          rank_position: index + 1,
          customer_id: entry.customer_id,
          customer_name: entry.customer_name,
          challenges_completed: entry.challenges_completed,
          total_points_earned: entry.total_points_earned,
          unique_challenge_types: Array.from(entry.challenge_types).length,
          last_activity: entry.last_activity,
          created_at: entry.created_at,
        }));

      return {
        success: true,
        message: 'Challenge leaderboard retrieved successfully',
        data: {
          total_participants: Object.keys(leaderboardStats).length,
          leaderboard,
          filters_applied: {
            challenge_type: challenge_type || 'all',
            time_period: time_period || 'all',
            limit: parseInt(limit),
          },
          analytics_period: {
            time_period_description: this.getTimePeriodDescription(time_period),
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get challenge leaderboard failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getTimePeriodDescription(timePeriod: string): string {
    switch (timePeriod) {
      case 'daily':
        return 'Today';
      case 'weekly':
        return 'Last 7 days';
      case 'monthly':
        return 'This month';
      case 'all':
      default:
        return 'All time';
    }
  }
}