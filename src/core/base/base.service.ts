import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Repository, DeepPartial, FindManyOptions, FindOneOptions, DataSource } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PaginationOptions, PaginatedResult } from '../../common/interfaces/pagination.interface';

/**
 * Base Service
 *
 * Provides common CRUD operations and business logic for entities.
 * Includes pagination, filtering, sorting, and transaction support.
 *
 * This abstract service should be extended by all service classes
 * to provide consistent data access patterns and reduce code duplication.
 */
@Injectable()
export abstract class BaseService<T extends BaseEntity> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly dataSource: DataSource,
  ) {}

  /**
   * Creates a new entity
   *
   * @param createDto Data for creating the entity
   * @returns Promise resolving to the created entity
   * @throws ConflictException if entity already exists
   * @throws BadRequestException if validation fails
   */
  async create(createDto: DeepPartial<T>): Promise<T> {
    try {
      // Validate input data
      const validationErrors = await this.validateCreateData(createDto);
      if (validationErrors.length > 0) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      // Check for duplicates if applicable
      const duplicateCheck = await this.checkForDuplicates(createDto);
      if (duplicateCheck) {
        throw new ConflictException(duplicateCheck);
      }

      // Create and save entity
      const entity = this.repository.create(createDto);
      const savedEntity = await this.repository.save(entity);

      // Log creation if enabled
      await this.logOperation('CREATE', savedEntity);

      return savedEntity;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create entity', error.message);
    }
  }

  /**
   * Creates multiple entities in a single transaction
   *
   * @param createDtos Array of entity data
   * @returns Promise resolving to array of created entities
   * @throws BadRequestException if validation fails
   */
  async createMany(createDtos: DeepPartial<T>[]): Promise<T[]> {
    if (!createDtos || createDtos.length === 0) {
      throw new BadRequestException('No data provided for creation');
    }

    try {
      // Validate all entities
      const validationErrors: string[] = [];
      for (const dto of createDtos) {
        const errors = await this.validateCreateData(dto);
        validationErrors.push(...errors);
      }

      if (validationErrors.length > 0) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      // Run in transaction for atomicity
      const createdEntities = await this.dataSource.transaction(async (manager) => {
        const entities = createDtos.map((dto) => this.repository.create(dto));
        return await manager.save(entities);
      });

      // Log bulk creation
      await this.logOperation('CREATE_MANY', { count: createdEntities.length });

      return createdEntities;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create entities', error.message);
    }
  }

  /**
   * Finds entities with pagination, filtering, and sorting
   *
   * @param options Pagination and filtering options
   * @returns Promise resolving to paginated result
   */
  async findMany(options: PaginationOptions = {}): Promise<PaginatedResult<T>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        where,
        relations,
        select,
      } = options;

      // Validate pagination parameters
      const skip = Math.max(0, (page - 1) * limit);
      const take = Math.min(Math.max(1, limit), 100); // Max 100 items per page

      // Build query options
      const findOptions: FindManyOptions<T> = {
        skip,
        take,
        where: this.buildWhereClause(where),
        order: this.buildOrderClause(sortBy, sortOrder),
        relations,
        select,
      };

      // Execute queries concurrently for better performance
      const [entities, total] = await Promise.all([
        this.repository.find(findOptions),
        this.repository.count({ where: this.buildWhereClause(where) }),
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / take);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        data: entities,
        pagination: {
          page,
          limit: take,
          total,
          totalPages,
          hasNextPage,
          hasPreviousPage,
          hasNext: hasNextPage,
          hasPrev: hasPreviousPage,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch entities', error.message);
    }
  }

  /**
   * Finds a single entity by ID
   *
   * @param id Entity ID
   * @param options Additional find options
   * @returns Promise resolving to entity
   * @throws NotFoundException if entity not found
   */
  async findById(
    id: string,
    options: FindOneOptions<T> = {}
  ): Promise<T> {
    try {
      const entity = await this.repository.findOne({
        where: { id } as any,
        ...options,
      });

      if (!entity) {
        throw new NotFoundException(`Entity with ID ${id} not found`);
      }

      return entity;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch entity', error.message);
    }
  }

  /**
   * Finds a single entity by custom conditions
   *
   * @param where Conditions to find entity by
   * @param options Additional find options
   * @returns Promise resolving to entity or null if not found
   */
  async findOne(
    where: Partial<T>,
    options: FindOneOptions<T> = {}
  ): Promise<T | null> {
    try {
      return await this.repository.findOne({
        where: where as any,
        ...options,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to find entity', error.message);
    }
  }

  /**
   * Updates an entity
   *
   * @param id Entity ID
   * @param updateDto Data for updating the entity
   * @returns Promise resolving to updated entity
   * @throws NotFoundException if entity not found
   * @throws BadRequestException if validation fails
   */
  async update(
    id: string,
    updateDto: DeepPartial<T>
  ): Promise<T> {
    try {
      // Find existing entity
      const entity = await this.findById(id);

      // Validate update data
      const validationErrors = await this.validateUpdateData(entity, updateDto);
      if (validationErrors.length > 0) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      // Check for conflicts
      const conflictCheck = await this.checkForConflicts(entity, updateDto);
      if (conflictCheck) {
        throw new ConflictException(conflictCheck);
      }

      // Merge and save changes
      this.repository.merge(entity, updateDto);
      const updatedEntity = await this.repository.save(entity);

      // Log update
      await this.logOperation('UPDATE', updatedEntity);

      return updatedEntity;
    } catch (error) {
      if (error instanceof NotFoundException ||
          error instanceof BadRequestException ||
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update entity', error.message);
    }
  }

  /**
   * Updates multiple entities
   *
   * @param where Conditions to find entities to update
   * @param updateDto Data for updating entities
   * @returns Promise resolving to update result
   */
  async updateMany(
    where: Partial<T>,
    updateDto: DeepPartial<T>
  ): Promise<{ affected: number }> {
    try {
      const result = await this.repository.update(where, updateDto);

      // Log bulk update
      await this.logOperation('UPDATE_MANY', {
        where,
        updateData: updateDto,
        affected: result.affected
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update entities', error.message);
    }
  }

  /**
   * Soft deletes an entity
   *
   * @param id Entity ID
   * @returns Promise resolving to deletion result
   * @throws NotFoundException if entity not found
   */
  async softDelete(id: string): Promise<{ affected: number }> {
    try {
      // Check if entity exists
      await this.findById(id);

      const result = await this.repository.softDelete(id);

      // Log soft delete
      await this.logOperation('SOFT_DELETE', { id });

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete entity', error.message);
    }
  }

  /**
   * Restores a soft-deleted entity
   *
   * @param id Entity ID
   * @returns Promise resolving to restore result
   * @throws NotFoundException if entity not found
   */
  async restore(id: string): Promise<T> {
    try {
      // Find soft-deleted entity
      const entity = await this.repository.findOne({
        where: { id } as any,
        withDeleted: true,
      });

      if (!entity) {
        throw new NotFoundException(`Entity with ID ${id} not found`);
      }

      if (!entity.deletedAt) {
        throw new BadRequestException(`Entity with ID ${id} is not deleted`);
      }

      // Restore entity
      await this.repository.restore(id);

      // Log restore
      await this.logOperation('RESTORE', { id });

      return await this.findById(id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to restore entity', error.message);
    }
  }

  /**
   * Permanently deletes an entity
   *
   * @param id Entity ID
   * @returns Promise resolving to deletion result
   * @throws NotFoundException if entity not found
   */
  async delete(id: string): Promise<{ affected: number }> {
    try {
      // Check if entity exists
      await this.findById(id);

      const result = await this.repository.delete(id);

      // Log permanent delete
      await this.logOperation('DELETE', { id });

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete entity', error.message);
    }
  }

  /**
   * Counts entities matching conditions
   *
   * @param where Conditions to count by
   * @returns Promise resolving to count
   */
  async count(where: Partial<T> = {}): Promise<number> {
    try {
      return await this.repository.count({
        where: where as any,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to count entities', error.message);
    }
  }

  /**
   * Checks if entity exists
   *
   * @param where Conditions to check
   * @returns Promise resolving to boolean
   */
  async exists(where: Partial<T>): Promise<boolean> {
    try {
      const count = await this.repository.count({
        where: where as any,
      });
      return count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Abstract methods to be implemented by child services
   */

  /**
   * Validates data for entity creation
   *
   * @param createDto Data to validate
   * @returns Promise resolving to array of validation errors
   */
  protected abstract validateCreateData(createDto: DeepPartial<T>): Promise<string[]>;

  /**
   * Validates data for entity update
   *
   * @param entity Existing entity
   * @param updateDto Data to validate
   * @returns Promise resolving to array of validation errors
   */
  protected abstract validateUpdateData(
    entity: T,
    updateDto: DeepPartial<T>
  ): Promise<string[]>;

  /**
   * Checks for duplicate entities
   *
   * @param createDto Data to check for duplicates
   * @returns Promise resolving to conflict message or null
   */
  protected abstract checkForDuplicates(createDto: DeepPartial<T>): Promise<string | null>;

  /**
   * Checks for update conflicts
   *
   * @param entity Existing entity
   * @param updateDto Data to check for conflicts
   * @returns Promise resolving to conflict message or null
   */
  protected abstract checkForConflicts(
    entity: T,
    updateDto: DeepPartial<T>
  ): Promise<string | null>;

  /**
   * Logs service operations
   *
   * @param operation Type of operation
   * @param data Operation data
   */
  protected async logOperation(operation: string, data: any): Promise<void> {
    // Override in child classes for custom logging
    console.log(`${this.constructor.name}:${operation}`, {
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Builds WHERE clause for queries
   *
   * @param where Raw where conditions
   * @returns Processed where clause
   */
  protected buildWhereClause(where?: any): any {
    // Override in child classes for custom where clause building
    return where;
  }

  /**
   * Builds ORDER clause for queries
   *
   * @param sortBy Field to sort by
   * @param sortOrder Sort order
   * @returns Order clause object
   */
  protected buildOrderClause(sortBy: string, sortOrder: 'ASC' | 'DESC'): Record<string, 'ASC' | 'DESC'> {
    return { [sortBy]: sortOrder };
  }
}