import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CircuitBreakerService } from '../../../common/resilience/circuit-breaker.service';
import { MetricsService } from '../../../monitoring/metrics.service';
import { VehicleDocumentDto } from '../dtos/document-response.dto';

@Injectable()
export class SalesApiClient {
  private readonly logger = new Logger(SalesApiClient.name);
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly metricsService: MetricsService,
  ) {
    this.httpClient = axios.create({
      timeout: this.configService.get<number>('httpTimeout', 3000),
    });
  }

  async getDocuments(vin: string): Promise<VehicleDocumentDto[]> {
    const breaker = this.circuitBreakerService.create(
      `sales-${vin}`,
      async () => {
        const startedAt = Date.now();
        try {
          const response = await this.httpClient.get<{
            documents?: VehicleDocumentDto[];
          }>(
            `${this.configService.get<string>('salesMockBaseUrl', `http://127.0.0.1:${process.env.PORT ?? 3000}/api/mock-api/sales`)}/${vin}`,
          );
          this.metricsService.recordSalesRequest('success');
          this.metricsService.recordDownstreamLatency('sales', Date.now() - startedAt);
          return (response.data.documents ?? []).map((document) => ({
            ...document,
            source: 'Sales System',
          }));
        } catch (error) {
          this.metricsService.recordSalesRequest('failure');
          this.metricsService.recordDownstreamLatency('sales', Date.now() - startedAt);
          throw error;
        }
      },
    );

    try {
      return await breaker.fire();
    } catch {
      this.logger.warn(`Sales API unavailable for VIN ${vin}`);
      return [];
    }
  }
}
