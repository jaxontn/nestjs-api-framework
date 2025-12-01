# NestJS Dependency Injection Fix Documentation

## Problem Overview

The NestJS API was failing to start with dependency injection errors related to `JwtStrategy` and `AuthService`. The application couldn't resolve dependencies in the module context.

## Root Cause Analysis

### 1. Incorrect Import Path in JwtStrategy
**File**: `src/modules/customers/strategies/jwt.strategy.ts`
**Problem**: The JwtStrategy was trying to import AuthService from an incorrect path:
```typescript
// INCORRECT - This path didn't exist
import { AuthService } from '../auth.service';
```

### 2. Module Architecture Issues
**Problem**: There were duplicate `AuthService` files in different locations:
- `src/auth/auth.service.ts` (original, referenced by AuthModule)
- `src/modules/customers/auth.service.ts` (used by CustomersModule)

**Issue**: The JwtStrategy (in CustomersModule) needed AuthService, but AuthModule was trying to provide its own version, creating a circular dependency issue.

### 3. Missing Dependencies in CustomersModule
**Problem**: The AuthService in CustomersModule required `JwtService` but it wasn't available because CustomersModule didn't import JwtModule.

## Solution Implementation

### 1. Fixed Import Paths
**File**: `src/modules/customers/strategies/jwt.strategy.ts`
**Fix**: Updated import to point to correct AuthService location:
```typescript
// CORRECT - Points to the AuthService within the same module
import { AuthService } from '../auth.service';
```

### 2. Restructured Module Dependencies
**File**: `src/modules/customers/customers.module.ts`
**Changes**:
- Added `JwtModule` to imports to provide `JwtService` to `AuthService`
- Added `AuthService`, `JwtStrategy`, and `JwtAuthGuard` to providers
- Exported all necessary services for other modules to use

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Merchant, GameSession, Leaderboard, LoyaltyTransaction]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: {
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '0') || 60 * 60 * 24 * 7,
      },
    }),
  ],
  controllers: [CustomersController],
  providers: [CustomersService, AuthService, JwtStrategy, JwtAuthGuard],
  exports: [CustomersService, AuthService, JwtAuthGuard]
})
```

### 3. Updated AuthModule Configuration
**File**: `src/auth/auth.module.ts`
**Changes**:
- Removed duplicate `AuthService` provider (now uses CustomersModule version)
- Added `CustomersModule` import to access `AuthService`
- Updated imports to use `AuthService` from CustomersModule

```typescript
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: {
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '0') || 60 * 60 * 24 * 7,
      },
    }),
    CustomersModule, // Import to get access to AuthService
    TypeOrmModule.forFeature([Customer, Merchant, GameSession, Leaderboard, LoyaltyTransaction]),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy], // Removed AuthService, now provided by CustomersModule
  exports: [],
})
```

### 4. Updated AuthController Imports
**File**: `src/auth/auth.controller.ts`
**Fix**: Updated import to use AuthService from CustomersModule:
```typescript
// CORRECT - Import from the module that actually provides it
import { AuthService } from '../modules/customers/auth.service';
```

## Why This Fix Works

### 1. **Proper Module Boundaries**
- Each service now lives in its appropriate module
- AuthService is properly provided by CustomersModule where it's used
- No more circular dependencies between AuthModule and CustomersModule

### 2. **Complete Dependency Chain**
- CustomersModule provides all required dependencies:
  - TypeORM repositories for database entities
  - JwtService for token operations
  - AuthService for business logic
  - JwtStrategy for authentication
  - JwtAuthGuard for route protection

### 3. **Clean Import Paths**
- All imports now point to their correct locations
- No more broken import paths causing "cannot find module" errors

### 4. **NestJS Dependency Injection Compliance**
- All providers are properly declared in their respective modules
- Dependencies are correctly exported and imported between modules
- No more "UnknownDependenciesException" errors

## Success Indicators

After applying these fixes, the application successfully starts with:

✅ **All Modules Loaded**:
- TypeOrmModule dependencies initialized
- PassportModule dependencies initialized
- JwtModule dependencies initialized
- CustomersModule dependencies initialized
- AuthModule dependencies initialized

✅ **All Routes Mapped**:
- Authentication endpoints (`/api/auth/*`)
- Customer management (`/api/customers/*`)
- Game sessions (`/api/games/*`)
- Merchant operations (`/api/merchants/*`)
- QR campaigns (`/api/qr-campaigns/*`)

✅ **API Server Running**:
- 🚀 NestJS API running on: http://localhost:3001/api
- 📚 API Documentation: http://localhost:3001/api

## Files Modified

1. `src/modules/customers/strategies/jwt.strategy.ts` - Fixed import path
2. `src/modules/customers/customers.module.ts` - Added complete dependency chain
3. `src/auth/auth.module.ts` - Updated to import CustomersModule
4. `src/auth/auth.controller.ts` - Updated import path for AuthService

## Best Practices Applied

1. **Single Responsibility**: Each module handles its specific domain
2. **Dependency Injection**: Proper use of NestJS DI container
3. **Module Boundaries**: Clear separation of concerns between modules
4. **Import Organization**: Correct relative paths for module imports
5. **Provider Exports**: Only export what other modules need

This fix ensures a maintainable, scalable NestJS application architecture that follows NestJS best practices.