import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThan, LessThan, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Customer } from '../../entities/customer.entity';
import { GameSession } from '../../entities/game-session.entity';
import { Leaderboard } from '../../entities/leaderboard.entity';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerLookupDto,
  CustomerSearchDto,
  UpdateCustomerSegmentDto,
  CustomerSegment
} from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(GameSession)
    private gameSessionsRepository: Repository<GameSession>,
    @InjectRepository(Leaderboard)
    private leaderboardRepository: Repository<Leaderboard>,
  ) {}

  // Customer CRUD Operations
  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customersRepository.create(createCustomerDto);

    // Calculate initial engagement score based on available data
    customer.engagement_score = this.calculateEngagementScore(customer);

    // Set initial segment
    customer.customer_segment = CustomerSegment.NEW;

    return await this.customersRepository.save(customer);
  }

  async findAll(merchant_id: string): Promise<Customer[]> {
    return await this.customersRepository.find({
      where: { merchant_id, is_active: true },
      order: { created_at: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customersRepository.findOne({
      where: { id },
      relations: ['merchant', 'game_sessions']
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);

    Object.assign(customer, updateCustomerDto);

    // Recalculate engagement score if relevant fields changed
    if (updateCustomerDto.total_points !== undefined ||
        updateCustomerDto.customer_segment !== undefined) {
      customer.engagement_score = this.calculateEngagementScore(customer);
    }

    // Update segment if not explicitly provided
    if (!updateCustomerDto.customer_segment) {
      customer.customer_segment = this.calculateCustomerSegment(customer);
    }

    return await this.customersRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    customer.is_active = false;
    await this.customersRepository.save(customer);
  }

  // Customer Lookup for Authentication
  async lookupCustomer(lookupDto: CustomerLookupDto): Promise<Customer | null> {
    const { merchant_id, phoneOrEmail } = lookupDto;

    // Check if it's an email or phone number
    const isEmail = phoneOrEmail.includes('@');

    const customer = await this.customersRepository.findOne({
      where: [
        { merchant_id, phone: phoneOrEmail, is_active: true },
        { merchant_id, email: phoneOrEmail, is_active: true }
      ],
      relations: ['leaderboards']
    });

    if (!customer) {
      return null;
    }

    // Mask phone number for privacy
    if (customer.phone) {
      customer.phone = this.maskPhoneNumber(customer.phone);
    }

    return customer;
  }

  // Customer Search and Filtering
  async searchCustomers(searchDto: CustomerSearchDto): Promise<{
    customers: Customer[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      merchant_id,
      query,
      segment,
      min_points,
      max_points,
      is_active,
      page = 1,
      limit = 10
    } = searchDto;

    const where: any = { merchant_id };

    if (is_active !== undefined) {
      where.is_active = is_active;
    } else {
      where.is_active = true; // Default to active customers
    }

    if (segment) {
      where.customer_segment = segment;
    }

    if (min_points !== undefined || max_points !== undefined) {
      if (min_points !== undefined && max_points !== undefined) {
        where.total_points = Between(min_points, max_points);
      } else if (min_points !== undefined) {
        where.total_points = MoreThanOrEqual(min_points);
      } else if (max_points !== undefined) {
        where.total_points = LessThanOrEqual(max_points);
      }
    }

    if (query) {
      // For simple search, we'll use name as primary search field
      where.name = Like(`%${query}%`);
    }

    const [customers, total] = await this.customersRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' as any }
    });

    // Mask phone numbers for privacy
    customers.forEach(customer => {
      if (customer.phone) {
        customer.phone = this.maskPhoneNumber(customer.phone);
      }
    });

    return {
      customers,
      total,
      page,
      limit
    };
  }

  // Customer History and Analytics
  async getCustomerHistory(id: string): Promise<{
    customer: Customer;
    game_sessions: GameSession[];
    achievements: Leaderboard[];
  }> {
    const customer = await this.findOne(id);

    const game_sessions = await this.gameSessionsRepository.find({
      where: { customer_id: id },
      order: { started_at: 'DESC' },
      take: 50 // Limit to recent 50 sessions
    });

    const achievements = await this.leaderboardRepository.find({
      where: { customer_id: id },
      order: { updated_at: 'DESC' },
      take: 20 // Limit to recent 20 achievements
    });

    return {
      customer,
      game_sessions,
      achievements
    };
  }

  async getCustomerAchievements(id: string): Promise<Leaderboard[]> {
    const achievements = await this.leaderboardRepository.find({
      where: { customer_id: id },
      order: { updated_at: 'DESC' }
    });

    return achievements;
  }

  // Customer Segmentation Management
  async updateCustomerSegment(id: string, segmentDto: UpdateCustomerSegmentDto): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.customer_segment = segmentDto.customer_segment;
    customer.engagement_score = this.calculateEngagementScore(customer);

    return await this.customersRepository.save(customer);
  }

  async getCustomerSegments(merchant_id: string): Promise<{
    segment: CustomerSegment;
    count: number;
    avg_points: number;
    avg_engagement: number;
  }[]> {
    const segments = Object.values(CustomerSegment);
    const segmentData: {
      segment: CustomerSegment;
      count: number;
      avg_points: number;
      avg_engagement: number;
    }[] = [];

    for (const segment of segments) {
      const customers = await this.customersRepository.find({
        where: { merchant_id, customer_segment: segment, is_active: true }
      });

      const count = customers.length;
      const avg_points = count > 0 ?
        customers.reduce((sum, c) => sum + c.total_points, 0) / count : 0;
      const avg_engagement = count > 0 ?
        customers.reduce((sum, c) => sum + c.engagement_score, 0) / count : 0;

      segmentData.push({
        segment,
        count,
        avg_points: Math.round(avg_points * 100) / 100,
        avg_engagement: Math.round(avg_engagement * 100) / 100
      });
    }

    return segmentData;
  }

  // Customer Analytics
  async getCustomerAnalytics(merchant_id: string): Promise<{
    total_customers: number;
    active_customers: number;
    new_customers_this_month: number;
    average_engagement_score: number;
    top_customers_by_points: Customer[];
    segment_breakdown: any[];
  }> {
    const total_customers = await this.customersRepository.count({
      where: { merchant_id, is_active: true }
    });

    const thirty_days_ago = new Date();
    thirty_days_ago.setDate(thirty_days_ago.getDate() - 30);

    const new_customers_this_month = await this.customersRepository.count({
      where: {
        merchant_id,
        created_at: MoreThan(thirty_days_ago),
        is_active: true
      }
    });

    const active_customers = await this.customersRepository.count({
      where: {
        merchant_id,
        last_play_date: MoreThan(thirty_days_ago),
        is_active: true
      }
    });

    const all_customers = await this.customersRepository.find({
      where: { merchant_id, is_active: true },
      select: ['engagement_score']
    });

    const average_engagement_score = all_customers.length > 0 ?
      all_customers.reduce((sum, c) => sum + c.engagement_score, 0) / all_customers.length : 0;

    const top_customers_by_points = await this.customersRepository.find({
      where: { merchant_id, is_active: true },
      order: { total_points: 'DESC' },
      take: 10
    });

    const segment_breakdown = await this.getCustomerSegments(merchant_id);

    return {
      total_customers,
      active_customers,
      new_customers_this_month,
      average_engagement_score: Math.round(average_engagement_score * 100) / 100,
      top_customers_by_points,
      segment_breakdown
    };
  }

  // Customer Export
  async exportCustomers(merchant_id: string, format: 'csv' | 'json' = 'csv'): Promise<any> {
    const customers = await this.customersRepository.find({
      where: { merchant_id, is_active: true },
      order: { created_at: 'DESC' }
    });

    // Mask phone numbers for export
    const exportData = customers.map(customer => ({
      ...customer,
      phone: this.maskPhoneNumber(customer.phone)
    }));

    if (format === 'json') {
      return exportData;
    }

    // CSV format would require additional CSV parsing logic
    // For now, return the data that can be converted to CSV
    return exportData;
  }

  // Private Helper Methods
  private calculateEngagementScore(customer: Customer): number {
    let score = 0;

    // Base score from total games played
    score += Math.min(customer.games_played * 2, 40); // Max 40 points from games

    // Points contribution (capped at 30 points)
    score += Math.min(customer.total_points / 100, 30);

    // Recent activity bonus
    if (customer.last_play_date) {
      const daysSinceLastPlay = Math.floor(
        (Date.now() - customer.last_play_date.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastPlay <= 7) score += 20; // Played in last week
      else if (daysSinceLastPlay <= 30) score += 10; // Played in last month
    }

    // Profile completeness bonus
    const profileFields = [customer.email, customer.instagram, customer.age_group, customer.gender, customer.location];
    const filledFields = profileFields.filter(field => field && field.trim() !== '').length;
    score += (filledFields / profileFields.length) * 10; // Max 10 points

    return Math.round(score * 100) / 100;
  }

  private calculateCustomerSegment(customer: Customer): CustomerSegment {
    const engagementScore = customer.engagement_score;
    const daysSinceLastPlay = customer.last_play_date ?
      Math.floor((Date.now() - customer.last_play_date.getTime()) / (1000 * 60 * 60 * 24)) : 999;

    if (engagementScore >= 70 && daysSinceLastPlay <= 30) {
      return CustomerSegment.LOYAL;
    } else if (engagementScore >= 50 && daysSinceLastPlay <= 60) {
      return CustomerSegment.ACTIVE;
    } else if (daysSinceLastPlay <= 7 && customer.games_played <= 3) {
      return CustomerSegment.NEW;
    } else if (daysSinceLastPlay > 90 && engagementScore < 30) {
      return CustomerSegment.AT_RISK;
    } else if (daysSinceLastPlay > 180) {
      return CustomerSegment.INACTIVE;
    } else {
      return CustomerSegment.ACTIVE;
    }
  }

  private maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 4) return phone;

    const lastFour = phone.slice(-4);
    const maskedPart = '*'.repeat(Math.max(0, phone.length - 4));

    return maskedPart + lastFour;
  }
}
