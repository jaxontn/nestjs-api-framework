# Gaming CRM NestJS API

This is the backend API service for the Gaming CRM platform, built with NestJS, TypeORM, and MySQL.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Set up the database**
   ```bash
   # Create the database
   mysql -u root -p
   CREATE DATABASE gamified_crm;

   # Import the schema
   mysql -u root -p gamified_crm < ../simplified_database_schema.sql
   ```

4. **Start the development server**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3001/api`

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Available Endpoints

#### Merchants
- `GET /api/merchants` - Get all merchants
- `GET /api/merchants/:id` - Get merchant by ID
- `POST /api/merchants` - Create new merchant
- `PATCH /api/merchants/:id` - Update merchant
- `DELETE /api/merchants/:id` - Delete merchant

#### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/merchant/:merchantId` - Get customers by merchant
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer by ID
- `PATCH /api/customers/:id` - Update customer

#### Games
- `GET /api/games/sessions/merchant/:merchantId` - Get game sessions by merchant
- `POST /api/games/sessions` - Create new game session
- `GET /api/games/leaderboard/:merchantId` - Get leaderboard by merchant
- `GET /api/games/settings/:merchantId` - Get game settings by merchant
- `GET /api/games/prizes/:merchantId` - Get game prizes by merchant

#### Analytics
- `GET /api/analytics/dashboard/:merchantId` - Get dashboard analytics
- `GET /api/analytics/daily/:merchantId` - Get daily analytics
- `GET /api/analytics/campaigns/:merchantId` - Get campaign analytics

## 🏗️ Project Structure

```
src/
├── config/                 # Configuration files
│   ├── app.config.ts      # App configuration
│   └── database.config.ts # Database configuration
├── entities/              # TypeORM entities
│   ├── merchant.entity.ts
│   ├── customer.entity.ts
│   ├── game-session.entity.ts
│   └── ...
├── modules/               # Feature modules
│   ├── merchants/
│   ├── customers/
│   ├── games/
│   └── analytics/
├── app.module.ts         # Root module
├── main.ts              # Application bootstrap
└── ...
```

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=gamified_crm
DB_SYNCHRONIZE=false
DB_LOGGING=true

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🗄️ Database Schema

The API uses the following main tables:

- `merchants` - Business accounts
- `customers` - Customer profiles with engagement tracking
- `game_sessions` - Individual game play sessions
- `qr_campaigns` - Marketing campaigns
- `leaderboards` - Player rankings
- `loyalty_*` - Loyalty system tables
- `challenges` - Gamification challenges

See `../simplified_database_schema.sql` for the complete schema.

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## 🛠️ Development

### Adding New Modules

```bash
# Generate a new module
npx nest generate module modules/module-name
npx nest generate controller modules/module-name
npx nest generate service modules/module-name
```

### Database Migrations

```bash
# Generate migration
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

## 🚀 Deployment

### Building for Production

```bash
# Build the application
npm run build

# Start in production mode
npm run start:prod
```

### Docker

```bash
# Build Docker image
docker build -t gaming-crm-api .

# Run container
docker run -p 3001:3001 --env-file .env gaming-crm-api
```

## 🔒 Security

- JWT authentication (to be implemented)
- Input validation with class-validator
- SQL injection prevention via TypeORM
- CORS configuration
- Environment variable management

## 📝 API Response Format

All API responses follow this format:

```json
{
  "data": {},
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the database schema documentation