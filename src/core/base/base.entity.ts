import {
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  VersionColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Base Entity
 *
 * Provides common fields and functionality for all database entities.
 * Includes id, timestamps, soft delete, and versioning capabilities.
 *
 * All entities should extend this base entity to maintain consistency
 * and provide standard CRUD operations with audit trails.
 */
export abstract class BaseEntity {
  /**
   * Primary key identifier
   * Uses UUID for better security and scalability
   */
  @ApiProperty({
    description: 'Unique identifier for the entity',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Version number for optimistic locking
   * Automatically incremented on each update
   */
  @ApiProperty({
    description: 'Entity version for optimistic locking',
    example: 1,
  })
  @VersionColumn()
  version: number;

  /**
   * Creation timestamp
   * Automatically set when entity is created
   */
  @ApiProperty({
    description: 'Timestamp when entity was created',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  @CreateDateColumn({
    type: 'timestamp with time zone',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  createdAt: Date;

  /**
   * Last update timestamp
   * Automatically updated when entity is modified
   */
  @ApiProperty({
    description: 'Timestamp when entity was last updated',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  @UpdateDateColumn({
    type: 'timestamp with time zone',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    onUpdate: 'CURRENT_TIMESTAMP(3)',
  })
  updatedAt: Date;

  /**
   * Soft delete timestamp
   * Set when entity is soft deleted
   */
  @ApiProperty({
    description: 'Timestamp when entity was soft deleted',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time',
    required: false,
  })
  @DeleteDateColumn({
    type: 'timestamp with time zone',
    precision: 3,
    nullable: true,
  })
  deletedAt?: Date;

  /**
   * Lifecycle hook before entity insertion
   * Generates UUID if not provided and sets creation timestamp
   */
  @BeforeInsert()
  beforeInsert(): void {
    if (!this.id) {
      this.id = randomUUID();
    }

    // Ensure createdAt is set
    if (!this.createdAt) {
      this.createdAt = new Date();
    }

    // Initialize updatedAt
    this.updatedAt = new Date();
  }

  /**
   * Lifecycle hook before entity update
   * Updates the timestamp and any other necessary fields
   */
  @BeforeUpdate()
  beforeUpdate(): void {
    this.updatedAt = new Date();
  }

  /**
   * Checks if entity is soft deleted
   *
   * @returns True if entity is deleted, false otherwise
   */
  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  /**
   * Gets entity age in days since creation
   *
   * @returns Number of days since creation
   */
  get ageInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Gets entity age in hours since last update
   *
   * @returns Number of hours since last update
   */
  get hoursSinceLastUpdate(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.updatedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  /**
   * Creates a clone of the entity without id and timestamps
   *
   * @returns New entity instance with cloned properties
   */
  clone(): this {
    const constructor = this.constructor as new () => this;
    const cloned = new constructor();

    // Copy all properties except id, timestamps, and version
    Object.keys(this).forEach((key) => {
      if (!['id', 'createdAt', 'updatedAt', 'deletedAt', 'version'].includes(key)) {
        cloned[key] = this[key];
      }
    });

    return cloned;
  }

  /**
   * Updates entity properties from a partial object
   *
   * @param data Partial data to update
   * @returns Updated entity instance
   */
  update(data: Partial<this>): this {
    Object.assign(this, data);
    return this;
  }

  /**
   * Converts entity to plain object with stringified dates
   *
   * @returns Plain object representation
   */
  toJSON(): Partial<this> {
    const plain = this.toPlainObject();

    // Convert dates to ISO strings
    if (plain.createdAt) {
      plain.createdAt = plain.createdAt.toISOString();
    }

    if (plain.updatedAt) {
      plain.updatedAt = plain.updatedAt.toISOString();
    }

    if (plain.deletedAt) {
      plain.deletedAt = plain.deletedAt.toISOString();
    }

    return plain;
  }

  /**
   * Converts entity to plain object
   *
   * @returns Plain object representation
   */
  toPlainObject(): Partial<this> {
    const plain: Partial<this> = {};
    Object.keys(this).forEach((key) => {
      plain[key] = this[key];
    });
    return plain;
  }

  /**
   * Validates entity data
   *
   * @returns Array of validation errors
   */
  validate(): string[] {
    const errors: string[] = [];

    // Basic validation - can be extended in child classes
    if (!this.id) {
      errors.push('ID is required');
    }

    if (!this.createdAt) {
      errors.push('Created at timestamp is required');
    }

    if (!this.updatedAt) {
      errors.push('Updated at timestamp is required');
    }

    if (this.version < 0) {
      errors.push('Version must be non-negative');
    }

    return errors;
  }

  /**
   * Checks if entity is recently created (within specified hours)
   *
   * @param hours Number of hours to consider as recent
   * @returns True if entity is recent, false otherwise
   */
  isRecent(hours: number = 24): boolean {
    const diffTime = Math.abs(new Date().getTime() - this.createdAt.getTime());
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours <= hours;
  }

  /**
   * Checks if entity has been updated recently (within specified hours)
   *
   * @param hours Number of hours to consider as recent update
   * @returns True if entity was updated recently, false otherwise
   */
  isRecentlyUpdated(hours: number = 24): boolean {
    const diffTime = Math.abs(new Date().getTime() - this.updatedAt.getTime());
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours <= hours;
  }

  /**
   * Gets entity status based on timestamps
   *
   * @returns Entity status string
   */
  get status(): 'new' | 'updated' | 'stale' | 'deleted' {
    if (this.isDeleted) {
      return 'deleted';
    }

    const hoursSinceUpdate = this.hoursSinceLastUpdate;

    if (this.ageInDays <= 1) {
      return 'new';
    } else if (hoursSinceUpdate <= 24) {
      return 'updated';
    } else {
      return 'stale';
    }
  }

  /**
   * Soft deletes the entity
   */
  softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Restores a soft-deleted entity
   */
  restore(): void {
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  /**
   * Increments version number
   */
  incrementVersion(): void {
    this.version += 1;
    this.updatedAt = new Date();
  }

  /**
   * Creates a snapshot of the entity at current state
   *
   * @returns Snapshot of entity data
   */
  createSnapshot(): any {
    return {
      id: this.id,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      data: this.toJSON(),
    };
  }

  /**
   * Compares current entity with a snapshot
   *
   * @param snapshot Snapshot to compare with
   * @returns Object with comparison results
   */
  compareWithSnapshot(snapshot: any): {
    isChanged: boolean;
    changedFields: string[];
    timeDiff: {
      createdAt: number;
      updatedAt: number;
    };
  } {
    const currentData = this.toJSON();
    const snapshotData = snapshot.data || {};

    const changedFields: string[] = [];

    Object.keys(currentData).forEach((key) => {
      if (currentData[key] !== snapshotData[key]) {
        changedFields.push(key);
      }
    });

    return {
      isChanged: changedFields.length > 0,
      changedFields,
      timeDiff: {
        createdAt: this.createdAt.getTime() - new Date(snapshot.createdAt).getTime(),
        updatedAt: this.updatedAt.getTime() - new Date(snapshot.updatedAt).getTime(),
      },
    };
  }
}