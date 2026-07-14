import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, register } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly salesRequests: Counter<string>;
  private readonly serviceRequests: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;
  private readonly externalDependencyDuration: Histogram<string>;
  private readonly redisCacheHits: Counter<string>;
  private readonly redisCacheMisses: Counter<string>;
  private readonly redisCacheHitRatio: Gauge<string>;

  private cacheHits = 0;
  private cacheMisses = 0;

  constructor() {
    this.salesRequests = new Counter({
      name: 'vehicle_sales_requests_total',
      help: 'Total sales downstream requests',
      labelNames: ['status'],
    });

    this.serviceRequests = new Counter({
      name: 'vehicle_service_requests_total',
      help: 'Total service downstream requests',
      labelNames: ['status'],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Latency of the main API gateway requests',
      labelNames: ['route'],
      buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1],
    });

    this.externalDependencyDuration = new Histogram({
      name: 'external_dependency_duration_seconds',
      help: 'Latency of downstream document requests',
      labelNames: ['source'],
      buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1],
    });

    this.redisCacheHits = new Counter({
      name: 'redis_cache_hits_total',
      help: 'Total cache hits',
    });

    this.redisCacheMisses = new Counter({
      name: 'redis_cache_misses_total',
      help: 'Total cache misses',
    });

    this.redisCacheHitRatio = new Gauge({
      name: 'redis_cache_hit_ratio',
      help: 'Cache hit ratio for document lookups',
    });
  }

  recordSalesRequest(status: string): void {
    this.salesRequests.inc({ status });
  }

  recordServiceRequest(status: string): void {
    this.serviceRequests.inc({ status });
  }

  recordHttpRequest(route: string, durationMs: number): void {
    this.httpRequestDuration.observe({ route }, durationMs / 1000);
  }

  recordDownstreamLatency(source: string, durationMs: number): void {
    this.externalDependencyDuration.observe({ source }, durationMs / 1000);
  }

  recordCacheHit(): void {
    this.cacheHits += 1;
    this.redisCacheHits.inc();
    this.redisCacheHitRatio.set(this.calculateHitRatio());
  }

  recordCacheMiss(): void {
    this.cacheMisses += 1;
    this.redisCacheMisses.inc();
    this.redisCacheHitRatio.set(this.calculateHitRatio());
  }

  private calculateHitRatio(): number {
    const total = this.cacheHits + this.cacheMisses;
    if (total === 0) {
      return 0;
    }

    return this.cacheHits / total;
  }

  getMetrics(): Promise<string> {
    return register.metrics();
  }
}
