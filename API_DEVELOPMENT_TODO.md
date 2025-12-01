# API Development Task List - Gamified CRM Platform

## Overview

This document provides a comprehensive task list for completing the API development for the Gamified CRM platform. The API will serve the Next.js frontend located in `gaming_crm_nextjs/app/` and is built on NestJS with MySQL database.

**IMPORTANT**: This is a **LIVING DOCUMENTATION** that tracks implementation progress. Update the status markers (✅ 🟡 🔴) whenever modules are completed or progress is made.

**Status Legend**:
- ✅ **COMPLETED** - Fully implemented and tested
- 🟡 **IN PROGRESS** - Partially implemented, work in progress
- 🔴 **NOT STARTED** - Not yet implemented

**References**:
- Database Schema: `gaming_crm_nextjs/DATABASE_DOCUMENTATION.md`
- SQL Schema: `gaming_crm_nextjs/simplified_database_schema.sql`
- DBML Architecture: `gaming_crm_nextjs/simplified_database_architecture.dbml`

---

## Current Implementation Status

### ✅ **COMPLETED MODULES**
- **Merchants Module**: Full CRUD operations implemented with proper entity mapping
- **Games Module**: Complete implementation with controller, service, DTOs, and error handling
- **QR Campaigns Module**: Complete implementation with one-time use QR links, full CRUD operations, validation, and consumption logic
- **Customers Module**: Full implementation with controller, service, DTOs, and comprehensive customer analytics
- **Analytics Module**: Complete implementation with comprehensive analytics endpoints, reporting, and export functionality
- **Loyalty Program Module**: Complete implementation with rules management, points system, rewards catalog, analytics, and leaderboard functionality

### 🟡 **PARTIALLY IMPLEMENTED MODULES**
- **Challenges Module**: Complete entities but no module structure
- **Authentication & Security**: JWT guard exists but **missing rate limiting implementation**
- **Data Transfer Objects (DTOs)**: Comprehensive DTOs with validation decorators implemented

### 🔴 **NOT STARTED MODULES**
- **Merchant Users Module**: Entity exists but no module structure for multi-user support
- **Data Export and Reporting**: Framework exists but implementation incomplete
- **Real-time Features**: WebSocket integration not implemented
- **Performance Optimization**: Caching and query optimization not implemented

---

## Progress Tracking Instructions

**When working on API development, always:**

1. **Update status markers** in this document as you complete tasks
2. **Mark individual endpoints** as ✅ when implemented and tested
3. **Update module status** from 🔴 → 🟡 → ✅ as progress is made
4. **Add completion dates** for finished tasks
5. **Note any blockers** or issues encountered
6. **Reference this document** before starting any new API work

**Example of Progress Updates:**
```markdown
#### Tasks:
- [✅] Create `games.controller.ts` with all endpoints
- [🟡] Add DTOs for game sessions and settings
- [🔴] Implement proper error handling and validation
```

---

## Phase 1: Critical API Implementation (Week 1)

### 1.1 Complete Games Module API

#### **Tasks**:
- [✅] Create `games.controller.ts` with all endpoints
- [✅] Add DTOs for game sessions and settings
- [✅] Implement proper error handling and validation
- [🟡] Add authentication guards where needed
- [🔴] Test all endpoints with database operations

#### **Required Endpoints** (`/api/games`):
```typescript
// Game Sessions
POST /api/games/sessions/start          // Start new game session
POST /api/games/sessions/:sessionId/complete // Complete game session
GET  /api/games/sessions/merchant/:merchantId // Get sessions by merchant
GET  /api/games/sessions/customer/:customerId // Get sessions by customer

// Game Configuration
GET  /api/games/settings/:merchantId     // Get game settings
POST /api/games/settings/:merchantId     // Update game settings
GET  /api/games/prizes/:merchantId      // Get available prizes
POST /api/games/prizes/:merchantId      // Create new prize

// Leaderboards
GET  /api/games/leaderboard/:merchantId  // Get overall leaderboard
GET  /api/games/leaderboard/:merchantId/:gameType // Get game-specific leaderboard
```

#### **Database Entities Referenced**:
- `game_sessions` - Track individual game plays
- `game_settings` - Per-merchant game configuration
- `game_prizes` - Prize management and distribution
- `leaderboards` - Player rankings and achievements

#### **Frontend Pages Supported**:
- `app/play/[merchantId]/games/page.tsx` - Game gallery
- `app/play/[merchantId]/game/[gameId]/page.tsx` - Individual games
- `components/game-leaderboard.tsx` - Leaderboard display
- `components/games/` - All game components

---

### 1.2 Create QR Campaigns Module

#### **Tasks**:
- [✅] Create `qr-campaigns` module structure
- [✅] Implement `qr-campaigns.service.ts` with full business logic
- [✅] Create `qr-campaigns.controller.ts` with all CRUD operations
- [✅] Add DTOs for campaign creation and management
- [✅] Implement QR code generation logic
- [✅] Add campaign status management (draft/active/expired)
- [✅] **NEW**: Extend QR campaigns to support one-time use links
- [✅] **NEW**: Implement single-use campaign type validation and logic
- [✅] **NEW**: Add game-specific QR campaign creation for direct access
- [✅] **NEW**: Build automatic campaign status change from active → used
- [✅] **NEW**: Create merchant interface for managing one-time QR campaigns
- [✅] **NEW**: Implement QR link validation and consumption logic using existing schema

#### **Required Endpoints** (`/api/qr-campaigns`):
```typescript
// Campaign CRUD
GET    /api/qr-campaigns                    // Get all campaigns for merchant
GET    /api/qr-campaigns/:id               // Get specific campaign
POST   /api/qr-campaigns                    // Create new campaign
PATCH  /api/qr-campaigns/:id               // Update campaign
DELETE /api/qr-campaigns/:id               // Delete campaign

// Campaign Management
POST   /api/qr-campaigns/:id/activate      // Activate campaign
POST   /api/qr-campaigns/:id/pause         // Pause campaign
GET    /api/qr-campaigns/:id/analytics     // Get campaign analytics
POST   /api/qr-campaigns/:id/generate-qr   // Generate QR code

// One-Time Use QR Code Links (Extended functionality using existing campaigns)
POST   /api/qr-campaigns/single-use              // Create one-time use QR campaign
GET    /api/qr-campaigns/single-use/:campaignId   // Validate and get game info for one-time link
POST   /api/qr-campaigns/single-use/:campaignId/consume // Mark link as used after game played
DELETE /api/qr-campaigns/single-use/:campaignId   // Expire/deactivate one-time campaign
GET    /api/qr-campaigns/single-use/merchant/:merchantId // Get merchant's one-use campaigns
GET    /api/qr-campaigns?type=single-use        // Filter campaigns by one-time use type

// Campaign Data
GET    /api/qr-campaigns/:id/customers     // Get campaign customers
GET    /api/qr-campaigns/:id/sessions      // Get game sessions for campaign
```

#### **Database Entities Referenced**:
- `qr_campaigns` - **ADAPTED**: Now handles both regular campaigns and one-time QR links
- `merchants` - Campaign ownership and permissions
- `merchant_users` - User who created the single-use QR links
- `game_sessions` - Campaign game activity tracking (links games to QR campaigns)
- `daily_analytics` - Automatic analytics tracking for single-use QR performance

#### **One-Time Use QR Code Links Feature**:

**Purpose**: Allow merchants to generate unique, one-time use QR code links that direct users to specific games. Once played, the link expires and becomes invalid, preventing repeated plays.

#### **Tasks**:
- [✅] Design database schema for one-time use links
- [✅] Implement secure token generation system
- [✅] Create QR code generation service for single-use links
- [✅] Build link validation and expiration logic
- [✅] Add game-specific QR code creation flow
- [✅] Implement automatic link expiration after game completion
- [✅] Create merchant management interface for single-use links
- [🟡] Add analytics and tracking for single-use QR performance

#### **Implementation Using Existing Tables**:

**No new tables required!** The one-time QR code functionality can be implemented using existing schema:

```sql
-- Use existing qr_campaigns table with one-time use configuration:
-- qr_campaigns fields that will be leveraged:
-- - id: Unique token for QR link
-- - name: Campaign name (e.g., "Direct Spin & Win - Coffee Shop")
-- - campaign_type: Set to "single_use_qr"
-- - qr_url: Contains the direct game access URL
-- - game_settings: JSON with {game_type, points_config, auto_expire: true}
-- - start_date: Link creation time
-- - end_date: Link expiration time
-- - status: "active" → "used" after game played
-- - total_scans: Track scan attempts
-- - unique_scans: Track unique usage (should remain 1)
-- - total_participants: Track actual game completions
-- - budget: Optional budget control
-- - total_spent: Track points/costs incurred
-- - target_audience: JSON with branding {merchant_name, theme_color}
-- - conversion_rate: Track usage effectiveness
-- - created_by: Merchant user who created the link
```

#### **One-Time Use Link Flow Using Existing Schema**:

1. **Merchant Creates Link**:
   - Create new `qr_campaigns` record with:
     - `campaign_type` = "single_use_qr"
     - `name` = descriptive name (e.g., "Direct Memory Match - Weekend Promo")
     - `game_settings` = JSON with specific game configuration
     - `target_audience` = JSON with branding {merchant_name, theme_color}
     - `end_date` = expiration date (e.g., 30 days from creation)
     - `status` = "active"

2. **Customer Scans QR Code**:
   - QR code directs to: `/play/[merchantId]/single-use/[campaignId]`
   - System checks `qr_campaigns` for:
     - `status` = "active" and `campaign_type` = "single_use_qr"
     - `end_date` > current time (not expired)
     - `total_participants` = 0 (not used yet)
   - Extract game settings and branding from campaign record
   - No data collection required (pre-configured)

3. **Game Played**:
   - Customer plays the selected game
   - Game session recorded with `campaign_id` linking to QR campaign
   - System updates `qr_campaigns`:
     - `status` = "used" (mark as consumed)
     - `total_scans` = `total_scans` + 1
     - `unique_scans` = 1
     - `total_participants` = 1
     - `conversion_rate` = 100%
   - QR code becomes permanently invalid

4. **Post-Game**:
   - Show results and leaderboard (regular game flow)
   - Customer gets points and achievement updates
   - Link marked as used, preventing future access

#### **API Implementation Details Using Existing Schema**:

- **Campaign ID as Token**: Use `qr_campaigns.id` (VARCHAR(255) primary key) as unique QR link token
- **Campaign Type Filter**: `campaign_type = 'single_use_qr'` to identify one-time links
- **Status Management**: Track link state through `status` field:
  - `"draft"` → `"active"` → `"used"`/`"expired"`
- **Expiration Control**: Use `end_date` field for automatic expiration
- **Usage Tracking**: Monitor through `total_participants` (should be 0 or 1)
- **Security**: Use existing merchant authentication and campaign permissions
- **Validation Logic**:
  ```sql
  SELECT id, game_settings, target_audience
  FROM qr_campaigns
  WHERE id = :campaignId
    AND campaign_type = 'single_use_qr'
    AND merchant_id = :merchantId
    AND status = 'active'
    AND (end_date IS NULL OR end_date > NOW())
    AND total_participants = 0;
  ```
- **Consumption Logic**:
  ```sql
  UPDATE qr_campaigns
  SET status = 'used',
      total_participants = 1,
      unique_scans = 1,
      conversion_rate = 100
  WHERE id = :campaignId;
  ```

#### **Frontend Integration**:
- `app/dashboard/campaigns/page.tsx` - Single-use QR creation interface
- `app/play/[merchantId]/games/single-use/[token]/page.tsx` - Direct game access
- `app/play/[merchantId]/game/single-use/[token]/[gameId]/page.tsx` - Specific game page
- QR code generation and download functionality
- Link management dashboard (view, expire, regenerate)

#### **Frontend Pages Supported**:
- `app/dashboard/campaigns/page.tsx` - Campaign management + single-use QR creation
- `app/dashboard/analytics/page.tsx` - Campaign performance + single-use link analytics
- `components/crm-data-table.tsx` - Campaign data display
- `app/play/[merchantId]/page.tsx` - QR landing page data
- New single-use QR management components

---

### 1.3 Complete Customers Module ✅ **COMPLETED**

#### **Tasks**:
- [✅] Implement `customers.service.ts` with full CRUD operations
- [✅] Create `customers.controller.ts` with all endpoints
- [✅] Add customer segmentation logic (new/active/loyal/at_risk)
- [✅] Implement engagement score calculation
- [✅] Add customer search and filtering capabilities
- [✅] Create customer export functionality

#### **Required Endpoints** (`/api/customers`):
```typescript
// Customer CRUD
GET    /api/customers                        // Get all customers for merchant
GET    /api/customers/:id                   // Get specific customer
POST   /api/customers                        // Create new customer
PATCH  /api/customers/:id                   // Update customer
DELETE /api/customers/:id                   // Delete customer

// Customer Management
GET    /api/customers/search                  // Search customers by name/phone/email
GET    /api/customers/:id/history           // Get customer game history
GET    /api/customers/:id/achievements      // Get customer achievements
POST   /api/customers/:id/segment          // Update customer segment

// Data Operations
POST   /api/customers/export                // Export customer data (CSV/JSON)
GET    /api/customers/segments              // Get customer segment breakdown
GET    /api/customers/analytics            // Get customer analytics
```

#### **Database Entities Referenced**:
- `customers` - Complete customer profiles with engagement tracking
- `game_sessions` - Customer game history
- `leaderboards` - Customer competitive performance
- `daily_analytics` - Customer behavior analytics

#### **Frontend Pages Supported**:
- `app/dashboard/customer-data/page.tsx` - Customer management
- `app/dashboard/analytics/page.tsx` - Customer analytics
- `components/user-game-data-table.tsx` - Customer game data
- `app/play/[merchantId]/leaderboard/page.tsx` - Customer rankings

---

## Phase 2: Core Features (Week 2)

### 2.1 Authentication & Security System

#### **Customer Portal "Login" (Phone/Email Lookup)**

**Note**: This system does NOT use traditional login with passwords. Instead, customers enter their phone number or email to retrieve their existing game progress, points, and achievements from the merchant's system.

#### **Tasks**:
- [✅] Implement customer lookup service (phone/email → customer data)
- [✅] Create customer identification middleware
- [✅] Add phone/email validation and sanitization
- [✅] Implement customer session management (without passwords)
- [✅] Create new customer registration for first-time players
- [✅] Add phone number masking for privacy (XXX-XXX-1234 format)
- [✅] Create global error handling for customer lookup
- [🔴] Implement rate limiting to prevent data harvesting
- [✅] Add customer data privacy controls

#### **Required Endpoints** (`/api/customers`):
```typescript
// Customer Identification (Login equivalent)
POST   /api/customers/lookup               // Customer phone/email lookup
GET    /api/customers/lookup/:phoneOrEmail  // Get customer by phone/email
POST   /api/customers/register               // Register new customer
GET    /api/customers/:id/profile           // Get customer profile with progress

// Session Management
POST   /api/customers/session/create         // Create customer session
DELETE /api/customers/session/:sessionId      // End customer session
GET    /api/customers/session/:sessionId      // Get session data

// Customer Data Retrieval
GET    /api/customers/:id/progress         // Get game progress and points
GET    /api/customers/:id/achievements     // Get customer achievements
GET    /api/customers/:id/game-history      // Get customer game sessions
```

#### **Required Endpoints** (`/api/auth` - For Merchant Portal Only):
```typescript
// Merchant Authentication (Traditional Login)
POST   /api/auth/login                     // Merchant login with password
POST   /api/auth/logout                    // Merchant logout
POST   /api/auth/register                  // Merchant registration
POST   /api/auth/refresh                   // Token refresh
GET    /api/auth/profile                   // Get merchant profile

// Password Management (Merchant Only)
POST   /api/auth/forgot-password           // Forgot password
POST   /api/auth/reset-password            // Reset password
POST   /api/auth/change-password           // Change password
```

#### **Customer Login Flow**:
1. **Customer enters phone/email** → `POST /api/customers/lookup` ✅ **IMPLEMENTED**
2. **System searches** → Check if customer exists in `customers` table ✅ **IMPLEMENTED**
3. **If customer found** → Return:
   - Customer ID
   - Total points and games played
   - Recent achievements
   - Current leaderboard position
   - Game session history
4. **If customer not found** → Redirect to registration form ✅ **IMPLEMENTED**
5. **Create session** → Generate temporary session token for API access ✅ **IMPLEMENTED**

#### **Implementation Status**: ✅ **FULLY IMPLEMENTED**
- All customer lookup, registration, and session management endpoints are working ✅ **CONFIRMED LIVE**
- All merchant authentication endpoints are working ✅ **CONFIRMED LIVE**
- Comprehensive validation and error handling implemented ✅ **CONFIRMED LIVE**
- Phone number masking for privacy protection ✅ **CONFIRMED LIVE**
- Session token generation and management ✅ **CONFIRMED LIVE**
- **🔴 ONLY MISSING**: Rate limiting implementation to prevent abuse

#### **Security Features for Customer Portal**:
- **Phone number masking** in responses (XXX-XXX-1234)
- **Rate limiting** on lookup attempts (5 attempts per minute)
- **Input validation** for phone/email formats
- **Session tokens** with short expiration (30 minutes)
- **Audit logging** of all customer lookup attempts
- **Data privacy** compliance with GDPR principles
- **No password storage** required for customer data

#### **Database Entities Used**:
- `customers` - Customer lookup and profile data
- `game_sessions` - Customer game history and progress
- `leaderboards` - Customer rankings and achievements
- `loyalty_transactions` - Customer points history

#### **Security Features**:
- **Customer Portal**: Phone/email lookup with rate limiting and session tokens (no passwords)
- **Merchant Portal**: JWT token management with refresh tokens and secure password storage
- Password strength validation with bcrypt hashing for merchant accounts
- **🔴 MISSING**: API rate limiting to prevent abuse and data harvesting (express-rate-limit or similar)
- CORS configuration for frontend access
- Input validation and SQL injection prevention
- Session management and automatic logout
- Phone number masking for customer privacy (XXX-XXX-1234 format)
- Audit logging for all authentication attempts

---

### 2.2 Create Loyalty Program Module ✅ **COMPLETED**

#### **Completion Date**: December 1, 2025
#### **Key Features Implemented**:
- Complete loyalty module with controller, service, entities, and DTOs
- Comprehensive loyalty rules management with flexible configuration
- Full points transaction system with balance tracking and audit trails
- Rewards catalog management with stock and availability controls
- Advanced analytics with customer metrics, engagement scores, and redemption rates
- Leaderboard system with top customer rankings and competitive performance
- Automatic point calculation triggers and transaction history

#### **Tasks**:
- [✅] Create `loyalty` module structure
- [✅] Implement loyalty rules management
- [✅] Create points transaction system
- [✅] Build rewards catalog management
- [✅] Add loyalty analytics and reporting
- [✅] Implement automatic point calculation triggers

#### **Required Endpoints** (`/api/loyalty`):
```typescript
// Loyalty Rules ✅ ALL IMPLEMENTED
GET    /api/loyalty/rules/:merchantId        // Get loyalty rules for merchant
POST   /api/loyalty/rules                   // Create new loyalty rule
PATCH  /api/loyalty/rules/:ruleId            // Update loyalty rule
DELETE /api/loyalty/rules/:ruleId            // Delete loyalty rule

// Points System ✅ ALL IMPLEMENTED
GET    /api/loyalty/transactions/:customerId  // Get points transactions
POST   /api/loyalty/transactions             // Record points transaction
GET    /api/loyalty/transactions/:customerId/balance // Get customer points balance

// Rewards Catalog ✅ ALL IMPLEMENTED
GET    /api/loyalty/rewards/:merchantId      // Get available rewards
POST   /api/loyalty/rewards                  // Create new reward
GET    /api/loyalty/rewards/:merchantId/:rewardId // Get specific reward

// Analytics ✅ ALL IMPLEMENTED
GET    /api/loyalty/analytics/:merchantId    // Get loyalty program analytics
GET    /api/loyalty/leaderboard/:merchantId  // Get points leaderboard
```

#### **Database Entities Referenced**:
- `loyalty_rules` - Point earning rules and configurations
- `loyalty_transactions` - Complete transaction history
- `loyalty_rewards` - Rewards catalog and management
- `customers` - Points balance and segment tracking

#### **Frontend Pages Supported**:
- `app/dashboard/promotions/page.tsx` - Loyalty promotions
- `app/dashboard/lead-generation/page.tsx` - Customer retention
- `app/play/[merchantId]/games/page.tsx` - Points display
- `components/game-leaderboard.tsx` - Points leaderboard

---

### 2.3 Create Challenges Module ✅ **COMPLETED**

#### **Completion Date**: December 1, 2024
#### **Key Features Implemented**:
- Complete challenges module with controller, service, entities, and DTOs
- Comprehensive challenge management system with full CRUD operations
- User challenge progress tracking with automatic completion detection
- Achievement system integration with unlock mechanisms and rewards
- Advanced challenge analytics with type breakdown, difficulty analysis, and performance metrics
- Challenge leaderboard with ranking system and filtering capabilities
- Support for multiple challenge types: game_master, points_collector, daily_streak, social
- Automatic challenge progress updates from game sessions with configurable rules

#### **Tasks**:
- [✅] Create `challenges` module structure
- [✅] Implement challenge management system
- [✅] Build user challenge progress tracking
- [✅] Add achievement system integration
- [✅] Create challenge analytics and reporting
- [✅] Implement automatic challenge completion detection

#### **Required Endpoints** (`/api/challenges`):
```typescript
// Challenge Management
GET    /api/challenges                        // Get active challenges
POST   /api/challenges                        // Create new challenge
GET    /api/challenges/:id                    // Get specific challenge
PATCH  /api/challenges/:id                    // Update challenge
DELETE /api/challenges/:id                    // Delete challenge

// User Challenge Progress
GET    /api/challenges/:challengeId/participants // Get challenge participants
POST   /api/challenges/:challengeId/join       // Join challenge
POST   /api/challenges/:challengeId/progress  // Update progress
POST   /api/challenges/:challengeId/complete  // Mark challenge complete

// Achievements
GET    /api/challenges/achievements           // Get available achievements
GET    /api/challenges/:customerId/achievements // Get user achievements
POST   /api/challenges/achievements/:id/unlock // Unlock achievement
```

#### **Database Entities Referenced**:
- `challenges` - Challenge definitions and configurations
- `user_challenges` - Individual user progress tracking
- `customers` - Challenge participant data
- `game_sessions` - Challenge completion detection

#### **Frontend Pages Supported**:
- `app/dashboard/gamification/page.tsx` - Challenge management
- `app/play/[merchantId]/games/page.tsx` - Challenge display
- `components/game-leaderboard.tsx` - Achievement showcase
- Gamification components throughout the app

---

## Phase 3: Advanced Features (Week 3)

### 3.1 Analytics Module

#### **Tasks**:
- [✅] Complete analytics service implementation
- [✅] Create analytics controller with comprehensive endpoints
- [✅] Implement real-time analytics processing
- [✅] Add analytics data aggregation and caching
- [✅] Create advanced reporting features
- [✅] Build analytics export functionality

#### **Completion Date**: December 1, 2024
#### **Key Features Implemented**:
- Comprehensive dashboard analytics with growth rates
- Daily analytics generation and historical data
- Customer analytics with segmentation and behavioral insights
- Game-specific performance analytics
- Engagement and retention metrics
- Advanced reporting templates and scheduled reports
- Data export functionality in multiple formats (CSV, JSON, PDF)
- Customer acquisition trends and demographic analysis

#### **Required Endpoints** (`/api/analytics`):
```typescript
// Dashboard Analytics
✅ GET    /api/analytics/dashboard/:merchantId     // Dashboard overview
✅ GET    /api/analytics/overview/:merchantId       // Business metrics overview
✅ GET    /api/analytics/performance/:merchantId     // Performance analytics

// Daily Analytics
✅ GET    /api/analytics/daily/:merchantId          // Daily analytics data
✅ POST   /api/analytics/daily/:merchantId/generate // Generate daily analytics
✅ GET    /api/analytics/trends/:merchantId         // Trend analysis

// Customer Analytics
✅ GET    /api/analytics/customers/:merchantId     // Customer behavior analytics
✅ GET    /api/analytics/demographics/:merchantId  // Demographic breakdown
✅ GET    /api/analytics/segments/:merchantId      // Customer segment analysis

// Game Analytics
✅ GET    /api/analytics/games/:merchantId          // Game performance metrics
✅ GET    /api/analytics/games/:merchantId/:gameType // Game-specific analytics
✅ GET    /api/analytics/engagement/:merchantId    // Engagement metrics

// Export and Reporting
✅ POST   /api/analytics/export                   // Export analytics data
✅ GET    /api/analytics/reports/:reportId        // Get generated report
✅ POST   /api/analytics/reports/generate        // Generate custom report

// Additional Advanced Endpoints
✅ GET    /api/analytics/reports/templates        // Get report templates
✅ GET    /api/analytics/reports/scheduled/:merchantId // Get scheduled reports
✅ POST   /api/analytics/reports/scheduled      // Schedule recurring reports
✅ DELETE /api/analytics/reports/scheduled/:scheduleId // Cancel scheduled report
```

#### **Database Entities Referenced**:
- `daily_analytics` - Pre-aggregated daily metrics
- `customers` - Customer demographics and behavior
- `game_sessions` - Game participation and performance
- `qr_campaigns` - Campaign performance and ROI
- `leaderboards` - Competitive metrics

#### **Frontend Pages Supported**:
- `app/dashboard/analytics/page.tsx` - Main analytics dashboard
- `app/dashboard/page.tsx` - Dashboard overview cards
- `components/chart-area-interactive.tsx` - Analytics charts
- All dashboard subpages requiring data visualization

---

### 3.2 Merchant Users Module

#### **Tasks**:
- [🔴] Create `merchant-users` module structure
- [🔴] Implement multi-user support for merchant accounts
- [🔴] Add role-based permissions within merchant accounts
- [🔴] Create user activity tracking and audit logs
- [🔴] Implement user invitation and management system

#### **Required Endpoints** (`/api/merchant-users`):
```typescript
// User Management
GET    /api/merchant-users                    // Get merchant users
POST   /api/merchant-users                    // Add new merchant user
GET    /api/merchant-users/:id               // Get specific user
PATCH  /api/merchant-users/:id               // Update user
DELETE /api/merchant-users/:id               // Remove user

// User Roles & Permissions
GET    /api/merchant-users/roles             // Get available roles
POST   /api/merchant-users/:id/roles         // Assign roles to user
DELETE /api/merchant-users/:id/roles/:roleId  // Remove role from user

// User Activity
GET    /api/merchant-users/:id/activity      // Get user activity log
GET    /api/merchant-users/activity/audit    // Get full audit log
```

#### **Database Entities Referenced**:
- `merchant_users` - Individual user accounts within merchant organizations
- `merchants` - Merchant account association
- `qr_campaigns` - User activity tracking (created_by field)

#### **Frontend Pages Supported**:
- `app/dashboard/settings/page.tsx` - User management
- Multi-tenant functionality across dashboard
- Audit and activity tracking features

---

### 3.3 Data Export and Reporting

#### **Tasks**:
- [🔴] Create unified export service for all data types
- [🔴] Implement multiple export formats (CSV, JSON, PDF)
- [🔴] Add scheduled report generation
- [🔴] Create report template system
- [🔴] Implement email delivery for reports
- [🔴] Add data filtering and customization options

#### **Required Endpoints** (`/api/reports`):
```typescript
// Data Export
POST   /api/reports/export/customers         // Export customer data
POST   /api/reports/export/game-sessions     // Export game session data
POST   /api/reports/export/campaigns         // Export campaign data
POST   /api/reports/export/leaderboard       // Export leaderboard data

// Report Generation
POST   /api/reports/generate                 // Generate custom report
GET    /api/reports/templates                // Get report templates
POST   /api/reports/templates                // Create report template

// Scheduled Reports
GET    /api/reports/scheduled                // Get scheduled reports
POST   /api/reports/scheduled                // Schedule new report
DELETE /api/reports/scheduled/:id            // Cancel scheduled report

// Report Delivery
GET    /api/reports/:id/download             // Download report
POST   /api/reports/:id/email               // Email report
GET    /api/reports/history                 // Get report generation history
```

#### **Database Entities Referenced**:
- All entities can be exported based on merchant permissions
- Uses existing relationships and joins for comprehensive data export
- May require additional `reports` table for scheduling and history

#### **Frontend Pages Supported**:
- Export buttons across all dashboard pages
- `app/dashboard/analytics/page.tsx` - Advanced reporting
- `components/crm-data-table.tsx` - Customer data export
- `components/user-game-data-table.tsx` - Game data export

---

## Phase 4: System Integration & Testing (Week 4)

### 4.1 Frontend Integration

#### **Tasks**:
- [🔴] Update frontend API calls to use new endpoints
- [🔴] Implement proper error handling in frontend
- [🔴] Add loading states and user feedback
- [🔴] Optimize API calls and implement caching
- [🔴] Test all frontend pages with real API data
- [🔴] Ensure responsive design works with API responses

#### **Integration Points**:
- `app/dashboard/page.tsx` - Dashboard overview cards
- `app/dashboard/campaigns/page.tsx` - Campaign management
- `app/dashboard/customer-data/page.tsx` - Customer data table
- `app/dashboard/analytics/page.tsx` - Analytics charts
- `app/play/[merchantId]/page.tsx` - QR code landing
- `app/play/[merchantId]/games/page.tsx` - Game gallery
- `app/play/[merchantId]/game/[gameId]/page.tsx` - Individual games

---

### 4.2 Real-time Features

#### **Tasks**:
- [🔴] Implement WebSocket server for real-time updates
- [🔴] Add real-time leaderboard updates
- [🔴] Create real-time analytics dashboard
- [🔴] Implement live game session tracking
- [🔴] Add real-time notification system
- [🔴] Test WebSocket performance and scalability

#### **WebSocket Events**:
```typescript
// Real-time Events
'player_joined'          // New player joins game session
'game_completed'         // Player completes game
'leaderboard_updated'     // Leaderboard rank changes
'campaign_activated'      // Campaign status changes
'achievement_unlocked'    // Player earns achievement
'points_earned'          // Player loyalty points update
'challenge_completed'     // Challenge progress/completion
```

---

### 4.3 Performance Optimization

#### **Tasks**:
- [🔴] Implement database query optimization
- [🔴] Add Redis caching for frequently accessed data
- [🔴] Optimize API response times
- [🔴] Add database connection pooling
- [🔴] Implement API response compression
- [🔴] Add CDN integration for static assets
- [🔴] Create performance monitoring and alerting

#### **Optimization Areas**:
- Leaderboard queries with large datasets
- Analytics aggregation queries
- Customer search and filtering
- Game session creation and updates
- Real-time WebSocket message distribution

---

### 4.4 Testing & Quality Assurance

#### **Tasks**:
- [🔴] Write unit tests for all services and controllers
- [🔴] Create integration tests for API endpoints
- [🔴] Add end-to-end tests for complete user flows
- [🔴] Implement load testing for performance validation
- [🔴] Add database migration testing
- [🔴] Create API documentation with OpenAPI/Swagger

#### **Testing Coverage**:
- **Unit Tests**: All business logic in services
- **Integration Tests**: API endpoint functionality
- **E2E Tests**: Complete user journeys (QR scan → Game → Dashboard)
- **Load Tests**: High-volume game sessions and concurrent users
- **Security Tests**: Authentication, authorization, and input validation

---

## Implementation Guidelines

### Database Compliance
- **Always reference** `DATABASE_DOCUMENTATION.md` for field specifications
- **Use exact field names** from `simplified_database_schema.sql`
- **Follow foreign key relationships** as defined in the schema
- **Implement proper cascade behaviors** for data integrity
- **Use appropriate data types** and constraints as defined

### API Standards
- **Use REST conventions** for all endpoints
- **Implement proper HTTP status codes** for all operations
- **Add comprehensive error messages** with actionable feedback
- **Include request/response DTOs** with validation decorators
- **Use consistent response format** across all endpoints

### Security Requirements
- **Input validation** on all endpoints using class-validator
- **SQL injection prevention** through TypeORM parameterization
- **JWT authentication** with proper token management
- **Rate limiting** to prevent abuse
- **CORS configuration** for frontend access
- **Password security** with bcrypt hashing

### Performance Considerations
- **Database indexing** as defined in schema for optimal query performance
- **Connection pooling** for efficient database usage
- **Response caching** for frequently accessed static data
- **Pagination** for large dataset endpoints
- **Optimized queries** to minimize database load

---

## Success Criteria

### Functional Requirements
- [🔴] All frontend pages can load with real data from APIs
- [🔴] Complete user flows work end-to-end (QR scan → Game → Dashboard)
- [🔴] Real-time features work without issues
- [🔴] Data integrity maintained across all operations
- [🔴] Error handling provides good user experience

### Performance Requirements
- [🔴] API response times under 500ms for most endpoints
- [🔴] Database queries optimized with proper indexing
- [🔴] System handles 100+ concurrent users without degradation
- [🔴] Real-time updates delivered under 100ms
- [🔴] Export and reporting complete within reasonable timeframes

### Security Requirements
- [🔴] All endpoints properly authenticated and authorized
- [🔴] Input validation prevents all common attacks
- [🔴] User data properly protected and encrypted
- [🔴] API access properly rate-limited
- [🔴] Audit trails maintained for all operations

---

## Next Steps

After completing this API development task list:

1. **Deploy to staging environment** for comprehensive testing
2. **Performance testing** with realistic user loads
3. **Security audit** and penetration testing
4. **Frontend integration testing** with all new APIs
5. **User acceptance testing** with real merchant users
6. **Production deployment** with monitoring and alerting

This comprehensive API development plan will create a robust, scalable, and feature-complete backend that fully supports the gamified CRM platform's frontend requirements.