import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { GameSession } from '../../entities/game-session.entity';
import { GameSetting } from '../../entities/game-setting.entity';
import { GamePrize } from '../../entities/game-prize.entity';
import { Leaderboard } from '../../entities/leaderboard.entity';
import { CreateGameSessionDto } from './dto/create-game-session.dto';
import { CompleteGameSessionDto } from './dto/complete-game-session.dto';
import { UpdateGameSettingsDto } from './dto/update-game-settings.dto';
import { CreateGamePrizeDto } from './dto/create-game-prize.dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
    @InjectRepository(GameSetting)
    private readonly gameSettingRepository: Repository<GameSetting>,
    @InjectRepository(GamePrize)
    private readonly gamePrizeRepository: Repository<GamePrize>,
    @InjectRepository(Leaderboard)
    private readonly leaderboardRepository: Repository<Leaderboard>,
  ) {}

  // Game Sessions
  async createGameSession(createGameSessionDto: CreateGameSessionDto): Promise<GameSession> {
    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Validate customer exists
    const customer = await this.gameSessionRepository.manager
      .getRepository('customers')
      .createQueryBuilder('customer')
      .where('customer.id = :customerId', { customerId: createGameSessionDto.customer_id })
      .getOne();

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${createGameSessionDto.customer_id} not found`);
    }

    // Check daily play limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const existingSessionsToday = await this.gameSessionRepository
      .createQueryBuilder('session')
      .where('session.customer_id = :customerId AND session.started_at >= :todayStart', {
        customerId: createGameSessionDto.customer_id,
        todayStart: new Date(todayStart).toISOString()
      })
      .getMany();

    if (existingSessionsToday.length >= 5) {
      throw new BadRequestException('Daily play limit exceeded. Maximum 5 games per day allowed.');
    }

    // Get game settings for play limits
    const gameSetting = await this.gameSettingRepository.findOne({
      where: {
        merchant_id: createGameSessionDto.merchant_id,
        game_type: createGameSessionDto.game_type
      }
    });

    if (gameSetting && !gameSetting.is_active) {
      throw new BadRequestException(`Game type ${createGameSessionDto.game_type} is currently disabled`);
    }

    const session = new GameSession();
    session.id = sessionId;
    session.customer_id = createGameSessionDto.customer_id;
    session.campaign_id = createGameSessionDto.campaign_id ?? "";
    session.game_type = createGameSessionDto.game_type;
    session.score = createGameSessionDto.score || 0;
    session.device_info = createGameSessionDto.device_info || {};
    session.difficulty_level = createGameSessionDto.difficulty_level || gameSetting?.difficulty || 'medium';
    session.was_completed = false;
    session.points_earned = 0;

    return this.gameSessionRepository.save(session);
  }

  async completeGameSession(sessionId: string, completeGameSessionDto: CompleteGameSessionDto): Promise<GameSession> {
    const session = await this.gameSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['customer', 'prize']
    });

    if (!session) {
      throw new NotFoundException(`Game session with ID ${sessionId} not found`);
    }

    if (session.was_completed) {
      throw new BadRequestException('Game session is already completed');
    }

    const sessionDuration = completeGameSessionDto.session_duration ||
      Math.floor((Date.now() - session.started_at.getTime()) / 1000);

    const updatedSession = await this.gameSessionRepository.save({
      ...session,
      score: completeGameSessionDto.score || session.score,
      points_earned: completeGameSessionDto.points_earned || this.calculatePoints(session.game_type, completeGameSessionDto.score, session.difficulty_level),
      session_duration: sessionDuration,
      was_completed: completeGameSessionDto.was_completed,
      completed_at: new Date(),
      game_data: completeGameSessionDto.game_data || session.game_data,
      device_info: completeGameSessionDto.device_info || session.device_info,
      prize_won: completeGameSessionDto.prize_won || session.prize_won
    });

    // Update customer statistics
    if (session.customer) {
      await this.updateCustomerStats(session.customer, completeGameSessionDto.points_earned, sessionDuration);
    }

    // Update leaderboard if prize won
    if (completeGameSessionDto.prize_won && session.customer) {
      await this.updateLeaderboard(session.customer_id, session.customer.merchant_id, session.game_type, completeGameSessionDto.score);
    }

    return updatedSession;
  }

  async getGameSessions(merchantId: string): Promise<GameSession[]> {
    return this.gameSessionRepository.find({
      where: { customer: { merchant_id: merchantId } },
      relations: ['customer', 'campaign', 'prize'],
      order: { started_at: 'DESC' },
    });
  }

  async getGameSessionsByCustomer(customerId: string): Promise<GameSession[]> {
    return this.gameSessionRepository.find({
      where: { customer_id: customerId },
      relations: ['customer', 'campaign', 'prize'],
      order: { started_at: 'DESC' },
    });
  }

  async getLeaderboard(merchantId: string, gameType?: string, period: string = 'alltime', limit?: number): Promise<Leaderboard[]> {
    const whereClause: any = {
      merchant_id: merchantId,
      period_type: period
    };

    if (gameType) {
      whereClause.game_type = gameType;
    }

    // Handle different time periods
    const dateFilter = this.getPeriodDateFilter(period);
    if (dateFilter) {
      whereClause.period_end = MoreThanOrEqual(dateFilter);
    }

    const leaderboard = this.leaderboardRepository.find({
      where: whereClause,
      relations: ['customer'],
      order: { rank_position: 'ASC' },
      take: limit
    });

    return leaderboard;
  }

  // Game Settings
  async getGameSettings(merchantId: string): Promise<GameSetting[]> {
    return this.gameSettingRepository.find({
      where: { merchant_id: merchantId },
    });
  }

  async updateGameSettings(merchantId: string, updateGameSettingsDto: UpdateGameSettingsDto): Promise<GameSetting> {
    const existingSetting = await this.gameSettingRepository.findOne({
      where: {
        merchant_id: merchantId,
        game_type: updateGameSettingsDto.game_type
      }
    });

    if (!existingSetting) {
      // Create new setting if doesn't exist
      const newSetting = this.gameSettingRepository.create({
        merchant_id: merchantId,
        game_type: updateGameSettingsDto.game_type,
        is_active: updateGameSettingsDto.is_active ?? true,
        daily_play_limit: updateGameSettingsDto.daily_play_limit ?? 5,
        base_points: updateGameSettingsDto.base_points ?? 10,
        difficulty: updateGameSettingsDto.difficulty ?? 'medium',
        configuration: updateGameSettingsDto.configuration ?? {},
        created_at: new Date(),
        updated_at: new Date()
      });

      return this.gameSettingRepository.save(newSetting);
    }

    const updatedSetting = await this.gameSettingRepository.save({
      ...existingSetting,
      ...updateGameSettingsDto,
      updated_at: new Date()
    });

    return updatedSetting;
  }

  // Game Prizes
  async getGamePrizes(merchantId: string, gameType?: string): Promise<GamePrize[]> {
    const whereClause: any = {
      merchant_id: merchantId,
      is_active: true
    };

    if (gameType) {
      whereClause.game_type = gameType;
    }

    return this.gamePrizeRepository.find({
      where: whereClause,
      order: { min_score_required: 'ASC' }
    });
  }

  async createGamePrize(merchantId: string, createGamePrizeDto: CreateGamePrizeDto): Promise<GamePrize> {
    const prize = this.gamePrizeRepository.create({
      ...createGamePrizeDto,
      merchant_id: merchantId,
      is_active: true,
      quantity_won: 0,
      created_at: new Date(),
      updated_at: new Date()
    });

    return this.gamePrizeRepository.save(prize);
  }

  // Helper Methods
  private calculatePoints(gameType: string, score: number, difficulty?: string): number {
    const basePoints = this.getBasePointsByDifficulty(difficulty);

    switch (gameType) {
      case 'spin-win':
        return Math.min(score, 50); // Max 50 points for spin wheel
      case 'memory-match':
        return Math.floor(score / 10); // 1 point per 10 matches
      case 'lucky-dice':
        return Math.floor(score / 5); // 1 point per 5 points
      case 'quick-tap':
        return Math.min(score, 30); // Max 30 points for quick tap
      case 'word-puzzle':
        return Math.floor(score / 2); // 1 point per 2 words found
      case 'color-match':
        return Math.floor(score / 8); // 1 point per 8 color matches
      default:
        return basePoints;
    }
  }

  private getBasePointsByDifficulty(difficulty?: string): number {
    switch (difficulty) {
      case 'easy':
        return 10;
      case 'medium':
        return 25;
      case 'hard':
        return 40;
      default:
        return 25;
    }
  }

  private getPeriodDateFilter(period: string): Date | null {
    const now = new Date();

    switch (period) {
      case 'daily':
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startOfDay.setHours(0, 0, 0, 0);
        return startOfDay;
      case 'weekly':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
      case 'monthly':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        return startOfMonth;
      case 'alltime':
      return null;
      default:
        return null;
    }
  }

  private async updateCustomerStats(customer: any, pointsEarned: number, sessionDuration: number): Promise<void> {
    const totalPoints = (customer.total_points || 0) + pointsEarned;
    const totalGames = (customer.games_played || 0) + 1;
    const totalSessionTime = (customer.total_session_duration || 0) + sessionDuration;
    const averageSessionTime = Math.floor(totalSessionTime / totalGames);

    await this.gameSessionRepository.manager
      .getRepository('customers')
      .createQueryBuilder()
      .update('customers')
      .set({
        total_points: totalPoints,
        games_played: totalGames,
        total_session_duration: totalSessionTime,
        average_session_duration: averageSessionTime,
        last_play_date: new Date(),
        updated_at: new Date()
      })
      .where('id = :customerId', { customerId: customer.id })
      .execute();
  }

  private async updateLeaderboard(customerId: string, merchantId: string, gameType: string, score: number): Promise<void> {
    const periodType = 'alltime';
    const periodStart = new Date(0);
    const periodEnd = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years from now

    const existingLeaderboard = await this.leaderboardRepository.findOne({
      where: {
        customer_id: customerId,
        merchant_id: merchantId,
        game_type: gameType,
        period_type: periodType
      }
    });

    if (existingLeaderboard) {
      // Update existing leaderboard entry
      const newBestScore = Math.max(existingLeaderboard.best_score, score);
      const newGamesPlayed = (existingLeaderboard.games_played || 0) + 1;

      await this.leaderboardRepository.save({
        ...existingLeaderboard,
        best_score: newBestScore,
        games_played: newGamesPlayed,
        total_points: existingLeaderboard.total_points + score,
        updated_at: new Date()
      });
    } else {
      // Create new leaderboard entry
      const maxRank = await this.leaderboardRepository
        .createQueryBuilder('leaderboard')
        .select('MAX(rank_position)')
        .where('merchant_id = :merchantId AND game_type = :gameType AND period_type = :periodType', {
          merchantId,
          gameType,
          periodType
        })
        .getRawOne();

      const rankPosition = (maxRank ? maxRank.max : 0) + 1;

      await this.leaderboardRepository.save({
        id: `${customerId}_${gameType}_${Date.now()}`,
        merchant_id: merchantId,
        customer_id: customerId,
        game_type: gameType,
        period_type: periodType,
        period_start: periodStart,
        period_end: periodEnd,
        rank_position: rankPosition,
        best_score: score,
        games_played: 1,
        total_points: score,
        updated_at: new Date()
      });
    }
  }
}
