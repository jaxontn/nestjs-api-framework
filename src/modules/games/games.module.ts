import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameSession } from '../../entities/game-session.entity';
import { GameSetting } from '../../entities/game-setting.entity';
import { GamePrize } from '../../entities/game-prize.entity';
import { Leaderboard } from '../../entities/leaderboard.entity';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameSession, GameSetting, GamePrize, Leaderboard])
  ],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
