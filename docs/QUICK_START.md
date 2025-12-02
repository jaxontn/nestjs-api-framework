# Quick Start Guide 🚀

Get your NestJS API up and running in minutes with this comprehensive quick start guide.

## Prerequisites

- Node.js 18+
- npm or yarn
- MySQL or PostgreSQL database
- Redis (optional, for caching)

## 1. Installation

### Option A: Create New Project

```bash
# Clone the framework
git clone https://github.com/your-org/nestjs-api-framework my-new-api
cd my-new-api

# Install dependencies
npm install
```

### Option B: Add to Existing Project

```bash
# Install framework packages
npm install @nestjs/core @nestjs/common @nestjs/config @nestjs/typeorm @nestjs/jwt @nestjs/swagger
npm install typeorm mysql2 class-validator class-transformer bcrypt
npm install -D @nestjs/cli @types/node typescript ts-node

# Copy framework files
cp -r nestjs-api-framework/src/* src/
```

## 2. Environment Setup

Create your environment file:

```bash
# Copy the template
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=my_new_api
DB_SYNCHRONIZE=false
DB_LOGGING=true

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Redis (optional but recommended)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## 3. Database Setup

### MySQL

```sql
-- Create database
CREATE DATABASE my_new_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional)
CREATE USER 'api_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON my_new_api.* TO 'api_user'@'localhost';
FLUSH PRIVILEGES;
```

### PostgreSQL

```sql
-- Create database
CREATE DATABASE my_new_api;

-- Create user (optional)
CREATE USER api_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE my_new_api TO api_user;
```

## 4. Start Development

```bash
# Start development server with hot reload
npm run start:dev

# Or start with debugging
npm run start:debug
```

Your API is now running at:
- **API**: http://localhost:3000
- **Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

## 5. Create Your First Module

Let's create a simple `Users` module:

### Generate Module Files

```bash
# Generate module structure
npx nest generate module modules/users
npx nest generate controller modules/users
npx nest generate service modules/users
```

### Create User Entity

Create `src/modules/users/entities/user.entity.ts`:

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@/core/base/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @ApiProperty()
  @Column({ select: false }) // Hide password by default
  password: string;

  @ApiProperty()
  @Column({ default: 'user' })
  role: string;

  @ApiProperty()
  @Column({ default: true })
  active: boolean;
}
```

### Create DTOs

Create `src/modules/users/dto/create-user.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsEnum } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsEnum(['user', 'admin'])
  @IsOptional()
  role?: string;
}
```

Create `src/modules/users/dto/update-user.dto.ts`:

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

### Create User Service

Edit `src/modules/users/users.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Hash password
    const saltRounds = 10;
    createUserDto.password = await bcrypt.hash(createUserDto.password, saltRounds);

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { active: true },
    });
  }

  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne({
      where: { id, active: true },
    });
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({
      where: { email, active: true },
      select: ['id', 'name', 'email', 'password', 'role', 'createdAt'], // Include password for auth
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      // Hash new password
      const saltRounds = 10;
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }
}
```

### Create User Controller

Edit `src/modules/users/users.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '@/core/auth/jwt.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ApiResponse as StandardResponse } from '@/common/interfaces/response.interface';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: User
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<StandardResponse<User>> {
    const user = await this.usersService.create(createUserDto);
    return {
      data: user,
      message: 'User created successfully',
      success: true,
      timestamp: new Date().toISOString(),
      path: '/users',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: [User]
  })
  async findAll(): Promise<StandardResponse<User[]>> {
    const users = await this.usersService.findAll();
    return {
      data: users,
      message: 'Users retrieved successfully',
      success: true,
      timestamp: new Date().toISOString(),
      path: '/users',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: User
  })
  async findOne(@Param('id') id: string): Promise<StandardResponse<User>> {
    const user = await this.usersService.findOne(id);
    return {
      data: user,
      message: 'User retrieved successfully',
      success: true,
      timestamp: new Date().toISOString(),
      path: `/users/${id}`,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
    type: User
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<StandardResponse<User>> {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      data: user,
      message: 'User updated successfully',
      success: true,
      timestamp: new Date().toISOString(),
      path: `/users/${id}`,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user (admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully'
  })
  async remove(@Param('id') id: string): Promise<StandardResponse<null>> {
    await this.usersService.remove(id);
    return {
      data: null,
      message: 'User deleted successfully',
      success: true,
      timestamp: new Date().toISOString(),
      path: `/users/${id}`,
    };
  }
}
```

### Update User Module

Edit `src/modules/users/users.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

### Update App Module

Edit `src/app.module.ts` to include your new module:

```typescript
import { Module } from '@nestjs/common';
// ... existing imports
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // ... existing modules
    UsersModule,
  ],
  // ... rest of the module
})
export class AppModule {}
```

## 6. Test Your API

### Start the Server

```bash
npm run start:dev
```

### Access the Documentation

Open http://localhost:3000/docs in your browser to see the Swagger documentation.

### Test with cURL

```bash
# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "Password123"}'

# Get all users (requires authentication)
curl http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 7. Common Tasks

### Adding Authentication

The framework already includes authentication. To use it:

```bash
# Register a user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Password123"}'

# Login to get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Password123"}'
```

### Creating Database Migrations

```bash
# Generate migration
npm run typeorm migration:generate -- -n CreateUserTable

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

### Adding More Modules

```bash
# Generate a new module
npx nest generate module modules/products
npx nest generate controller modules/products
npx nest generate service modules/products

# Follow the same pattern as the Users module
```

## 8. Next Steps

### Learn More

- Read the [Framework Guide](./FRAMEWORK_GUIDE.md) for detailed documentation
- Explore [Advanced Features](./ADVANCED_FEATURES.md)
- Check out [Testing Strategies](./TESTING.md)

### Best Practices

1. **Always validate input** with DTOs
2. **Use transactions** for multi-table operations
3. **Implement proper error handling**
4. **Add comprehensive tests**
5. **Use environment-specific configurations**
6. **Monitor your application in production**

### Production Deployment

When you're ready to deploy:

1. Set production environment variables
2. Configure your database for production
3. Set up Redis for caching
4. Configure monitoring and logging
5. Deploy using Docker or Kubernetes

See the [Deployment Guide](./DEPLOYMENT.md) for detailed instructions.

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your .env configuration
   - Ensure database is running
   - Verify credentials

2. **Migration Errors**
   - Ensure database exists
   - Check migration file syntax
   - Run with DB_SYNCHRONIZE=true for development

3. **JWT Errors**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper token format

4. **Port Already in Use**
   ```bash
   # Kill process on port
   lsof -ti:3000 | xargs kill

   # Or use different port
   PORT=3001 npm run start:dev
   ```

### Getting Help

- Check the documentation in `/docs`
- Search existing issues on GitHub
- Create a new issue with details
- Join our Discord community

## Success! 🎉

You've successfully set up your NestJS API with the framework. You now have:

- ✅ Working API with user management
- ✅ JWT authentication
- ✅ Database integration with TypeORM
- ✅ Auto-generated API documentation
- ✅ Standard response format
- ✅ Error handling
- ✅ Validation
- ✅ Health monitoring

Happy coding! 🚀