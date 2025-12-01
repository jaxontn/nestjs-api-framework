import { Test, TestingModule } from '@nestjs/testing';
import { MerchantUsersController } from './merchant-users.controller';

describe('MerchantUsersController', () => {
  let controller: MerchantUsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MerchantUsersController],
    }).compile();

    controller = module.get<MerchantUsersController>(MerchantUsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
