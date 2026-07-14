import { ConfigService } from '@nestjs/config';
import { CustomCacheService } from './custom-cache.service';

describe('CustomCacheService', () => {
  let service: CustomCacheService;

  beforeEach(async () => {
    // 1. Clear all Jest mock call histories
    jest.clearAllMocks();

    const mockConfig = {
      get: jest.fn((key: string, defaultValue?: unknown) => defaultValue),
    } as unknown as ConfigService;

    service = new CustomCacheService(mockConfig);

    // 2. Clear the internal cache storage if your service exposes a reset method
    // Example: await service.clear() or accessing the underlying store:
    await service.delete('test-key'); // Clear the specific key used in tests
  });

  afterAll(async () => {
    await service.close();
  });

  it('should cache and return values on subsequent reads', async () => {
    const factory = jest.fn().mockResolvedValue({ value: 'ok' });

    const first = await service.getOrSet('test-key', factory, 60);
    const second = await service.get('test-key');

    expect(first).toEqual({ value: 'ok' });
    expect(second).toEqual({ value: 'ok' });
    expect(factory).toHaveBeenCalledTimes(1);
  });
});
