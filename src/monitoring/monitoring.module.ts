import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { MetricsService } from './metrics.service';
import { PrometheusModule } from 'nestjs-prometheus';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TerminusModule, 
    HttpModule.register({
      timeout: 5000, // Set a timeout for HTTP requests (in milliseconds)
    }),
    PrometheusModule.register({
      path: '/metrics', // Automatically generate /metrics endpoint for the entire app
      defaultMetrics: {
        enabled: true, // Enable default metrics collection (CPU, memory, etc.)
      },
    }),
  ],
  controllers: [HealthController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MonitoringModule {}
