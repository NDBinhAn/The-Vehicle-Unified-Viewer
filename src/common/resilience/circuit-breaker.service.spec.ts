import { ConfigService } from '@nestjs/config';
import { CircuitBreakerService } from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
  it('creates a breaker with configured options', () => {
    const service = new CircuitBreakerService({
      get: jest.fn((key: string, defaultValue?: unknown) => defaultValue),
    } as unknown as ConfigService);

    const breaker = service.create('test', async () => ({ ok: true }));

    expect(breaker).toBeDefined();
  });
});
