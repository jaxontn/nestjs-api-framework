import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from './entities/merchant.entity';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-connection')
  async testConnection(): Promise<any> {
    try {
      // Test basic database query
      const count = await this.merchantRepository.count();

      return {
        success: true,
        message: 'Database connection successful!',
        database: {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_DATABASE,
          connected: true,
          merchantsCount: count
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Database connection failed',
        error: error.message,
        database: {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_DATABASE,
          connected: false
        },
        timestamp: new Date().toISOString()
      };
    }
  }
}
