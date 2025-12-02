# API Development Guide - Gamified CRM Platform

Grok Chat History (https://grok.com/share/bGVnYWN5_4fd2eaad-ea98-4abd-88a9-b42e12a1bc25)

## Table of Contents
1. [Project Overview](#project-overview)
2. [API Architecture](#api-architecture)
3. [Folder Structure](#folder-structure)
4. [Development Workflow](#development-workflow)
5. [Creating New Modules](#creating-new-modules)
6. [Creating New Endpoints](#creating-new-endpoints)
7. [Database Operations](#database-operations)
8. [Authentication & Security](#authentication--security)
9. [Testing Guidelines](#testing-guidelines)
10. [Deployment](#deployment)
11. [Best Practices](#best-practices)
12. [Common Patterns](#common-patterns)

---

## Project Overview

This is a **NestJS-based REST API** for a gamified CRM platform with the following key components:

### **Tech Stack**
- **Framework**: NestJS with TypeScript
- **Database**: MySQL with TypeORM
- **Authentication**: JWT tokens
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Architecture**: Modular, feature-based organization

### **Core Modules**
1. **Merchants** - Business account management
2. **Customers** - Customer data and analytics
3. **Games** - Game sessions and leaderboards
4. **QR Campaigns** - Marketing campaigns with one-time QR links
5. **Loyalty** - Points system and rewards
6. **Challenges** - Gamification features
7. **Analytics** - Business intelligence and reporting
8. **Merchant Users** - Multi-user merchant accounts
9. **Reports** - Data export and scheduled reports
10. **Authentication** - JWT-based auth system

---

## API Architecture

### **Module Pattern**
Each module follows this structure:
```
src/modules/[module-name]/
├── [module-name].module.ts      # NestJS module definition
├── [module-name].controller.ts  # API endpoints
├── [module-name].service.ts     # Business logic
├── dto/                        # Data Transfer Objects
│   ├── [module-name].dto.ts     # Main DTOs
│   ├── create-[module-name].dto.ts
│   └── update-[module-name].dto.ts
└── entities/ (optional)         # Module-specific entities
    └── [entity-name].entity.ts
```

### **Response Format**
All endpoints follow this consistent response format:
```typescript
// Success Response
{
  success: true,
  message: "Operation completed successfully",
  data: <response_data>,
  timestamp: "2024-12-02T10:30:00.000Z"
}

// Error Response
{
  success: false,
  message: "Error description",
  data: null,
  timestamp: "2024-12-02T10:30:00.000Z"
}
```

### **API Versioning**
- Base URL: `http://localhost:3001`
- No version prefix currently (v1 implied)
- Future versions: `/api/v2/[endpoint]`

---

## Folder Structure

```
api/
├── src/                          # Main source code
│   ├── modules/                   # Feature modules
│   │   ├── analytics/             # Analytics module
│   │   ├── auth/                  # Authentication module
│   │   ├── challenges/            # Challenges module
│   │   ├── customers/             # Customer management
│   │   ├── games/                # Game sessions
│   │   ├── loyalty/               # Loyalty program
│   │   ├── merchant-users/         # Merchant user management
│   │   ├── merchants/             # Merchant accounts
│   │   ├── qr-campaigns/         # QR campaigns
│   │   └── reports/              # Reporting module
│   ├── entities/                  # Shared database entities
│   │   ├── customer.entity.ts
│   │   ├── game-session.entity.ts
│   │   ├── leaderboard.entity.ts
│   │   └── ... (all other entities)
│   ├── config/                    # Configuration files
│   │   └── database.config.ts
│   ├── app.module.ts              # Main application module
│   ├── app.controller.ts          # Root controller
│   └── app.service.ts            # Root service
├── test/                         # Test files
├── package.json                  # Dependencies
├── tsconfig.json               # TypeScript config
├── nest-cli.json                # NestJS CLI config
└── .env                        # Environment variables
```

---

## Development Workflow

### **1. Setup Development Environment**

```bash
# Navigate to API directory
cd "/Users/jasontan/Desktop/AIOT POC/Game_Campaign_NextJS/api"

# Install dependencies
npm install

# Start development server with auto-reload
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

### **2. Common Development Commands**

```bash
# Generate new module (NestJS CLI)
npx nest generate module modules/module-name

# Generate controller
npx nest generate controller modules/module-name

# Generate service
npx nest generate service modules/module-name

# Run linting
npm run lint

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

### **3. Environment Variables**

Create a `.env` file in the API root:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=gamified_crm
DB_SYNCHRONIZE=false
DB_LOGGING=true

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
```

---

## Creating New Modules

### **Step 1: Generate Module Structure**

```bash
# Generate module files
npx nest generate module modules/new-feature
npx nest generate controller modules/new-feature
npx nest generate service modules/new-feature
```

### **Step 2: Create Module Files**

Manually create these additional files:

1. **DTOs** (`src/modules/new-feature/dto/`):
```typescript
// create-new-feature.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateNewFeatureDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

// update-new-feature.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateNewFeatureDto } from './create-new-feature.dto';

export class UpdateNewFeatureDto extends PartialType(CreateNewFeatureDto) {}
```

2. **Entity** (if new database table needed):
```typescript
// src/entities/new-feature.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('new_features')
export class NewFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

### **Step 3: Implement Service**

```typescript
// src/modules/new-feature/new-feature.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewFeature } from '../../entities/new-feature.entity';
import { CreateNewFeatureDto } from './dto/create-new-feature.dto';
import { UpdateNewFeatureDto } from './dto/update-new-feature.dto';

@Injectable()
export class NewFeatureService {
  constructor(
    @InjectRepository(NewFeature)
    private readonly newFeatureRepository: Repository<NewFeature>,
  ) {}

  async create(createDto: CreateNewFeatureDto): Promise<NewFeature> {
    const feature = this.newFeatureRepository.create(createDto);
    return this.newFeatureRepository.save(feature);
  }

  async findAll(): Promise<NewFeature[]> {
    return this.newFeatureRepository.find();
  }

  async findOne(id: string): Promise<NewFeature> {
    const feature = await this.newFeatureRepository.findOne({ where: { id } });
    if (!feature) {
      throw new NotFoundException(`Feature with ID ${id} not found`);
    }
    return feature;
  }

  async update(id: string, updateDto: UpdateNewFeatureDto): Promise<NewFeature> {
    await this.findOne(id); // Verify exists
    await this.newFeatureRepository.update(id, updateDto);
    return this.findOne(id); // Return updated
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify exists
    await this.newFeatureRepository.delete(id);
  }
}
```

### **Step 4: Implement Controller**

```typescript
// src/modules/new-feature/new-feature.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NewFeatureService } from './new-feature.service';
import { CreateNewFeatureDto } from './dto/create-new-feature.dto';
import { UpdateNewFeatureDto } from './dto/update-new-feature.dto';
import { JwtAuthGuard } from '../customers/jwt-auth.guard';

@ApiTags('New Feature')
@UseGuards(JwtAuthGuard)
@Controller('new-feature')
export class NewFeatureController {
  constructor(private readonly newFeatureService: NewFeatureService) {}

  @Post()
  @ApiOperation({ summary: 'Create new feature' })
  @ApiResponse({ status: 201, description: 'Feature created successfully' })
  async create(@Body() createDto: CreateNewFeatureDto) {
    const feature = await this.newFeatureService.create(createDto);
    return {
      success: true,
      message: 'Feature created successfully',
      data: feature,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all features' })
  @ApiResponse({ status: 200, description: 'Features retrieved successfully' })
  async findAll() {
    const features = await this.newFeatureService.findAll();
    return {
      success: true,
      message: 'Features retrieved successfully',
      data: features,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific feature' })
  @ApiResponse({ status: 200, description: 'Feature retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const feature = await this.newFeatureService.findOne(id);
    return {
      success: true,
      message: 'Feature retrieved successfully',
      data: feature,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update feature' })
  @ApiResponse({ status: 200, description: 'Feature updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateNewFeatureDto
  ) {
    const feature = await this.newFeatureService.update(id, updateDto);
    return {
      success: true,
      message: 'Feature updated successfully',
      data: feature,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete feature' })
  @ApiResponse({ status: 200, description: 'Feature deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.newFeatureService.remove(id);
    return {
      success: true,
      message: 'Feature deleted successfully',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
```

### **Step 5: Create Module File**

```typescript
// src/modules/new-feature/new-feature.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewFeatureController } from './new-feature.controller';
import { NewFeatureService } from './new-feature.service';
import { NewFeature } from '../../entities/new-feature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NewFeature])],
  controllers: [NewFeatureController],
  providers: [NewFeatureService],
  exports: [NewFeatureService],
})
export class NewFeatureModule {}
```

### **Step 6: Register Module in App Module**

```typescript
// src/app.module.ts
import { NewFeatureModule } from './modules/new-feature/new-feature.module';

@Module({
  imports: [
    // ... other modules
    NewFeatureModule,  // Add this line
  ],
  // ...
})
export class AppModule {}
```

---

## Creating New Endpoints

### **1. Basic Endpoint Pattern**

```typescript
@Get('endpoint-name')
@ApiOperation({ summary: 'Endpoint description' })
@ApiResponse({ status: 200, description: 'Success message' })
@ApiResponse({ status: 404, description: 'Not found' })
@Query('parameter_name') parameter: string  // For query params
@Param('id') id: string                // For route params
async endpointName(
  @Param('id') id: string,
  @Body() bodyDto: BodyDto,
  @Query('param') queryParam: string
) {
  try {
    const result = await this.service.method(id, bodyDto, queryParam);
    return {
      success: true,
      message: 'Operation successful',
      data: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
```

### **2. HTTP Methods**

```typescript
@Get()      // GET requests
@Post()     // POST requests
@Patch()     // PATCH requests
@Put()       // PUT requests
@Delete()    // DELETE requests
@All()       // All HTTP methods
```

### **3. Parameters**

```typescript
// Path Parameters
@Get(':id')
async getById(@Param('id') id: string) {}

// Query Parameters
@Get()
async getList(@Query('page') page: number, @Query('limit') limit: number) {}

// Request Body
@Post()
async create(@Body() createDto: CreateDto) {}

// Headers
@Get()
async getWithHeaders(@Headers('authorization') auth: string) {}
```

### **4. Custom Decorators**

```typescript
// File uploads
@UseInterceptors(FileInterceptor('file'))
@Post('upload')
async uploadFile(@UploadedFile() file: Express.Multer.File) {}

// Role-based access
@Roles('admin', 'manager')
@Get('admin-only')
async adminEndpoint() {}

// Rate limiting
@Throttle(10, 60) // 10 requests per minute
@Get('limited')
async limitedEndpoint() {}
```

---

## Database Operations

### **1. Repository Pattern**

```typescript
// Basic repository operations
@Injectable()
export class ServiceName {
  constructor(
    @InjectRepository(EntityName)
    private readonly repository: Repository<EntityName>,
  ) {}

  // Create
  async create(createDto: CreateDto): Promise<EntityName> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  // Find All
  async findAll(): Promise<EntityName[]> {
    return this.repository.find();
  }

  // Find One
  async findOne(id: string): Promise<EntityName> {
    return this.repository.findOne({ where: { id } });
  }

  // Update
  async update(id: string, updateDto: UpdateDto): Promise<EntityName> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  // Delete
  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
```

### **2. Advanced Queries**

```typescript
// With relations
async findWithRelations(): Promise<EntityName[]> {
  return this.repository.find({
    relations: ['relation1', 'relation2'],
  });
}

// With conditions
async findActive(): Promise<EntityName[]> {
  return this.repository.find({
    where: { status: 'active' },
  });
}

// Pagination
async findWithPagination(page: number, limit: number): Promise<EntityName[]> {
  return this.repository.find({
    skip: (page - 1) * limit,
    take: limit,
  });
}

// Custom query
async findCustom(): Promise<any[]> {
  return this.repository
    .createQueryBuilder('entity')
    .leftJoin('entity.relation', 'relation')
    .select(['entity.*', 'relation.name'])
    .where('entity.status = :status', { status: 'active' })
    .getRawMany();
}
```

### **3. Database Migrations**

```bash
# Generate new migration
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

---

## Authentication & Security

### **1. JWT Authentication Pattern**

```typescript
// Apply authentication guard
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Get('protected-endpoint')
async protectedEndpoint(@Request() req: any) {
  // Access user data from request
  const userId = req.user.id;
  const merchantId = req.user.merchant_id;
}
```

### **2. Custom Guards**

```typescript
// Role-based guard
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user && user.role === requiredRole;
  }
}

// Merchant ownership guard
@Injectable()
export class MerchantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const merchantId = request.params.merchantId;
    const userMerchantId = request.user.merchant_id;
    return merchantId === userMerchantId;
  }
}
```

### **3. Validation**

```typescript
// DTO with validation decorators
export class CreateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;
}

// Manual validation
if (!plainToClass(CreateDto, data)) {
  throw new BadRequestException('Invalid data format');
}
```

---

## Testing Guidelines

### **1. Unit Tests**

```typescript
// src/modules/new-feature/new-feature.service.spec.ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewFeatureService } from './new-feature.service';
import { NewFeature } from '../../entities/new-feature.entity';

describe('NewFeatureService', () => {
  let service: NewFeatureService;
  let repository: Repository<NewFeature>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NewFeatureService,
        {
          provide: getRepositoryToken(NewFeature),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NewFeatureService>(NewFeatureService);
    repository = module.get<Repository<NewFeature>>(getRepositoryToken(NewFeature));
  });

  it('should create a new feature', async () => {
    const createDto = { name: 'Test Feature' };
    const expectedFeature = { id: '123', ...createDto };

    jest.spyOn(repository, 'create').mockReturnValue(expectedFeature);
    jest.spyOn(repository, 'save').mockResolvedValue(expectedFeature);

    const result = await service.create(createDto);
    expect(result).toEqual(expectedFeature);
  });
});
```

### **2. Integration Tests**

```typescript
// src/modules/new-feature/new-feature.controller.spec.ts
import { Test } from '@nestjs/testing';
import { NewFeatureController } from './new-feature.controller';
import { NewFeatureService } from './new-feature.service';

describe('NewFeatureController', () => {
  let controller: NewFeatureController;
  let service: NewFeatureService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [NewFeatureController],
      providers: [
        {
          provide: NewFeatureService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NewFeatureController>(NewFeatureController);
    service = module.get<NewFeatureService>(NewFeatureService);
  });

  it('should create a feature', async () => {
    const createDto = { name: 'Test' };
    const expected = { data: { id: '1', name: 'Test' } };

    jest.spyOn(service, 'create').mockResolvedValue(expected.data);

    const result = await controller.create(createDto);
    expect(result).toEqual(expected);
  });
});
```

### **3. E2E Tests**

```typescript
// test/new-feature.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('NewFeature (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/new-feature (POST)', () => {
    it('should create a new feature', () => {
      return request(app.getHttpServer())
        .post('/new-feature')
        .send({ name: 'Test Feature' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });
});
```

---

## Deployment

### **1. Production Build**

```bash
# Install production dependencies
npm ci --only=production

# Build the application
npm run build

# The build will be in /dist folder
```

### **2. Docker Deployment**

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY .env ./

EXPOSE 3001

CMD ["node", "dist/main"]
```

### **3. Environment Variables for Production**

```env
NODE_ENV=production
PORT=3001
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USERNAME=prod_user
DB_PASSWORD=secure_password
DB_DATABASE=gamified_crm_prod
JWT_SECRET=very_secure_jwt_secret_key
DB_SYNCHRONIZE=false
DB_LOGGING=false
```

---

## Best Practices

### **1. Code Organization**
- Keep modules small and focused
- One module = one feature
- Use DTOs for all input validation
- Implement consistent error handling

### **2. API Design**
- Use RESTful conventions
- Implement proper HTTP status codes
- Provide meaningful error messages
- Version your APIs

### **3. Security**
- Always validate input
- Use parameterized queries (TypeORM handles this)
- Implement rate limiting
- Keep secrets in environment variables

### **4. Performance**
- Use database indexes
- Implement caching where appropriate
- Use pagination for large datasets
- Optimize queries

### **5. Documentation**
- Document all endpoints with Swagger
- Keep API_DEVELOPMENT_TODO.md updated
- Use meaningful commit messages
- Write clear comments for complex logic

---

## Common Patterns

### **1. Success Response Wrapper**

```typescript
// Create a helper class
export class ApiResponse {
  static success(data: any, message: string = 'Operation successful') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message: string, statusCode: number = 400) {
    throw new HttpException(
      {
        success: false,
        message,
        data: null,
        timestamp: new Date().toISOString(),
      },
      statusCode
    );
  }
}

// Use in controllers
@Get()
async findAll() {
  const data = await this.service.findAll();
  return ApiResponse.success(data, 'Items retrieved successfully');
}
```

### **2. Pagination Pattern**

```typescript
// DTO
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// Service implementation
async findAll(pagination: PaginationDto) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [items, total] = await this.repository.findAndCount({
    skip,
    take: limit,
  });

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

### **3. Search Pattern**

```typescript
// Search DTO
export class SearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['name', 'email', 'phone'])
  searchBy?: string;
}

// Service implementation
async search(searchDto: SearchDto) {
  const queryBuilder = this.repository.createQueryBuilder('entity');

  if (searchDto.search) {
    queryBuilder.andWhere(
      `entity.${searchDto.searchBy || 'name'} LIKE :search`,
      { search: `%${searchDto.search}%` }
    );
  }

  return queryBuilder.getMany();
}
```

### **4. Soft Delete Pattern**

```typescript
// Entity
@Entity()
export class SoftDeleteEntity {
  // ... other fields

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  deleted_at?: Date;
}

// Service
async softDelete(id: string): Promise<void> {
  await this.repository.update(id, {
    is_active: false,
    deleted_at: new Date(),
  });
}

// Find only active records
async findActive(): Promise<SoftDeleteEntity[]> {
  return this.repository.find({
    where: { is_active: true },
  });
}
```

---

## Quick Reference

### **Common Commands**
```bash
# Start development
npm run start:dev

# Run tests
npm run test

# Build
npm run build

# Lint
npm run lint

# Format
npm run format

# Generate module
npx nest g module modules/module-name

# Generate controller
npx nest g controller modules/module-name

# Generate service
npx nest g service modules/module-name
```

### **File Locations**
- **Entities**: `/src/entities/`
- **Modules**: `/src/modules/`
- **DTOs**: `/src/modules/[module]/dto/`
- **Tests**: `/test/`

### **Database Connection**
- **Config**: `src/app.module.ts`
- **Entities**: Auto-loaded from `/src/entities/`
- **Migrations**: Use TypeORM CLI

### **Important Files to Update When Adding New Features**
1. `API_DEVELOPMENT_TODO.md` - Track implementation status
2. `API_DEVELOPMENT_GUIDE.md` - Document new patterns
3. Entity relationships in relevant entity files
4. Module imports in `app.module.ts`

---

## Conclusion

This guide serves as the complete reference for API development in this project. Follow these patterns and conventions to maintain consistency and quality across the codebase.

For any questions or clarifications, refer to:
- Existing module implementations for patterns
- NestJS documentation (https://docs.nestjs.com/)
- TypeORM documentation (https://typeorm.io/)
- API_DEVELOPMENT_TODO.md for current implementation status

Remember: Always test your changes, update documentation, and follow the established patterns for maintainability!