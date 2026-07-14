import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CircuitBreakerService } from '../../../common/resilience/circuit-breaker.service';
import { VehicleDocumentDto } from '../dtos/document-response.dto';

@Injectable()
export class SalesApiClient {
  private readonly logger = new Logger(SalesApiClient.name);
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
      `sales-${vin}`,
      async () => {
        const response = await this.httpClient.get<{
          documents?: VehicleDocumentDto[];
        }>(
          `${this.configService.get<string>('salesMockBaseUrl', 'http://127.0.0.1:3000/api/mock-api/sales')}/${vin}`,
        );
        return (response.data.documents ?? []).map((document) => ({
          ...document,
          source: 'Sales System',
        }));
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
