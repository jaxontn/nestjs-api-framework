# NestJS API Framework ⚡

A high-performance, production-ready NestJS API framework designed for rapid development of scalable APIs. Built with TypeScript, TypeORM, and best practices.

## 🚀 Features

- **⚡ Fast Startup**: Optimized for minimal boot time
- **🏗️ Modular Architecture**: Clean separation of concerns
- **🔐 Security First**: JWT authentication, role-based access, input validation
- **📊 Database Ready**: TypeORM with MySQL/PostgreSQL support
- **📝 Auto Documentation**: Swagger/OpenAPI integration
- **🧪 Testing Ready**: Built-in unit and E2E test setup
- **🔄 Hot Reload**: Development with instant feedback
- **📈 Performance**: Connection pooling, caching, lazy loading
- **🛡️ Type Safe**: Full TypeScript support
- **📦 Production Ready**: Logging, monitoring, graceful shutdown

## 📁 Structure

```
nestjs-api-framework/
├── src/
│   ├── app.module.ts              # Main application module
│   ├── main.ts                    # Application bootstrap
│   ├── common/                    # Shared utilities
│   │   ├── decorators/           # Custom decorators
│   │   ├── filters/              # Exception filters
│   │   ├── guards/               # Authentication guards
│   │   ├── interceptors/         # Response interceptors
│   │   ├── pipes/                # Validation pipes
│   │   └── interfaces/           # TypeScript interfaces
│   ├── config/                   # Configuration files
│   │   ├── database.config.ts    # Database configuration
│   │   ├── jwt.config.ts         # JWT configuration
│   │   └── swagger.config.ts     # API documentation
│   ├── core/                     # Core framework modules
│   │   ├── auth/                 # Authentication system
│   │   ├── database/             # Database utilities
│   │   └── base/                 # Base classes and utilities
│   └── modules/                  # Feature modules (your code)
├── test/                         # Test files
├── docs/                         # Documentation
├── scripts/                      # Utility scripts
├── .env.example                  # Environment template
└── package.json                  # Dependencies
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or copy this framework
git clone <repository-url> your-api-name
cd your-api-name

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 2. Configuration

Edit `.env` with your settings:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=myapp

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Start Development

```bash
# Start development server with hot reload
npm run start:dev

# Start in debug mode
npm run start:debug

# Build for production
npm run build

# Start production server
npm run start:prod
```

### 4. Access API

- **API**: http://localhost:3000
- **Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

## 📚 Core Concepts

### 1. Creating a Module

```bash
# Generate a new module
npx nest generate module modules/users
npx nest generate controller modules/users
npx nest generate service modules/users
```

### 2. Entity Example

```typescript
// src/modules/users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;
}
```

### 3. Service Example

```typescript
// src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findAll() {
    return this.userRepository.find();
  }

  async create(userData: Partial<User>) {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }
}
```

### 4. Controller Example

```typescript
// src/modules/users/users.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() userData: Partial<User>): Promise<User> {
    return this.usersService.create(userData);
  }
}
```

## 🔐 Authentication

### JWT Authentication

```typescript
// Protect routes with JWT
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  // Only authenticated users can access
}
```

### Role-Based Access

```typescript
// Require specific roles
@Post()
@Roles('admin')
@UseGuards(RolesGuard)
async createAdminResource() {
  // Only admins can access
}
```

## 📊 Database

### Migrations

```bash
# Create migration
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

## 📝 Documentation

### Swagger/OpenAPI

The framework automatically generates API documentation. Access at `/docs`.

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e
```

## 🚀 Performance

### Features

- **Connection Pooling**: Efficient database connections
- **Caching**: Redis support for frequently accessed data
- **Lazy Loading**: Load relations only when needed
- **Compression**: Gzip compression for responses

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 3306 |
| DB_USERNAME | Database user | root |
| DB_PASSWORD | Database password | - |
| DB_DATABASE | Database name | - |
| JWT_SECRET | JWT secret | - |
| JWT_EXPIRES_IN | JWT expiration | 24h |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |

## 🛠️ Scripts

```json
{
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "build": "nest build",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "format": "prettier --write \"src/**/*.ts\""
}
```

## 📦 Dependencies

### Core Dependencies

- `@nestjs/core` - NestJS framework
- `@nestjs/common` - Common utilities
- `@nestjs/config` - Configuration management
- `@nestjs/typeorm` - TypeORM integration
- `@nestjs/jwt` - JWT authentication
- `@nestjs/swagger` - API documentation
- `typeorm` - ORM for database
- `class-validator` - Input validation
- `class-transformer` - Data transformation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This framework is MIT licensed.
