import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ReportsService } from './reports.service';
import {
  GenerateReportDto,
  GetReportsDto,
  GetTemplatesDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateScheduleDto,
  GetSchedulesDto,
  UpdateScheduleDto,
  ReportResponseDto,
  ReportsListResponseDto,
  TemplateResponseDto,
  TemplatesListResponseDto,
  ScheduleResponseDto,
  SchedulesListResponseDto,
  CustomerExportDto,
  GameSessionExportDto,
  CampaignExportDto,
  LeaderboardExportDto,
  GenerateCustomReportDto,
  ReportHistoryResponseDto,
  DownloadStatsDto
} from './dto/reports.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reports', description: 'Retrieve paginated list of reports' })
  async getReports(@Query() query: GetReportsDto): Promise<ReportsListResponseDto> {
    return this.reportsService.getReports(query);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get report templates', description: 'Retrieve paginated list of report templates' })
  async getTemplates(@Query() query: GetTemplatesDto): Promise<TemplatesListResponseDto> {
    return this.reportsService.getTemplates(query);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create report template', description: 'Create a new report template' })
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto): Promise<TemplateResponseDto> {
    return this.reportsService.createTemplate(createTemplateDto);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get report template', description: 'Retrieve a specific report template' })
  async getTemplate(@Param('id') id: string): Promise<TemplateResponseDto> {
    return this.reportsService.getTemplate(id);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update report template', description: 'Update an existing report template' })
  async updateTemplate(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto): Promise<TemplateResponseDto> {
    return this.reportsService.updateTemplate(id, updateTemplateDto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete report template', description: 'Delete a report template' })
  async deleteTemplate(@Param('id') id: string): Promise<TemplateResponseDto> {
    return this.reportsService.deleteTemplate(id);
  }

  @Post()
  @ApiOperation({ summary: 'Schedule report generation', description: 'Schedule a new report to be generated' })
  async createSchedule(@Body() createScheduleDto: CreateScheduleDto): Promise<ScheduleResponseDto> {
    return this.reportsService.createSchedule(createScheduleDto);
  }

  @Get('scheduled')
  @ApiOperation({ summary: 'Get scheduled reports', description: 'Retrieve paginated list of scheduled reports' })
  async getSchedules(@Query() query: GetSchedulesDto): Promise<SchedulesListResponseDto> {
    return this.reportsService.getSchedules(query);
  }

  @Get('scheduled/:id')
  @ApiOperation({ summary: 'Get scheduled report', description: 'Retrieve a specific scheduled report' })
  async getSchedule(@Param('id') id: string): Promise<ScheduleResponseDto> {
    return this.reportsService.getSchedule(id);
  }

  @Put('scheduled/:id')
  @ApiOperation({ summary: 'Update scheduled report', description: 'Update an existing scheduled report' })
  async updateSchedule(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto): Promise<ScheduleResponseDto> {
    return this.reportsService.updateSchedule(id, updateScheduleDto);
  }

  @Delete('scheduled/:id')
  @ApiOperation({ summary: 'Cancel scheduled report', description: 'Cancel a scheduled report' })
  async deleteSchedule(@Param('id') id: string): Promise<ScheduleResponseDto> {
    return this.reportsService.deleteSchedule(id);
  }

  // Data Export Endpoints
  @Post('export/customers')
  @ApiOperation({ summary: 'Export customer data', description: 'Export customer data with filters' })
  async exportCustomers(@Body() exportData: CustomerExportDto) {
    return this.reportsService.exportCustomers(exportData);
  }

  @Post('export/game-sessions')
  @ApiOperation({ summary: 'Export game session data', description: 'Export game session data with filters' })
  async exportGameSessions(@Body() exportData: GameSessionExportDto) {
    return this.reportsService.exportGameSessions(exportData);
  }

  @Post('export/campaigns')
  @ApiOperation({ summary: 'Export campaign data', description: 'Export campaign data with filters' })
  async exportCampaigns(@Body() exportData: CampaignExportDto) {
    return this.reportsService.exportCampaigns(exportData);
  }

  @Post('export/leaderboard')
  @ApiOperation({ summary: 'Export leaderboard data', description: 'Export leaderboard data with filters' })
  async exportLeaderboard(@Body() exportData: LeaderboardExportDto) {
    return this.reportsService.exportLeaderboard(exportData);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate custom report', description: 'Generate a custom report with template content' })
  async generateCustomReport(@Body() generateCustomReportDto: GenerateCustomReportDto): Promise<ReportResponseDto> {
    return this.reportsService.generateCustomReport(generateCustomReportDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report', description: 'Retrieve a specific report by ID' })
  async getReport(@Param('id') id: string): Promise<ReportResponseDto> {
    return this.reportsService.getReport(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download report', description: 'Download a generated report file' })
  async downloadReport(@Param('id') id: string) {
    return this.reportsService.downloadReport(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get report generation history', description: 'Get report generation history' })
  async getReportHistory(@Param('id') id: string): Promise<ReportHistoryResponseDto> {
    return this.reportsService.getReportHistory(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get report download statistics', description: 'Get report download statistics' })
  async getDownloadStats(@Param('id') id: string): Promise<DownloadStatsDto> {
    return this.reportsService.getDownloadStats(id);
  }
}
