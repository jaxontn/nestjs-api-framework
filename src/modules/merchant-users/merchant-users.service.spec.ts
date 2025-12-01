import { Test, TestingModule } from '@nestjs/testing';
import { MerchantUsersService } from './merchant-users.service';

describe('MerchantUsersService', () => {
  let service: MerchantUsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MerchantUsersService],
    }).compile();

    service = module.get<MerchantUsersService>(MerchantUsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
