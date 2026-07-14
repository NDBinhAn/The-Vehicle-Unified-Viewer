import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VehicleDocumentModule } from './core/vehicle-document/vehicle-document.module';
import { MockExternalModule } from './mock-external/mock-external.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    VehicleDocumentModule,
    MockExternalModule,
  ],
})
export class AppModule {}
