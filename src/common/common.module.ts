import { Module } from '@nestjs/common';
import { CustomCacheService } from './cache/custom-cache.service';
import { CircuitBreakerService } from './resilience/circuit-breaker.service';

@Module({
  providers: [CustomCacheService, CircuitBreakerService],
  exports: [CustomCacheService, CircuitBreakerService],
})
export class CommonModule {}
