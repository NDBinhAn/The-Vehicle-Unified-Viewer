import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import CircuitBreaker from 'opossum';

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);

  constructor(private readonly configService: ConfigService) {}

  create<T>(name: string, action: () => Promise<T>): CircuitBreaker<[], T> {
    return new CircuitBreaker(action, {
      timeout: this.configService.get<number>('httpTimeout', 3000),
      errorThresholdPercentage: this.configService.get<number>(
        'circuitBreakerErrorThreshold',
        50,
      ),
      resetTimeout: this.configService.get<number>(
        'circuitBreakerResetTimeout',
        30000,
      ),
      name,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10,
    });
  }
}
