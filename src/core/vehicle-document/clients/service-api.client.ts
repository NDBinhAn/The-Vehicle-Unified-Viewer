import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CircuitBreakerService } from '../../../common/resilience/circuit-breaker.service';
import { VehicleDocumentDto } from '../dtos/document-response.dto';

@Injectable()
export class ServiceApiClient {
  private readonly logger = new Logger(ServiceApiClient.name);
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly circuitBreakerService: CircuitBreakerService,
  ) {
    this.httpClient = axios.create({
      timeout: this.configService.get<number>('httpTimeout', 3000),
    });
  }

  async getDocuments(vin: string): Promise<VehicleDocumentDto[]> {
    const breaker = this.circuitBreakerService.create(
      `service-${vin}`,
      async () => {
        const response = await this.httpClient.get<{
          documents?: VehicleDocumentDto[];
        }>(
          `${this.configService.get<string>('serviceMockBaseUrl', 'http://127.0.0.1:3000/api/mock-api/service')}/${vin}`,
        );
        return (response.data.documents ?? []).map((document) => ({
          ...document,
          source: 'Service System',
        }));
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
