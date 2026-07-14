import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { VehicleDocumentModule } from './core/vehicle-document/vehicle-document.module';
import { MockExternalModule } from './mock-external/mock-external.module';
import configuration from './config/configuration';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    VehicleDocumentModule,
    MockExternalModule,
    MonitoringModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor,
    },
  ],
})
export class AppModule {}
