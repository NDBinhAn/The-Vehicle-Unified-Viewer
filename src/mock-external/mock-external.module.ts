import { Module } from '@nestjs/common';
import { SalesMockController } from './sales-mock.controller';
import { ServiceMockController } from './service-mock.controller';

@Module({
  controllers: [SalesMockController, ServiceMockController],
})
export class MockExternalModule {}
