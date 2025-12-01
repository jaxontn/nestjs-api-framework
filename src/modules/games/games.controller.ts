import { Controller, Post, Get, Param, Body, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { CreateGameSessionDto } from './dto/create-game-session.dto';
import { CompleteGameSessionDto } from './dto/complete-game-session.dto';
import { UpdateGameSettingsDto } from './dto/update-game-settings.dto';
import { CreateGamePrizeDto } from './dto/create-game-prize.dto';

@ApiTags('games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post('sessions/start')
  @ApiOperation({ summary: 'Start a new game session' })
  @ApiResponse({ status: 201, description: 'Game session started successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startGameSession(
    @Body() createGameSessionDto: CreateGameSessionDto,
  ) {
    try {
      const session = await this.gamesService.createGameSession(createGameSessionDto);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Game session started successfully',
        data: session,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      };
    }
  }

  @Post('sessions/:sessionId/complete')
  @ApiOperation({ summary: 'Complete a game session' })
  @ApiParam({ name: 'sessionId', description: 'Game session ID' })
  @ApiResponse({ status: 200, description: 'Game session completed successfully' })
  @ApiResponse({ status: 404, description: 'Game session not found' })
  async completeGameSession(
    @Param('sessionId') sessionId: string,
    @Body() completeGameSessionDto: CompleteGameSessionDto,
  ) {
    try {
      const session = await this.gamesService.completeGameSession(sessionId, completeGameSessionDto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Game session completed successfully',
        data: session,
      };
    } catch (error) {
      return {
        statusCode: error.status || HttpStatus.BAD_REQUEST,
        message: error.message,
      };
    }
  }

  @Get('sessions/merchant/:merchantId')
  @ApiOperation({ summary: 'Get game sessions for a merchant' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Game sessions retrieved successfully' })
  async getGameSessionsByMerchant(
    @Param('merchantId') merchantId: string,
  ) {
    try {
      const sessions = await this.gamesService.getGameSessions(merchantId);
      return {
        statusCode: HttpStatus.OK,
        message: 'Game sessions retrieved successfully',
        data: sessions,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      };
    }
  }

  @Get('sessions/customer/:customerId')
  @ApiOperation({ summary: 'Get game sessions for a customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Game sessions retrieved successfully' })
  async getGameSessionsByCustomer(
    @Param('customerId') customerId: string,
  ) {
    try {
      const sessions = await this.gamesService.getGameSessionsByCustomer(customerId);
      return {
        statusCode: HttpStatus.OK,
        message: 'Game sessions retrieved successfully',
        data: sessions,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      };
    }
  }

  @Get('settings/:merchantId')
  @ApiOperation({ summary: 'Get game settings for a merchant' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Game settings retrieved successfully' })
  async getGameSettings(
    @Param('merchantId') merchantId: string,
  ) {
    try {
      const settings = await this.gamesService.getGameSettings(merchantId);
      return {
        statusCode: HttpStatus.OK,
        message: 'Game settings retrieved successfully',
        data: settings,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      };
    }
  }

  @Post('settings/:merchantId')
  @ApiOperation({ summary: 'Update game settings for a merchant' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Game settings updated successfully' })
  async updateGameSettings(
    @Param('merchantId') merchantId: string,
    @Body() updateGameSettingsDto: UpdateGameSettingsDto,
  ) {
    try {
      const settings = await this.gamesService.updateGameSettings(merchantId, updateGameSettingsDto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Game settings updated successfully',
        data: settings,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      };
    }
  }

  @Get('prizes/:merchantId')
  @ApiOperation({ summary: 'Get available prizes for a merchant' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiQuery({ name: 'gameType', required: false, description: 'Filter by game type' })
  @ApiResponse({ status: 200, description: 'Game prizes retrieved successfully' })
  async getGamePrizes(
    @Param('merchantId') merchantId: string,
    @Query('gameType') gameType?: string,
  ) {
    try {
      const prizes = await this.gamesService.getGamePrizes(merchantId, gameType);
      return {
        statusCode: HttpStatus.OK,
        message: 'Game prizes retrieved successfully',
        data: prizes,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      };
    }
  }

  @Post('prizes/:merchantId')
  @ApiOperation({ summary: 'Create new prize for a merchant' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiResponse({ status: 201, description: 'Game prize created successfully' })
  async createGamePrize(
    @Param('merchantId') merchantId: string,
    @Body() createGamePrizeDto: CreateGamePrizeDto,
  ) {
    try {
      const prize = await this.gamesService.createGamePrize(merchantId, createGamePrizeDto);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Game prize created successfully',
        data: prize,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      };
    }
  }

  @Get('leaderboard/:merchantId')
  @ApiOperation({ summary: 'Get overall leaderboard for a merchant' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period: today, week, month, all' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiResponse({ status: 200, description: 'Leaderboard retrieved successfully' })
  async getOverallLeaderboard(
    @Param('merchantId') merchantId: string,
    @Query('period') period?: string,
    @Query('limit') limit?: number,
  ) {
    try {
      const leaderboard = await this.gamesService.getLeaderboard(merchantId, undefined, period, limit);
      return {
        statusCode: HttpStatus.OK,
        message: 'Leaderboard retrieved successfully',
        data: leaderboard,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      };
    }
  }

  @Get('leaderboard/:merchantId/:gameType')
  @ApiOperation({ summary: 'Get game-specific leaderboard for a merchant' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiParam({ name: 'gameType', description: 'Game type' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period: today, week, month, all' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiResponse({ status: 200, description: 'Leaderboard retrieved successfully' })
  async getGameSpecificLeaderboard(
    @Param('merchantId') merchantId: string,
    @Param('gameType') gameType: string,
    @Query('period') period?: string,
    @Query('limit') limit?: number,
  ) {
    try {
      const leaderboard = await this.gamesService.getLeaderboard(merchantId, gameType, period, limit);
      return {
        statusCode: HttpStatus.OK,
        message: 'Leaderboard retrieved successfully',
        data: leaderboard,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      };
    }
  }
}