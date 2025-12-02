import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';
import { ValidationPipe as CustomValidationPipe } from '../../common/pipes/validation.pipe';
import { BaseEntity } from './base.entity';
import { PaginationOptions, PaginatedResult } from '../../common/interfaces/pagination.interface';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../core/auth/roles.guard';

/**
 * Base Controller
 *
 * Provides standard CRUD endpoints with pagination, filtering, and validation.
 * Includes Swagger documentation, response formatting, and logging.
 *
 * All controllers should extend this base controller to maintain consistent
 * API patterns and reduce code duplication.
 *
 * @template T Entity type extending BaseEntity
 */
@ApiTags('base')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor, LoggingInterceptor)
@UsePipes(CustomValidationPipe)
export abstract class BaseController<T extends BaseEntity> {
  /**
   * Abstract method to get the service instance
   * Must be implemented by child controllers
   */
  protected abstract getService(): any;

  /**
   * Abstract method to get the DTO type for creation
   * Must be implemented by child controllers
   */
  protected abstract getCreateDtoType(): any;

  /**
   * Abstract method to get the DTO type for updates
   * Must be implemented by child controllers
   */
  protected abstract getUpdateDtoType(): any;

  /**
   * Creates a new entity
   *
   * @param createDto Data for creating the entity
   * @returns Promise resolving to created entity
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create entity',
    description: 'Creates a new entity with the provided data',
  })
  @ApiBody({
    type: () => Object, // Will be overridden by child controllers
    description: 'Entity creation data',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Entity created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or invalid data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Entity already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async create(@Body() createDto: any): Promise<any> {
    const service = this.getService();
    return await service.create(createDto);
  }

  /**
   * Creates multiple entities
   *
   * @param createDtos Array of entity data
   * @returns Promise resolving to array of created entities
   */
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create multiple entities',
    description: 'Creates multiple entities in a single transaction',
  })
  @ApiBody({
    type: [Object],
    description: 'Array of entity creation data',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Entities created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or invalid data',
  })
  async createMany(@Body() createDtos: any[]): Promise<any[]> {
    const service = this.getService();
    return await service.createMany(createDtos);
  }

  /**
   * Finds entities with pagination and filtering
   *
   * @param options Pagination and filtering options
   * @returns Promise resolving to paginated result
   */
  @Get()
  @ApiOperation({
    summary: 'Find entities',
    description: 'Retrieves entities with pagination, sorting, and filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by (default: createdAt)',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
    example: 'DESC',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entities retrieved successfully',
  })
  async findMany(@Query() options: PaginationOptions): Promise<PaginatedResult<T>> {
    const service = this.getService();
    return await service.findMany(options);
  }

  /**
   * Finds a single entity by ID
   *
   * @param id Entity ID
   * @returns Promise resolving to entity
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Find entity by ID',
    description: 'Retrieves a single entity by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Entity unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity not found',
  })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<T> {
    const service = this.getService();
    return await service.findById(id);
  }

  /**
   * Updates an entity
   *
   * @param id Entity ID
   * @param updateDto Data for updating the entity
   * @returns Promise resolving to updated entity
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update entity',
    description: 'Updates an entity with the provided data',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Entity unique identifier',
  })
  @ApiBody({
    type: () => Object,
    description: 'Entity update data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or invalid data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Update conflicts with existing data',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: any
  ): Promise<T> {
    const service = this.getService();
    return await service.update(id, updateDto);
  }

  /**
   * Partially updates an entity
   *
   * @param id Entity ID
   * @param updateDto Partial data for updating the entity
   * @returns Promise resolving to updated entity
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Partially update entity',
    description: 'Partially updates an entity with the provided data',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Entity unique identifier',
  })
  @ApiBody({
    type: () => Object,
    description: 'Partial entity update data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or invalid data',
  })
  async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: any
  ): Promise<T> {
    const service = this.getService();
    return await service.update(id, updateDto);
  }

  /**
   * Soft deletes an entity
   *
   * @param id Entity ID
   * @returns Promise resolving to deletion result
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete entity',
    description: 'Soft deletes an entity (marks as deleted without removing from database)',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Entity unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity soft deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity not found',
  })
  async softDelete(@Param('id', ParseUUIDPipe) id: string): Promise<{ affected: number }> {
    const service = this.getService();
    return await service.softDelete(id);
  }

  /**
   * Restores a soft-deleted entity
   *
   * @param id Entity ID
   * @returns Promise resolving to restored entity
   */
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore entity',
    description: 'Restores a previously soft-deleted entity',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Entity unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity restored successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity not found or not deleted',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Entity is not deleted',
  })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<T> {
    const service = this.getService();
    return await service.restore(id);
  }

  /**
   * Permanently deletes an entity
   *
   * @param id Entity ID
   * @returns Promise resolving to deletion result
   */
  @Delete(':id/permanent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Permanently delete entity',
    description: 'Permanently deletes an entity from the database',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Entity unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity not found',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<{ affected: number }> {
    const service = this.getService();
    return await service.delete(id);
  }

  /**
   * Counts entities
   *
   * @param query Query parameters for counting
   * @returns Promise resolving to count
   */
  @Get('count')
  @ApiOperation({
    summary: 'Count entities',
    description: 'Counts entities matching the specified criteria',
  })
  @ApiQuery({
    name: 'where',
    required: false,
    type: Object,
    description: 'Filter criteria',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Count retrieved successfully',
  })
  async count(@Query() query: any): Promise<{ count: number }> {
    const service = this.getService();
    const count = await service.count(query.where || {});
    return { count };
  }

  /**
   * Checks if entity exists
   *
   * @param id Entity ID
   * @returns Promise resolving to existence status
   */
  @Get(':id/exists')
  @ApiOperation({
    summary: 'Check if entity exists',
    description: 'Checks if an entity with the specified ID exists',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Entity unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Existence check completed',
  })
  async exists(@Param('id', ParseUUIDPipe) id: string): Promise<{ exists: boolean }> {
    const service = this.getService();
    const exists = await service.exists({ id } as any);
    return { exists };
  }

  /**
   * Gets entity statistics
   *
   * @returns Promise resolving to entity statistics
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get entity statistics',
    description: 'Retrieves statistics about entities (counts, trends, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(): Promise<any> {
    const service = this.getService();
    const total = await service.count();

    return {
      total,
      // Add more statistics as needed
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Searches entities
   *
   * @param query Search query and filters
   * @returns Promise resolving to search results
   */
  @Post('search')
  @ApiOperation({
    summary: 'Search entities',
    description: 'Searches entities based on various criteria',
  })
  @ApiBody({
    type: Object,
    description: 'Search criteria and filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search completed successfully',
  })
  async search(@Body() query: any): Promise<PaginatedResult<T>> {
    // Convert search query to pagination options
    const options: PaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'DESC',
      where: query.where || {},
      relations: query.relations || [],
    };

    const service = this.getService();
    return await service.findMany(options);
  }

  /**
   * Bulk update entities
   *
   * @param query Update query and data
   * @returns Promise resolving to update result
   */
  @Put('bulk')
  @ApiOperation({
    summary: 'Bulk update entities',
    description: 'Updates multiple entities matching specified criteria',
  })
  @ApiBody({
    type: Object,
    description: 'Update criteria and data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entities updated successfully',
  })
  async updateMany(@Body() query: { where: Partial<T>; data: DeepPartial<T> }): Promise<{ affected: number }> {
    const service = this.getService();
    return await service.updateMany(query.where, query.data);
  }

  /**
   * Bulk delete entities
   *
   * @param query Delete criteria
   * @returns Promise resolving to deletion result
   */
  @Delete('bulk')
  @ApiOperation({
    summary: 'Bulk delete entities',
    description: 'Deletes multiple entities matching specified criteria',
  })
  @ApiBody({
    type: Object,
    description: 'Delete criteria',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entities deleted successfully',
  })
  async deleteMany(@Body() query: { where: Partial<T> }): Promise<{ affected: number }> {
    const service = this.getService();

    // For soft delete
    const where = query.where as any;
    let affected = 0;

    // Get all entities matching criteria and soft delete them
    const entities = await this.getService().findMany({ where });

    for (const entity of entities.data) {
      await service.softDelete(entity.id);
      affected++;
    }

    return { affected };
  }
}