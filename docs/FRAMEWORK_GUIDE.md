# NestJS API Framework - Complete Guide 📚

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Core Concepts](#core-concepts)
4. [Modules Explained](#modules-explained)
5. [Authentication & Security](#authentication--security)
6. [Database Integration](#database-integration)
7. [API Patterns](#api-patterns)
8. [Performance Optimizations](#performance-optimizations)
9. [Testing Strategies](#testing-strategies)
10. [Deployment](#deployment)
11. [Best Practices](#best-practices)
12. [Advanced Features](#advanced-features)

## Introduction

The NestJS API Framework is a production-ready, scalable foundation for building REST APIs. It combines the power of NestJS with TypeScript, TypeORM, and modern development practices to provide a solid foundation for any API project.

### Key Benefits

- **⚡ Fast Development**: Pre-built patterns and utilities accelerate development
- **🛡️ Type Safe**: Full TypeScript support with comprehensive interfaces
- **🔐 Security First**: Built-in authentication, authorization, and security measures
- **📈 Performance Optimized**: Connection pooling, caching, and response optimization
- **🧪 Test Ready**: Comprehensive testing setup with utilities and patterns
- **📖 Self-Documenting**: Auto-generated Swagger documentation
- **🔧 Maintainable**: Clean architecture with separation of concerns

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────┐
│           Controllers Layer             │ ← HTTP Requests/Responses
├─────────────────────────────────────────┤
│            Services Layer               │ ← Business Logic
├─────────────────────────────────────────┤
│           Repository Layer              │ ← Data Access
├─────────────────────────────────────────┤
│           Database Layer                │ ← Data Persistence
└─────────────────────────────────────────┘
```

### Module Structure

```
src/
├── core/                    # Framework core modules
│   ├── auth/               # Authentication system
│   ├── database/           # Database utilities
│   ├── health/             # Health monitoring
│   └── base/               # Base classes
├── common/                 # Shared utilities
│   ├── decorators/         # Custom decorators
│   ├── filters/            # Exception filters
│   ├── guards/             # Route guards
│   ├── interceptors/       # Request/response interceptors
│   ├── pipes/              # Data transformation
│   └── interfaces/         # TypeScript interfaces
├── config/                 # Configuration modules
└── modules/                # Feature modules (your code)
```

## Core Concepts

### 1. Dependency Injection

The framework uses NestJS's powerful dependency injection system:

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}
}
```

### 2. Module System

Modules organize the application into cohesive blocks:

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

### 3. Controllers

Controllers handle incoming HTTP requests:

```typescript
@Controller('users')
@ApiTags('Users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll(): Promise<ApiResponse<User[]>> {
    return this.usersService.findAll();
  }
}
```

### 4. Services

Services contain business logic:

```typescript
@Injectable()
export class UsersService {
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }
}
```

## Modules Explained

### Core/Auth Module

Provides comprehensive authentication and authorization:

#### Features
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- API key authentication support
- Rate limiting for auth endpoints

#### Usage

```typescript
// Protect routes
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {}

// Require specific roles
@Roles('admin')
@Post()
async createAdminResource() {}

// Public routes
@Public()
@Get('public-info')
async getPublicInfo() {}
```

### Core/Database Module

Handles database connections and utilities:

#### Features
- TypeORM integration with connection pooling
- Health monitoring for database
- Migration support
- Automatic entity discovery

#### Configuration

```typescript
// In your module
@Module({
  imports: [
    DatabaseModule.forFeature([YourEntity])
  ]
})
export class YourModule {}
```

### Core/Health Module

Provides health monitoring capabilities:

#### Endpoints
- `GET /health` - Basic health check
- `GET /health/liveness` - Kubernetes liveness probe
- `GET /health/readiness` - Kubernetes readiness probe
- `GET /health/metrics` - Application metrics

### Core/Base Module

Provides base classes for common functionality:

#### Base Entity

```typescript
@Entity('users')
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;
}
```

Features:
- UUID primary key
- Created/updated timestamps
- Soft delete support
- Audit trail

#### Base Service

```typescript
export class UsersService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>
  ) {
    super(repository);
  }
}
```

Features:
- Generic CRUD operations
- Pagination support
- Soft delete handling
- Transaction support

## Authentication & Security

### JWT Authentication

The framework provides a complete JWT authentication system:

#### Configuration

```env
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
```

#### Usage

```typescript
// Login
const result = await this.authService.login({
  email,
  password
});

// Result contains
{
  accessToken: string,
  refreshToken: string,
  user: User,
  expiresIn: number
}
```

### Role-Based Access Control

#### Role Hierarchy

```typescript
// Define roles in order of priority
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user'
};
```

#### Protecting Routes

```typescript
// Single role
@Roles('admin')
@Post()
async adminOnly() {}

// Multiple roles (any)
@Roles('admin', 'manager')
async adminOrManager() {}

// Use custom logic in service
if (!this.authService.hasRole(user, 'admin')) {
  throw new ForbiddenException();
}
```

### Security Measures

1. **Password Security**
   - Bcrypt hashing with salt rounds
   - Minimum password requirements
   - Password history checking

2. **Rate Limiting**
   - Configurable per-endpoint limits
   - IP-based limiting
   - Redis backend for distributed limits

3. **Input Validation**
   - Class-validator decorators
   - SQL injection prevention
   - XSS protection

4. **CORS Configuration**
   - Environment-based origin whitelist
   - Credentials support
   - Preflight handling

## Database Integration

### Entity Patterns

#### Base Entity

All entities should extend `BaseEntity`:

```typescript
@Entity('users')
export class User extends BaseEntity {
  @Column()
  @ApiProperty()
  name: string;

  @Column({ unique: true })
  @ApiProperty()
  email: string;

  @OneToMany(() => Post, post => post.user)
  posts: Post[];
}
```

#### Relationships

```typescript
// One-to-Many
@OneToMany(() => Post, post => post.user, { lazy: true })
posts: Promise<Post[]>;

// Many-to-One
@ManyToOne(() => User, user => user.posts)
user: User;

// Many-to-Many
@JoinTable()
@ManyToMany(() => Role, role => role.users)
roles: Role[];
```

### Repository Patterns

#### Basic Operations

```typescript
// Find
const users = await this.repository.find({
  where: { active: true },
  relations: ['profile'],
  order: { createdAt: 'DESC' }
});

// Create
const user = this.repository.create(createUserDto);
await this.repository.save(user);

// Update
await this.repository.update(id, updateData);

// Delete
await this.repository.softDelete(id);
```

#### Advanced Queries

```typescript
// Using QueryBuilder
const users = await this.repository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.profile', 'profile')
  .where('user.active = :active', { active: true })
  .andWhere('user.createdAt >= :date', { date: new Date() })
  .orderBy('user.name', 'ASC')
  .getMany();

// Raw SQL
const result = await this.repository.query(
  'SELECT COUNT(*) FROM users WHERE active = ?',
  [true]
);
```

### Migrations

#### Create Migration

```bash
npm run typeorm migration:generate -- -n CreateUserTable
```

#### Run Migrations

```bash
npm run typeorm migration:run
```

#### Example Migration

```typescript
export class CreateUserTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid'
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true
          }
        ]
      })
    );
  }
}
```

## API Patterns

### Standard Response Format

All API responses follow a consistent format:

```typescript
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
  path: string;
}
```

### Pagination

Standard pagination implementation:

```typescript
interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

#### Usage in Service

```typescript
async findAll(query: PaginationQuery): Promise<PaginatedResponse<User>> {
  const { page = 1, limit = 10, sortBy, sortOrder } = query;
  const [data, total] = await this.repository.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
    order: sortBy ? { [sortBy]: sortOrder } : undefined,
  });

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}
```

### Error Handling

#### Global Exception Filter

The framework includes a global exception filter that:

1. Logs all errors with context
2. Returns consistent error responses
3. Handles validation errors properly
4. Masks sensitive information

#### Error Response Format

```typescript
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

### DTOs and Validation

#### Request DTOs

```typescript
export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number'
  })
  password: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string;
}
```

#### Response DTOs

```typescript
export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
```

## Performance Optimizations

### Database Optimizations

1. **Connection Pooling**
   ```typescript
   extra: {
     connectionLimit: 50,
     acquireTimeout: 60000,
     timeout: 60000
   }
   ```

2. **Query Optimization**
   - Use select for specific fields
   - Implement proper indexes
   - Use lazy loading for relations
   - Batch operations where possible

3. **Caching**
   ```typescript
   @CacheKey('users:list')
   @CacheTTL(300) // 5 minutes
   async findAll() {
     return this.repository.find();
   }
   ```

### Application Optimizations

1. **Compression**
   ```typescript
   app.use(compression());
   ```

2. **Response Interceptors**
   - Standardized response format
   - Automatic pagination
   - Metadata injection

3. **Validation Pipes**
   - Transform input types
   - Strip unknown properties
   - Validate early in request lifecycle

### Memory Management

1. **Lazy Loading Modules**
   ```typescript
   @Module({
     imports: [
       UsersModule.forRoot(),
       // Dynamically load modules as needed
     ]
   })
   ```

2. **Garbage Collection**
   - Clear expired tokens
   - Clean up unused sessions
   - Monitor memory usage

## Testing Strategies

### Unit Testing

#### Service Testing

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should create user', async () => {
    const user = { name: 'John', email: 'john@example.com' };
    jest.spyOn(repository, 'save').mockResolvedValue(user as User);

    expect(await service.create(user)).toEqual(user);
  });
});
```

### Integration Testing

#### Controller Testing

```typescript
describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });
});
```

### E2E Testing

```typescript
describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/users (POST)', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ name: 'John', email: 'john@example.com' })
      .expect(201);
  });
});
```

## Deployment

### Environment Configuration

#### Production Environment Variables

```env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=your-db-host
DB_PORT=3306
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_DATABASE=your-db-name

# Security
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# CORS
CORS_ORIGIN=https://yourdomain.com

# Redis (if using)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
```

### Docker Deployment

#### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs dist ./dist

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
```

#### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: myapp
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nestjs-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nestjs-api
  template:
    metadata:
      labels:
        app: nestjs-api
    spec:
      containers:
      - name: api
        image: your-registry/nestjs-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
```

## Best Practices

### Code Organization

1. **Feature-Based Structure**
   ```
   modules/
   ├── users/
   │   ├── users.module.ts
   │   ├── users.controller.ts
   │   ├── users.service.ts
   │   ├── dto/
   │   └── entities/
   └── posts/
   ```

2. **Naming Conventions**
   - Files: kebab-case (`users.service.ts`)
   - Classes: PascalCase (`UsersService`)
   - Methods: camelCase (`findAllUsers`)
   - Variables: camelCase (`userData`)

### Security Practices

1. **Always validate input**
2. **Use parameterized queries**
3. **Implement rate limiting**
4. **Hash sensitive data**
5. **Use HTTPS in production**
6. **Implement proper CORS**

### Performance Practices

1. **Use database indexes**
2. **Implement caching**
3. **Use pagination**
4. **Optimize queries**
5. **Monitor performance**

### Testing Practices

1. **Write tests first (TDD)**
2. **Test at all levels**
3. **Mock external dependencies**
4. **Test error cases**
5. **Maintain high coverage**

## Advanced Features

### Custom Decorators

#### Request User Decorator

```typescript
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

#### Usage

```typescript
@Get('profile')
async getProfile(@GetUser() user: User) {
  return user;
}
```

### Custom Interceptors

#### Cache Interceptor

```typescript
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const cacheKey = this.generateKey(context);
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return of(cached);
    }

    return next.handle().pipe(
      tap(data => this.cache.set(cacheKey, data))
    );
  }
}
```

### Event-Driven Architecture

#### Events

```typescript
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
```

#### Event Handlers

```typescript
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler {
  async handle(event: UserCreatedEvent) {
    // Send welcome email
    await this.emailService.sendWelcomeEmail(event.email);
  }
}
```

### Background Jobs

#### Bull Queue

```typescript
@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
})
export class QueueModule {}

@Processor('email')
export class EmailProcessor {
  @Process('sendWelcome')
  async sendWelcomeEmail(job: Job) {
    const { userId, email } = job.data;
    // Process email
  }
}
```

### GraphQL Integration

```typescript
@Resolver(() => User)
export class UsersResolver {
  @Query(() => [User])
  async users(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    return this.usersService.create(input);
  }
}
```

### WebSockets

```typescript
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class UsersGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('userJoined')
  handleUserJoined(client: Socket, payload: any) {
    this.server.emit('userJoined', payload);
  }
}
```

## Conclusion

This framework provides a solid foundation for building scalable, maintainable APIs with NestJS. By following the patterns and best practices outlined in this guide, you can create robust applications that are secure, performant, and easy to maintain.

### Next Steps

1. Explore the example modules
2. Read the API documentation
3. Check out the testing guide
4. Review the deployment strategies
5. Join our community for support

### Resources

- [Official NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [JWT.io](https://jwt.io/)
- [Swagger/OpenAPI](https://swagger.io/)

Happy coding! 🚀