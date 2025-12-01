import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Patch, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
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

@ApiTags('Challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  // Challenge Management
  @Post()
  @ApiOperation({ summary: 'Create new challenge' })
  @ApiResponse({ status: 201, description: 'Challenge created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Challenge already exists' })
  async createChallenge(@Body() createChallengeData: CreateChallengeDto) {
    const result = await this.challengesService.createChallenge(createChallengeData);
    return {
      success: true,
      message: 'Challenge created successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all challenges for merchant' })
  @ApiQuery({ name: 'merchant_id', required: true, description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Challenges retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getChallenges(@Query('merchant_id') merchantId: string) {
    const result = await this.challengesService.getChallenges(merchantId);
    return {
      success: true,
      message: 'Challenges retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific challenge' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiResponse({ status: 200, description: 'Challenge retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async getChallenge(@Param('id') challengeId: string) {
    const result = await this.challengesService.getChallenge(challengeId);
    return {
      success: true,
      message: 'Challenge retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update challenge' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiResponse({ status: 200, description: 'Challenge updated successfully' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateChallenge(
    @Param('id') challengeId: string,
    @Body() updateData: UpdateChallengeDto,
  ): Promise<any> {
    const result = await this.challengesService.updateChallenge(challengeId, updateData);
    return {
      success: true,
      message: 'Challenge updated successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete challenge' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiResponse({ status: 200, description: 'Challenge deleted successfully' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async deleteChallenge(@Param('id') challengeId: string) {
    const result = await this.challengesService.deleteChallenge(challengeId);
    return {
      success: true,
      message: 'Challenge deleted successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // User Challenge Progress
  @Post(':challengeId/join')
  @ApiOperation({ summary: 'Join challenge' })
  @ApiParam({ name: 'challengeId', description: 'Challenge ID' })
  @ApiResponse({ status: 201, description: 'Successfully joined challenge' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  @ApiResponse({ status: 409, description: 'Already joined this challenge' })
  async joinChallenge(
    @Param('challengeId') challengeId: string,
    @Body() joinData: JoinChallengeDto,
  ): Promise<any> {
    joinData.challenge_id = challengeId;
    const result = await this.challengesService.joinChallenge(joinData);
    return {
      success: true,
      message: 'Successfully joined challenge',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':challengeId/progress')
  @ApiOperation({ summary: 'Update challenge progress' })
  @ApiParam({ name: 'challengeId', description: 'Challenge ID' })
  @ApiResponse({ status: 200, description: 'Challenge progress updated successfully' })
  @ApiResponse({ status: 404, description: 'User challenge not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateChallengeProgress(
    @Param('challengeId') challengeId: string,
    @Body() progressData: UpdateProgressDto,
  ): Promise<any> {
    const result = await this.challengesService.updateChallengeProgress(challengeId, progressData);
    return {
      success: true,
      message: 'Challenge progress updated successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':challengeId/complete')
  @ApiOperation({ summary: 'Mark challenge complete' })
  @ApiParam({ name: 'challengeId', description: 'Challenge ID' })
  @ApiResponse({ status: 200, description: 'Challenge completed successfully' })
  @ApiResponse({ status: 404, description: 'User challenge not found' })
  @ApiResponse({ status: 409, description: 'Challenge already completed' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async completeChallenge(
    @Param('challengeId') challengeId: string,
    @Body() completeData: CompleteChallengeDto,
  ): Promise<any> {
    const result = await this.challengesService.completeChallenge(challengeId, completeData);
    return {
      success: true,
      message: 'Challenge completed successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':challengeId/participants')
  @ApiOperation({ summary: 'Get challenge participants' })
  @ApiParam({ name: 'challengeId', description: 'Challenge ID' })
  @ApiResponse({ status: 200, description: 'Challenge participants retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async getChallengeParticipants(@Param('challengeId') challengeId: string): Promise<any> {
    const result = await this.challengesService.getChallengeParticipants(challengeId);
    return {
      success: true,
      message: 'Challenge participants retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Achievements
  @Get('achievements')
  @ApiOperation({ summary: 'Get available achievements' })
  @ApiQuery({ name: 'merchant_id', required: true, description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Achievements retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getAchievements(@Query('merchant_id') merchantId: string): Promise<any> {
    const result = await this.challengesService.getAchievements(merchantId);
    return {
      success: true,
      message: 'Achievements retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('achievements')
  @ApiOperation({ summary: 'Create new achievement' })
  @ApiResponse({ status: 201, description: 'Achievement created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async createAchievement(@Body() createAchievementData: CreateAchievementDto): Promise<any> {
    const result = await this.challengesService.createAchievement(createAchievementData);
    return {
      success: true,
      message: 'Achievement created successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':customerId/achievements')
  @ApiOperation({ summary: 'Get user achievements' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'User achievements retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerAchievements(@Param('customerId') customerId: string): Promise<any> {
    const result = await this.challengesService.getCustomerAchievements(customerId);
    return {
      success: true,
      message: 'User achievements retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('achievements/:achievementId/unlock')
  @ApiOperation({ summary: 'Unlock achievement' })
  @ApiParam({ name: 'achievementId', description: 'Achievement ID' })
  @ApiResponse({ status: 201, description: 'Achievement unlocked successfully' })
  @ApiResponse({ status: 404, description: 'Achievement not found' })
  @ApiResponse({ status: 409, description: 'Achievement already unlocked' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async unlockAchievement(
    @Param('achievementId') achievementId: string,
    @Body() unlockData: UnlockAchievementDto,
  ): Promise<any> {
    const result = await this.challengesService.unlockAchievement(achievementId, unlockData);
    return {
      success: true,
      message: 'Achievement unlocked successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Analytics
  @Get('analytics/:merchantId')
  @ApiOperation({ summary: 'Get challenge analytics' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiQuery({ name: 'start_date', required: false, description: 'Start date for analytics period' })
  @ApiQuery({ name: 'end_date', required: false, description: 'End date for analytics period' })
  @ApiQuery({ name: 'challenge_types', required: false, description: 'Filter by challenge types' })
  @ApiQuery({ name: 'difficulty_level', required: false, description: 'Filter by difficulty level' })
  @ApiResponse({ status: 200, description: 'Challenge analytics retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getChallengeAnalytics(
    @Param('merchantId') merchantId: string,
    @Query() analyticsQuery: ChallengeAnalyticsDto,
  ): Promise<any> {
    const result = await this.challengesService.getChallengeAnalytics(merchantId, analyticsQuery);
    return {
      success: true,
      message: 'Challenge analytics retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('analytics/:merchantId/leaderboard')
  @ApiOperation({ summary: 'Get challenge leaderboard' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiQuery({ name: 'challenge_type', required: false, description: 'Filter by challenge type' })
  @ApiQuery({ name: 'time_period', required: false, description: 'Time period: daily, weekly, monthly, all' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiResponse({ status: 200, description: 'Challenge leaderboard retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getChallengeLeaderboard(
    @Param('merchantId') merchantId: string,
    @Query() leaderboardQuery: any,
  ): Promise<any> {
    const result = await this.challengesService.getChallengeLeaderboard(merchantId, leaderboardQuery);
    return {
      success: true,
      message: 'Challenge leaderboard retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}