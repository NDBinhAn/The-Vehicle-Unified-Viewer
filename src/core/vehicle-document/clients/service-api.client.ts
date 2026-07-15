import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CircuitBreakerService } from '../../../common/resilience/circuit-breaker.service';
import { MetricsService } from '../../../monitoring/metrics.service';
import { VehicleDocumentDto } from '../dtos/document-response.dto';

@Injectable()
export class ServiceApiClient {
  private readonly logger = new Logger(ServiceApiClient.name);
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
      `service-${vin}`,
      async () => {
        const startedAt = Date.now();
        try {
          const response = await this.httpClient.get<{
            documents?: VehicleDocumentDto[];
          }>(
            `${this.configService.get<string>('serviceMockBaseUrl', `http://127.0.0.1:${process.env.PORT ?? 3000}/api/mock-api/service`)}/${vin}`,
          );
          this.metricsService.recordServiceRequest('success');
          this.metricsService.recordDownstreamLatency('service', Date.now() - startedAt);
          return (response.data.documents ?? []).map((document) => ({
            ...document,
            source: 'Service System',
          }));
        } catch (error) {
          this.metricsService.recordServiceRequest('failure');
          this.metricsService.recordDownstreamLatency('service', Date.now() - startedAt);
          throw error;
        }
      },
    );

    try {
      return await breaker.fire();
    } catch (e) {
      this.logger.warn(`Service API unavailable for VIN ${vin}, error: ${JSON.stringify(e)}`);
      return [];
    }
  }
}
