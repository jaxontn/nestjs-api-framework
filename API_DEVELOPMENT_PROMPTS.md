# API Development Prompts - Gamified CRM Platform

## Overview

This document contains ready-to-use prompts for starting and continuing API development work. These prompts reference the comprehensive task list in `API_DEVELOPMENT_TODO.md` and ensure proper progress tracking.

**References**:
- Task List: `api/API_DEVELOPMENT_TODO.md`
- Database Schema: `gaming_crm_nextjs/DATABASE_DOCUMENTATION.md`
- SQL Schema: `gaming_crm_nextjs/simplified_database_schema.sql`
- DBML Architecture: `gaming_crm_nextjs/simplified_database_architecture.dbml`

---

## 🚀 **Start API Development Prompts**

### **To Start a Specific Phase/Module:**

**Phase 1 - Critical APIs:**
```
Please start Phase 1 of the API development by implementing the Games Module. Create the games.controller.ts with all required endpoints, add proper DTOs, and implement the business logic. Follow the DATABASE_DOCUMENTATION.md and simplified_database_schema.sql for exact field names and relationships. Update the progress tracking in API_DEVELOPMENT_TODO.md as you complete each task.
```

**Phase 1.1 - Games Module:**
```
Please implement the Games Module API by creating the games.controller.ts with all endpoints for game sessions, settings, prizes, and leaderboards. Reference the game_sessions, game_settings, game_prizes, and leaderboards entities from the database schema. Update the API_DEVELOPMENT_TODO.md file with ✅ status for completed tasks.
```

**Phase 1.2 - QR Campaigns Module:**
```
Please create the QR Campaigns Module from scratch. Implement the qr-campaigns.service.ts with full business logic, create qr-campaigns.controller.ts with all CRUD operations, add DTOs for campaign management, and implement QR code generation logic. Update progress tracking in the task list.
```

**Phase 1.3 - Customers Module:**
```
Please complete the Customers Module by implementing the customers.service.ts with full CRUD operations, creating customers.controller.ts with all endpoints, adding customer segmentation logic, and implementing customer search/export functionality. Update API_DEVELOPMENT_TODO.md with ✅ status for completed tasks.
```

### **To Continue from Current Progress:**
```
Please continue with the API development from where we left off. Check the current status in API_DEVELOPMENT_TODO.md and start working on the next 🔴 NOT STARTED module. Update the progress markers to 🟡 IN PROGRESS as you begin and ✅ COMPLETED when finished.
```

### **To Work on Specific Tasks:**

**Customer Portal Authentication:**
```
Please implement the customer lookup endpoints for the customer portal authentication. Focus on:
- POST /api/customers/lookup for phone/email identification
- GET /api/customers/lookup/:phoneOrEmail for customer retrieval
- Phone number masking (XXX-XXX-1234 format)
- Rate limiting and session management
- No passwords required - just lookup existing customers
Update the progress tracking in API_DEVELOPMENT_TODO.md.
```

**Games Module - Controller Endpoints:**
```
Please create the games.controller.ts with these endpoints:
- POST /api/games/sessions/start - Start new game session
- POST /api/games/sessions/:sessionId/complete - Complete game session
- GET /api/games/sessions/merchant/:merchantId - Get sessions by merchant
- GET /api/games/settings/:merchantId - Get game settings
- GET /api/games/leaderboard/:merchantId - Get leaderboard
Add proper DTOs with validation decorators and update progress tracking.
```

**QR Campaigns Module - Complete Implementation:**
```
Please implement the complete QR Campaigns Module:
- Create qr-campaigns.module.ts, qr-campaigns.service.ts, qr-campaigns.controller.ts
- Add all CRUD endpoints for campaign management
- Implement QR code generation logic
- Add campaign status management (draft/active/expired)
- Include campaign analytics and reporting endpoints
Reference the qr_campaigns entity and update task list progress.
```

### **Authentication System Implementation:**

**Customer Authentication (Phone/Email Lookup):**
```
Please implement the customer portal authentication system without passwords:
- POST /api/customers/lookup for customer identification
- GET /api/customers/lookup/:phoneOrEmail for direct lookup
- Session management without passwords
- Phone number masking for privacy (XXX-XXX-1234)
- Rate limiting and input validation
- Customer registration for first-time players
Update API_DEVELOPMENT_TODO.md with ✅ status.
```

**Merchant Authentication (Traditional):**
```
Please implement the merchant portal authentication with JWT:
- POST /api/auth/login - Merchant login with password
- POST /api/auth/register - Merchant registration
- POST /api/auth/refresh - Token refresh
- Password hashing with bcrypt
- JWT token management with refresh tokens
- Password reset and change functionality
Update progress tracking in task list.
```

### **Phase 2 - Core Features:**

**Loyalty Program Module:**
```
Please create the complete Loyalty Program Module:
- Implement loyalty rules management
- Create points transaction system
- Build rewards catalog management
- Add loyalty analytics and reporting
- Implement automatic point calculation triggers
Reference loyalty_rules, loyalty_transactions, and loyalty_rewards entities.
```

**Challenges Module:**
```
Please implement the Challenges Module with:
- Challenge management system
- User challenge progress tracking
- Achievement system integration
- Challenge analytics and reporting
- Automatic challenge completion detection
Reference challenges and user_challenges entities.
```

**Analytics Module:**
```
Please complete the Analytics Module implementation:
- Create analytics controller with comprehensive endpoints
- Implement real-time analytics processing
- Add analytics data aggregation and caching
- Create advanced reporting features
- Build analytics export functionality
Reference daily_analytics entity and related tables.
```

### **To Test Implemented APIs:**

**Comprehensive API Testing:**
```
Please test all the newly implemented API endpoints and ensure they work correctly with the database. Verify that:
- All CRUD operations function properly
- Responses match expected formats
- Database relationships are maintained
- Error handling works correctly
- Input validation prevents invalid data
- Authentication and authorization work as expected
Update API_DEVELOPMENT_TODO.md with ✅ for tested endpoints.
```

**Database Integration Testing:**
```
Please test the implemented APIs against the MySQL database to ensure:
- All queries use correct field names from simplified_database_schema.sql
- Foreign key relationships work properly
- Data integrity is maintained
- Indexes are being used correctly
- Performance is acceptable with realistic data volumes
```

### **Complete Development Session Prompts:**

**After completing work:**
```
Please update the API_DEVELOPMENT_TODO.md file to mark all completed tasks with ✅ status and add today's date to the finished items. Also update any module status from 🔴 to 🟡 or ✅ as appropriate.
```

**End of Development Session:**
```
Please provide a summary of what was accomplished in this session:
- Which modules/endpoints were completed
- Any issues or blockers encountered
- Current overall progress percentage
- Next steps for the following session
Update the API_DEVELOPMENT_TODO.md accordingly.
```

**Phase Completion:**
```
Please mark the completed phase as done in API_DEVELOPMENT_TODO.md and provide recommendations for the next phase. Include:
- Summary of all completed work
- Test results and any issues found
- Updated progress tracking with ✅ status
- Readiness assessment for the next phase
```

## 📋 **Quick Reference Commands:**

### **High-Level Commands:**

- **Start Phase 1**: "Begin Phase 1 API development - implement Games, QR Campaigns, and Customers modules"
- **Start Phase 2**: "Begin Phase 2 API development - implement Authentication, Loyalty, and Challenges modules"
- **Start Phase 3**: "Start Phase 3 API development - implement Analytics, Merchant Users, and Export features"
- **Continue work**: "Continue API development from current progress, update task list with completed items"
- **Test endpoints**: "Test the implemented APIs and update progress tracking"
- **Update status**: "Update API_DEVELOPMENT_TODO.md with current completion status"

### **Module-Specific Commands:**

- **Games Module**: "Implement Games Module API with sessions, settings, prizes, and leaderboards"
- **QR Campaigns**: "Create QR Campaigns Module with CRUD operations and QR code generation"
- **Customers**: "Complete Customers Module with CRUD, search, segmentation, and export"
- **Authentication**: "Implement customer portal authentication (phone/email lookup) and merchant portal authentication (JWT)"
- **Loyalty**: "Build Loyalty Program Module with rules, transactions, and rewards"
- **Challenges**: "Create Challenges Module with progress tracking and achievements"
- **Analytics**: "Complete Analytics Module with dashboard metrics and reporting"

### **Task-Specific Commands:**

- **Database Setup**: "Set up database connections and TypeORM entities for the new module"
- **Controller Creation**: "Create the controller with all required endpoints and DTOs"
- **Service Implementation**: "Implement the service layer with business logic and database operations"
- **Testing**: "Test the module endpoints and update progress tracking with ✅ status"
- **Documentation**: "Update API_DEVELOPMENT_TODO.md with completion status and notes"

## 🎯 **Pro Tips for Effective Prompts:**

### **Always Include These Elements:**

1. **Reference Database Schema**: Mention DATABASE_DOCUMENTATION.md and simplified_database_schema.sql
2. **Progress Tracking**: Remind to update API_DEVELOPMENT_TODO.md with status markers
3. **Field Accuracy**: Emphasize using exact field names from the database schema
4. **Relationship Compliance**: Follow foreign key relationships and cascade behaviors
5. **Status Updates**: Change 🔴 → 🟡 → ✅ as work progresses

### **Best Practices:**

- **Be Specific**: Mention exact endpoints, entity names, and field requirements
- **Include Validation**: Remind about DTOs with validation decorators
- **Error Handling**: Include proper error handling and HTTP status codes
- **Testing**: Always include testing as part of the implementation task
- **Security**: Include authentication, authorization, and input validation

### **Example Comprehensive Prompt:**

```
Please implement the complete Games Module API by:

1. Creating games.controller.ts with all endpoints:
   - POST /api/games/sessions/start
   - POST /api/games/sessions/:sessionId/complete
   - GET /api/games/sessions/merchant/:merchantId
   - GET /api/games/settings/:merchantId
   - GET /api/games/prizes/:merchantId
   - GET /api/games/leaderboard/:merchantId

2. Implementing games.service.ts with business logic for:
   - Game session creation and completion
   - Score calculation and points awarding
   - Prize distribution logic
   - Leaderboard ranking updates

3. Adding proper DTOs with validation:
   - CreateGameSessionDto
   - CompleteGameSessionDto
   - GameSettingsDto
   - PrizeConfigurationDto

4. Following the exact field names from:
   - game_sessions table (customer_id, game_type, points_earned, etc.)
   - game_settings table (merchant_id, game_type, configuration, etc.)
   - game_prizes table (merchant_id, prize_type, prize_value, etc.)

5. Update API_DEVELOPMENT_TODO.md:
   - Mark Games Module tasks as ✅ when completed
   - Change status from 🔴 to 🟡 during implementation
   - Add completion notes and any blockers encountered

Reference DATABASE_DOCUMENTATION.md for detailed entity relationships and simplified_database_schema.sql for exact field specifications.
```

Use these prompts to efficiently guide API development while maintaining proper progress tracking and database compliance!