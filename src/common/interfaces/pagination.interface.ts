/**
 * Pagination Interfaces
 *
 * Defines the structure for paginated responses and pagination options.
 * These interfaces are used throughout the application to provide consistent
 * pagination functionality across all endpoints that return lists of data.
 */

/**
 * Pagination Options Interface
 * Configuration options for paginated queries
 */
export interface PaginationOptions {
  /**
   * Page number (1-based)
   * Default: 1
   */
  page?: number;

  /**
   * Number of items per page
   * Default: 10, Max: 100
   */
  limit?: number;

  /**
   * Field to sort by
   * Default: 'createdAt'
   */
  sortBy?: string;

  /**
   * Sort order (ascending or descending)
   * Default: 'DESC'
   */
  sortOrder?: 'ASC' | 'DESC';

  /**
   * WHERE clause conditions
   */
  where?: any;

  /**
   * Relations to include in the query
   */
  relations?: string[];

  /**
   * Fields to select (null for all fields)
   */
  select?: string[];

  /**
   * Search term for full-text search
   */
  search?: string;

  /**
   * Fields to search in (if search is provided)
   */
  searchFields?: string[];

  /**
   * Filters to apply
   */
  filters?: FilterOptions;

  /**
   * Include soft-deleted records
   */
  includeDeleted?: boolean;

  /**
   * Enable eager loading of relations
   */
  eager?: boolean;

  /**
   * Cache query results
   */
  cache?: boolean;

  /**
   * Cache TTL in seconds
   */
  cacheTTL?: number;
}

/**
 * Filter Options Interface
 * Advanced filtering options
 */
export interface FilterOptions {
  /**
   * Date range filters
   */
  dateRange?: {
    start?: Date;
    end?: Date;
    field?: string;
  };

  /**
   * Numeric range filters
   */
  numericRange?: {
    min?: number;
    max?: number;
    field?: string;
  };

  /**
   * Text filters
   */
  text?: {
    contains?: string;
    startsWith?: string;
    endsWith?: string;
    exact?: string;
    field?: string;
  };

  /**
   * Array filters
   */
  array?: {
    in?: any[];
    notIn?: any[];
    field?: string;
  };

  /**
   * Boolean filters
   */
  boolean?: {
    isTrue?: string[];
    isFalse?: string[];
  };

  /**
   * Null filters
   */
  null?: {
    isNull?: string[];
    isNotNull?: string[];
  };
}

/**
 * Paginated Result Interface
 * Standard format for paginated responses
 */
export interface PaginatedResult<T = any> {
  /**
   * Array of data items
   */
  data: T[];

  /**
   * Pagination metadata
   */
  pagination: PaginationMetadata;

  /**
   * Response timestamp
   */
  timestamp: string;

  /**
   * Additional metadata
   */
  metadata?: {
    search?: string;
    filters?: any;
    sorting?: {
      field: string;
      order: 'ASC' | 'DESC';
    };
    totalItems?: number;
  };
}

/**
 * Pagination Metadata Interface
 * Detailed pagination information
 */
export interface PaginationMetadata {
  /**
   * Current page number (1-based)
   */
  page: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Total number of items
   */
  total: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Whether there's a next page
   */
  hasNextPage: boolean;

  /**
   * Whether there's a previous page
   */
  hasPreviousPage: boolean;

  /**
   * Whether there's a next page (alias for hasNextPage)
   */
  hasNext: boolean;

  /**
   * Whether there's a previous page (alias for hasPreviousPage)
   */
  hasPrev: boolean;

  /**
   * Index of the first item in the current page
   */
  startIndex: number;

  /**
   * Index of the last item in the current page
   */
  endIndex: number;

  /**
   * Number of items in the current page
   */
  itemCount: number;

  /**
   * URL for the next page (if available)
   */
  nextPage?: string;

  /**
   * URL for the previous page (if available)
   */
  previousPage?: string;

  /**
   * URL for the first page
   */
  firstPage?: string;

  /**
   * URL for the last page
   */
  lastPage?: string;
}

/**
 * Cursor Pagination Options Interface
 * Options for cursor-based pagination (for large datasets)
 */
export interface CursorPaginationOptions {
  /**
   * Number of items to return
   */
  limit?: number;

  /**
   * Cursor for the starting position
   */
  cursor?: string;

  /**
   * Direction of pagination (forward or backward)
   */
  direction?: 'forward' | 'backward';

  /**
   * Field to use for cursor
   */
  cursorField?: string;

  /**
   * Field to sort by
   */
  sortBy?: string;

  /**
   * Sort order
   */
  sortOrder?: 'ASC' | 'DESC';

  /**
   * WHERE clause conditions
   */
  where?: any;

  /**
   * Relations to include
   */
  relations?: string[];
}

/**
 * Cursor Pagination Result Interface
 * Result of cursor-based pagination
 */
export interface CursorPaginationResult<T = any> {
  /**
   * Array of data items
   */
  data: T[];

  /**
   * Cursor metadata
   */
  cursor: CursorMetadata;

  /**
   * Response timestamp
   */
  timestamp: string;
}

/**
 * Cursor Metadata Interface
 * Information about cursor pagination
 */
export interface CursorMetadata {
  /**
   * Next cursor for pagination
   */
  nextCursor?: string;

  /**
   * Previous cursor for pagination
   */
  previousCursor?: string;

  /**
   * Whether there's more data in the forward direction
   */
  hasNext: boolean;

  /**
   * Whether there's more data in the backward direction
   */
  hasPrevious: boolean;

  /**
   * Number of items returned
   */
  count: number;

  /**
   * Limit used for this query
   */
  limit: number;
}

/**
 * Search Options Interface
 * Options for search functionality
 */
export interface SearchOptions {
  /**
   * Search query term
   */
  query: string;

  /**
   * Fields to search in (default: all text fields)
   */
  fields?: string[];

  /**
   * Search type
   */
  type?: 'contains' | 'exact' | 'startsWith' | 'endsWith' | 'fuzzy';

  /**
   * Minimum score for fuzzy search
   */
  minScore?: number;

  /**
   * Whether to include highlights
   */
  highlights?: boolean;

  /**
   * Maximum number of highlights per result
   */
  highlightLimit?: number;

  /**
   * Sort by relevance score
   */
  sortByRelevance?: boolean;
}

/**
 * Sort Options Interface
 * Options for sorting results
 */
export interface SortOptions {
  /**
   * Field to sort by
   */
  field: string;

  /**
   * Sort direction
   */
  direction: 'ASC' | 'DESC';

  /**
   * Null values position
   */
  nulls?: 'FIRST' | 'LAST';

  /**
   * Custom sort function (for complex sorting)
   */
  custom?: (a: any, b: any) => number;
}

/**
 * Export Options Interface
 * Options for exporting data
 */
export interface ExportOptions {
  /**
   * Export format
   */
  format: 'csv' | 'xlsx' | 'json' | 'xml';

  /**
   * Fields to include
   */
  fields?: string[];

  /**
   * Field mappings for headers
   */
  fieldMappings?: Record<string, string>;

  /**
   * Include headers
   */
  includeHeaders?: boolean;

  /**
   * Pagination options (for large datasets)
   */
  pagination?: PaginationOptions;

  /**
   * Filters to apply
   */
  filters?: FilterOptions;

  /**
   * Sort options
   */
  sort?: SortOptions[];

  /**
   * Export encoding
   */
  encoding?: string;

  /**
   * File name for download
   */
  fileName?: string;

  /**
   * Export date range
   */
  dateRange?: {
    start: Date;
    end: Date;
    field?: string;
  };
}

/**
 * Bulk Operations Options Interface
 * Options for bulk operations
 */
export interface BulkOperationsOptions {
  /**
   * Array of IDs to operate on
   */
  ids?: string[];

  /**
   * Conditions for bulk selection
   */
  where?: any;

  /**
   * Pagination options for processing
   */
  batchSize?: number;

  /**
   * Whether to process in transactions
   */
  transactional?: boolean;

  /**
   * Whether to continue on errors
   */
  continueOnError?: boolean;

  /**
   * Maximum number of retries
   */
  maxRetries?: number;

  /**
   * Delay between batches (milliseconds)
   */
  batchDelay?: number;
}

/**
 * Bulk Operation Result Interface
 * Result of bulk operations
 */
export interface BulkOperationResult {
  /**
   * Total items processed
   */
  total: number;

  /**
   * Number of successful operations
   */
  successful: number;

  /**
   * Number of failed operations
   */
  failed: number;

  /**
   * Array of errors (if any)
   */
  errors?: BulkOperationError[];

  /**
   * Processing time in milliseconds
   */
  processingTime: number;

  /**
   * Operation timestamp
   */
  timestamp: string;
}

/**
 * Bulk Operation Error Interface
 * Error information for bulk operations
 */
export interface BulkOperationError {
  /**
   * ID of the item that failed
   */
  id?: string;

  /**
   * Error message
   */
  error: string;

  /**
   * Error code
   */
  code?: string;

  /**
   * Index of the item in the batch
   */
  index?: number;

  /**
   * Error timestamp
   */
  timestamp: string;
}