import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../../entities/merchant.entity';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  async create(createMerchantDto: Partial<Merchant>): Promise<Merchant> {
    const merchant = this.merchantRepository.create(createMerchantDto);
    return this.merchantRepository.save(merchant);
  }

  async findAll(): Promise<Merchant[]> {
    return this.merchantRepository.find({
      relations: ['customers', 'campaigns'],
    });
  }

  async findOne(id: string): Promise<Merchant | null> {
    return this.merchantRepository.findOne({
      where: { id },
      relations: ['customers', 'campaigns', 'game_settings'],
    });
  }

  async update(id: string, updateMerchantDto: Partial<Merchant>): Promise<Merchant | null> {
    await this.merchantRepository.update(id, updateMerchantDto);
    const result = await this.findOne(id);
    if (!result) {
      throw new Error('Merchant not found');
    }
    return result;
  }

  async remove(id: string): Promise<void> {
    await this.merchantRepository.delete(id);
  }
}
