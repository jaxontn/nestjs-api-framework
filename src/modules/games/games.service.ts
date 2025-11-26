import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSession } from '../../entities/game-session.entity';
import { GameSetting } from '../../entities/game-setting.entity';
import { GamePrize } from '../../entities/game-prize.entity';
import { Leaderboard } from '../../entities/leaderboard.entity';

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
  async createGameSession(createGameSessionDto: Partial<GameSession>): Promise<GameSession> {
    const session = this.gameSessionRepository.create(createGameSessionDto);
    return this.gameSessionRepository.save(session);
  }

  async getGameSessions(merchantId: string): Promise<GameSession[]> {
    return this.gameSessionRepository.find({
      where: { customer: { merchant_id: merchantId } },
      relations: ['customer', 'campaign', 'prize'],
      order: { started_at: 'DESC' },
    });
  }

  async getLeaderboard(merchantId: string, gameType?: string): Promise<Leaderboard[]> {
    return this.leaderboardRepository.find({
      where: {
        merchant_id: merchantId,
        ...(gameType && { game_type: gameType })
      },
      relations: ['customer'],
      order: { rank_position: 'ASC' },
    });
  }

  // Game Settings
  async getGameSettings(merchantId: string): Promise<GameSetting[]> {
    return this.gameSettingRepository.find({
      where: { merchant_id: merchantId },
    });
  }

  // Game Prizes
  async getGamePrizes(merchantId: string, gameType?: string): Promise<GamePrize[]> {
    return this.gamePrizeRepository.find({
      where: {
        merchant_id: merchantId,
        is_active: true,
        ...(gameType && { game_type: gameType })
      },
    });
  }
}
