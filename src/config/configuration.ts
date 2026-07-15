export interface AppConfig {
  port: number;
  httpTimeout: number;
  circuitBreakerErrorThreshold: number;
  circuitBreakerResetTimeout: number;
  salesCacheTtl: number;
  serviceCacheTtl: number;
  salesMockBaseUrl: string;
  serviceMockBaseUrl: string;
}

export const configuration = (): AppConfig => ({
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  httpTimeout: Number.parseInt(process.env.HTTP_TIMEOUT ?? '3000', 10),
  circuitBreakerErrorThreshold: Number.parseInt(
    process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD ?? '50',
    10,
  ),
  circuitBreakerResetTimeout: Number.parseInt(
    process.env.CIRCUIT_BREAKER_RESET_TIMEOUT ?? '30000',
    10,
  ),
  salesCacheTtl: Number.parseInt(process.env.SALES_CACHE_TTL ?? '86400', 10),
  serviceCacheTtl: Number.parseInt(process.env.SERVICE_CACHE_TTL ?? '1800', 10),
  salesMockBaseUrl:
    process.env.SALES_MOCK_BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 3000}/api/mock-api/sales`,
  serviceMockBaseUrl:
    process.env.SERVICE_MOCK_BASE_URL ??
    `http://127.0.0.1:${process.env.PORT ?? 3000}/api/mock-api/service`,
});

export default configuration;
