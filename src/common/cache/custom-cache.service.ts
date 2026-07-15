import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CustomCacheService {
  private readonly logger = new Logger(CustomCacheService.name);
  private readonly memoryCache = new Map<
    string,
    { value: string; expiresAt: number }
  >();
  private readonly redisClient: Redis;
  private redisConnected = false;
  private redisInitialized = false;

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('redis.host', '127.0.0.1'),
      port: this.configService.get<number>('redis.port', 6379),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number,
    options?: { onHit?: () => void; onMiss?: () => void },
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async get<T>(key: string, options?: { onHit?: () => void; onMiss?: () => void }): Promise<T | undefined> {
    const entry = await this.getEntry(key);
    if (!entry) {
      options?.onMiss?.();
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      await this.delete(key);
      return undefined;
    }

    options?.onHit?.();
    return JSON.parse(entry.value) as T;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const expiresAt = Date.now() + ttl * 1000;
    const serialized = JSON.stringify(value);

    await this.ensureRedis();
    if (this.redisConnected) {
      await this.redisClient.set(key, serialized, 'PX', ttl * 1000);
      return;
    }

    this.memoryCache.set(key, { value: serialized, expiresAt });
  }

  async delete(key: string): Promise<void> {
    await this.ensureRedis();
    if (this.redisConnected) {
      await this.redisClient.del(key);
      return;
    }

    this.memoryCache.delete(key);
  }

  async close(): Promise<void> {
    if (this.redisConnected) {
      await this.redisClient.quit();
    }
  }

  private async getEntry(
    key: string,
  ): Promise<{ value: string; expiresAt: number } | undefined> {
    await this.ensureRedis();
    if (this.redisConnected) {
      const value = await this.redisClient.get(key);
      if (!value) {
        return undefined;
      }

      return { value, expiresAt: Number.POSITIVE_INFINITY };
    }

    return this.memoryCache.get(key);
  }

  private async ensureRedis(): Promise<void> {
    if (this.redisInitialized) {
      return;
    }

    this.redisInitialized = true;
    try {
      await this.redisClient.connect();
      this.redisConnected = true;
    } catch {
      this.logger.warn('Redis unavailable, falling back to in-memory cache');
      this.redisConnected = false;
    }
  }
}
