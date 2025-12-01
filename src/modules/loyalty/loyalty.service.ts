import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, Like } from 'typeorm';
import { Customer } from '../../entities/customer.entity';
import { Merchant } from '../../entities/merchant.entity';
import { LoyaltyRule } from './entities/loyalty-rule.entity';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';
import { LoyaltyReward } from './entities/loyalty-reward.entity';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    @InjectRepository(LoyaltyRule)
    private readonly loyaltyRuleRepository: Repository<LoyaltyRule>,
    @InjectRepository(LoyaltyTransaction)
    private readonly loyaltyTransactionRepository: Repository<LoyaltyTransaction>,
    @InjectRepository(LoyaltyReward)
    private readonly loyaltyRewardRepository: Repository<LoyaltyReward>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  // Loyalty Rules Management
  async getLoyaltyRules(merchantId: string): Promise<any> {
    try {
      if (!merchantId || !merchantId.trim()) {
        throw new BadRequestException('Merchant ID is required');
      }

      // Verify merchant exists
      const merchant = await this.merchantRepository.findOne({
        where: { id: merchantId },
      });

      if (!merchant) {
        throw new NotFoundException('Merchant not found');
      }

      const rules = await this.loyaltyRuleRepository.find({
        where: {
          merchant_id: merchantId,
          is_active: true
        },
        order: { created_at: 'DESC' },
      });

      return {
        success: true,
        message: 'Loyalty rules retrieved successfully',
        data: rules.map(rule => ({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          rule_type: rule.rule_type,
          points_per_dollar: rule.points_per_dollar,
          min_points_required: rule.min_points_required,
          multiplier: rule.multiplier,
          max_points_per_day: rule.max_points_per_day,
          validity_days: rule.validity_days,
          is_active: rule.is_active,
          applies_to_new_customers_only: rule.applies_to_new_customers_only,
          target_audience: rule.target_audience,
          customer_segment_filter: rule.customer_segment_filter,
          start_date: rule.start_date,
          end_date: rule.end_date,
          created_by: rule.created_by,
          created_at: rule.created_at,
          updated_at: rule.updated_at,
        })),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get loyalty rules failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createLoyaltyRule(createRuleData: any): Promise<any> {
    try {
      // Validate required fields
      const { name, rule_type, points_per_dollar } = createRuleData;
      const merchantId = createRuleData.merchant_id;

      if (!name || !name.trim()) {
        throw new BadRequestException('Rule name is required');
      }

      if (!rule_type || !rule_type.trim()) {
        throw new BadRequestException('Rule type is required');
      }

      if (points_per_dollar === undefined || points_per_dollar < 0) {
        throw new BadRequestException('Points per dollar must be a positive number');
      }

      // Verify merchant exists
      const merchant = await this.merchantRepository.findOne({
        where: { id: merchantId },
      });

      if (!merchant) {
        throw new NotFoundException('Merchant not found');
      }

      // Create new loyalty rule
      const rule = this.loyaltyRuleRepository.create({
        id: `rule_${merchantId}_${Date.now()}`,
        merchant_id: merchantId,
        name: name.trim(),
        rule_type: rule_type,
        points_per_dollar: points_per_dollar,
        rule_config: createRuleData.rule_config || {},
        min_points_required: createRuleData.min_points_required || 0,
        multiplier: createRuleData.multiplier || 1,
        max_points_per_day: createRuleData.max_points_per_day || 100,
        validity_days: createRuleData.validity_days || 365,
        target_audience: createRuleData.target_audience || null,
        customer_segment_filter: createRuleData.customer_segment_filter || 'all',
        created_by: createRuleData.created_by || 'system',
      });

      const savedRule = await this.loyaltyRuleRepository.save(rule);

      this.logger.log(`Loyalty rule created: ${savedRule.id} for merchant ${merchantId}`);

      return {
        success: true,
        message: 'Loyalty rule created successfully',
        data: {
          rule_id: savedRule.id,
          name: savedRule.name,
          rule_type: savedRule.rule_type,
          points_per_dollar: savedRule.points_per_dollar,
          min_points_required: savedRule.min_points_required,
          multiplier: savedRule.multiplier,
          max_points_per_day: savedRule.max_points_per_day,
          validity_days: savedRule.validity_days,
          is_active: true,
          created_at: savedRule.created_at,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Create loyalty rule failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateLoyaltyRule(ruleId: string, updateData: any): Promise<any> {
    try {
      if (!ruleId || !ruleId.trim()) {
        throw new BadRequestException('Rule ID is required');
      }

      const merchantId = updateData.merchant_id;

      const rule = await this.loyaltyRuleRepository.findOne({
        where: { id: ruleId, merchant_id: merchantId },
      });

      if (!rule) {
        throw new NotFoundException('Loyalty rule not found');
      }

      // Update rule
      Object.assign(rule, updateData);
      const updatedRule = await this.loyaltyRuleRepository.save(rule);

      this.logger.log(`Loyalty rule updated: ${ruleId}`);

      return {
        success: true,
        message: 'Loyalty rule updated successfully',
        data: {
          rule_id: updatedRule.id,
          name: updatedRule.name,
          rule_type: updatedRule.rule_type,
          updated_at: updatedRule.updated_at,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Update loyalty rule failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteLoyaltyRule(ruleId: string): Promise<any> {
    try {
      if (!ruleId || !ruleId.trim()) {
        throw new BadRequestException('Rule ID is required');
      }

      const rule = await this.loyaltyRuleRepository.findOne({
        where: { id: ruleId },
      });

      if (!rule) {
        throw new NotFoundException('Loyalty rule not found');
      }

      // Soft delete by setting is_active to false
      rule.is_active = false;
      rule.updated_at = new Date();
      await this.loyaltyRuleRepository.save(rule);

      this.logger.log(`Loyalty rule deactivated: ${ruleId}`);

      return {
        success: true,
        message: 'Loyalty rule deleted successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Delete loyalty rule failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Points Transaction System
  async getPointsTransactions(customerId: string, merchantId: string): Promise<any> {
    try {
      const transactions = await this.loyaltyTransactionRepository.find({
        where: { customer_id: customerId },
        order: { created_at: 'DESC' },
        take: 100,
      });

      return {
        success: true,
        message: 'Points transactions retrieved successfully',
        data: transactions.map(transaction => ({
          id: transaction.id,
          transaction_type: transaction.transaction_type,
          points_change: transaction.points_change,
          balance_before: transaction.balance_before,
          balance_after: transaction.balance_after,
          description: transaction.description,
          reference_id: transaction.reference_id,
          reward_id: transaction.reward_id,
          metadata: transaction.metadata,
          created_at: transaction.created_at,
        })),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get points transactions failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async recordPointsTransaction(transactionData: any): Promise<any> {
    try {
      const { customer_id, points_change, description, reference_id, reward_id } = transactionData;

      if (!customer_id || !customer_id.trim()) {
        throw new BadRequestException('Customer ID is required');
      }

      const customer = await this.customerRepository.findOne({
        where: { id: customer_id },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      // Get current balance
      const currentBalance = customer.total_points;

      // Create transaction record
      const transaction = this.loyaltyTransactionRepository.create({
        id: `transaction_${customer_id}_${Date.now()}`,
        customer_id: customer_id,
        transaction_type: 'earned',
        points_change: transactionData.points_change || 0,
        balance_before: currentBalance,
        balance_after: currentBalance + (transactionData.points_change || 0),
        description: description || 'Points earned',
        reference_id: reference_id || null,
        reward_id: reward_id || null,
        metadata: transactionData.metadata || {},
      });

      // Update customer's total points
      customer.total_points = transaction.balance_after;

      // Save both records
      await this.loyaltyTransactionRepository.save(transaction);
      await this.customerRepository.save(customer);

      this.logger.log(`Points transaction recorded: ${transaction.id} for customer ${customer_id}`);

      return {
        success: true,
        message: 'Points transaction recorded successfully',
        data: {
          transaction_id: transaction.id,
          balance_after: transaction.balance_after,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Record points transaction failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Rewards Catalog Management
  async getRewardsCatalog(merchantId: string): Promise<any> {
    try {
      if (!merchantId || !merchantId.trim()) {
        throw new BadRequestException('Merchant ID is required');
      }

      const rewards = await this.loyaltyRewardRepository.find({
        where: {
          merchant_id: merchantId,
          is_active: true
        },
        order: { points_cost: 'ASC' },
      });

      return {
        success: true,
        message: 'Rewards catalog retrieved successfully',
        data: rewards.map(reward => ({
          id: reward.id,
          name: reward.name,
          description: reward.description,
          points_cost: reward.points_cost,
          stock_quantity: reward.stock_quantity,
          quantity_redeemed: reward.quantity_redeemed,
          available_from: reward.available_from,
          available_until: reward.available_until,
          target_audience: reward.target_audience,
          customer_segment_filter: reward.customer_segment_filter,
          created_by: reward.created_by,
          is_active: reward.is_active,
          created_at: reward.created_at,
          updated_at: reward.updated_at,
        })),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get rewards catalog failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createReward(createRewardData: any): Promise<any> {
    try {
      const { name, description, points_cost, stock_quantity, available_from, available_until } = createRewardData;
      const merchantId = createRewardData.merchant_id;

      if (!name || !name.trim()) {
        throw new BadRequestException('Reward name is required');
      }

      if (!points_cost || points_cost < 0) {
        throw new BadRequestException('Points cost must be a positive number');
      }

      if (!stock_quantity || stock_quantity < 0) {
        throw new BadRequestException('Stock quantity must be a positive number');
      }

      // Verify merchant exists
      const merchant = await this.merchantRepository.findOne({
        where: { id: merchantId },
      });

      if (!merchant) {
        throw new NotFoundException('Merchant not found');
      }

      // Create new reward
      const reward = this.loyaltyRewardRepository.create({
        id: `reward_${merchantId}_${Date.now()}`,
        merchant_id: merchantId,
        name: name.trim(),
        description: description || null,
        points_cost: points_cost,
        stock_quantity: stock_quantity,
        available_from: available_from || null,
        available_until: available_until || null,
        created_by: createRewardData.created_by || 'system',
      });

      const savedReward = await this.loyaltyRewardRepository.save(reward);

      this.logger.log(`Reward created: ${savedReward.id} for merchant ${merchantId}`);

      return {
        success: true,
        message: 'Reward created successfully',
        data: {
          reward_id: savedReward.id,
          name: savedReward.name,
          points_cost: savedReward.points_cost,
          stock_quantity: savedReward.stock_quantity,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Create reward failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getReward(merchantId: string, rewardId: string): Promise<any> {
    throw new Error('Not implemented');
  }

  // Customer Points Balance
  async getCustomerPointsBalance(customerId: string, merchantId: string): Promise<any> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId, merchant_id: merchantId },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      return {
        success: true,
        message: 'Customer points balance retrieved successfully',
        data: {
          customer_id: customer.id,
          total_points: customer.total_points,
          points_available: customer.total_points,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get customer points balance failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Analytics
  async getLoyaltyAnalytics(merchantId: string): Promise<any> {
    try {
      if (!merchantId || !merchantId.trim()) {
        throw new BadRequestException('Merchant ID is required');
      }

      // Get loyalty transactions for analytics
      const transactions = await this.loyaltyTransactionRepository.find({
        where: { merchant_id: merchantId },
        order: { created_at: 'DESC' },
        take: 1000, // Large number for analytics
      });

      // Get customer engagement metrics
      const customerMetrics = await Promise.all(
        transactions.slice(0, 100).map(async (t) => {
          const customer = await this.customerRepository.findOne({
            where: { id: t.customer_id },
          relations: ['loyalty_transactions'],
          });

          return {
            total_transactions: customer?.loyalty_transactions?.length || 0,
            total_points_earned: customer?.loyalty_transactions
              ?.filter(trx => trx.transaction_type === 'earned')
              ?.reduce((sum, trx) => sum + Number(trx.points_change), 0) || 0,
          customer_id: t.customer_id,
            customer_name: customer?.name,
            customer_segment: customer?.customer_segment,
          engagement_score: customer?.engagement_score,
          last_activity: customer?.loyalty_transactions?.[0]?.created_at,
          };
        }),
      );

      // Calculate key metrics
      const totalTransactions = transactions.length;
      const totalPointsEarned = transactions
        .filter(t => t.transaction_type === 'earned')
        .reduce((sum, t) => sum + Number(t.points_change), 0);

      const totalPointsRedeemed = transactions
        .filter(t => t.transaction_type === 'redeemed')
        .reduce((sum, t) => sum + Math.abs(Number(t.points_change)), 0);

      const uniqueCustomers = new Set(customerMetrics.map(c => c.customer_id));

      return {
        success: true,
        message: 'Loyalty analytics retrieved successfully',
        data: {
          total_transactions: totalTransactions,
          total_points_earned: totalPointsEarned,
          total_points_redeemed: totalPointsRedeemed,
          net_points_pending: totalPointsEarned - totalPointsRedeemed,
          unique_customers: uniqueCustomers.size,
          customer_metrics: customerMetrics,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get loyalty analytics failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getLoyaltyLeaderboard(merchantId: string): Promise<any> {
    try {
      if (!merchantId || !merchantId.trim()) {
        throw new BadRequestException('Merchant ID is required');
      }

      // Get customers with their total points for leaderboard
      const customers = await this.customerRepository.find({
        where: { merchant_id: merchantId },
        order: { total_points: 'DESC' },
        take: 100,
      });

      return {
        success: true,
        message: 'Loyalty leaderboard retrieved successfully',
        data: customers.map((customer, index) => ({
          rank_position: index + 1,
          customer_id: customer.id,
          customer_name: customer.name,
          total_points: customer.total_points,
          customer_segment: customer.customer_segment,
          created_at: customer.created_at,
        })),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get loyalty leaderboard failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Cleanup expired transactions (can be run as a scheduled job)
  async cleanupExpiredTransactions() {
    try {
      this.logger.log('Running cleanup of expired loyalty transactions');
      // This would remove expired transactions or update statuses
      // Implementation depends on business requirements
    } catch (error) {
      this.logger.error('Failed to cleanup expired transactions', error.stack);
    }
  }
}