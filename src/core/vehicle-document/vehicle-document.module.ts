import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { VehicleDocumentController } from './controllers/vehicle-document.controller';
import { VehicleDocumentService } from './services/vehicle-document.service';
import { SalesApiClient } from './clients/sales-api.client';
import { ServiceApiClient } from './clients/service-api.client';

@Module({
  imports: [CommonModule],
  controllers: [VehicleDocumentController],
  providers: [VehicleDocumentService, SalesApiClient, ServiceApiClient],
})
export class VehicleDocumentModule {}
