import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomCacheService } from '../../../common/cache/custom-cache.service';
import {
  paginateDocuments,
  sortByTimestampDescending,
} from '../../../common/utils/pagination.util';
import {
  VehicleDocumentDto,
  VehicleDocumentsResponseDto,
} from '../dtos/document-response.dto';
import { SalesApiClient } from '../clients/sales-api.client';
import { ServiceApiClient } from '../clients/service-api.client';
import { MetricsService } from '../../../monitoring/metrics.service';

@Injectable()
export class VehicleDocumentService {
  private readonly logger = new Logger(VehicleDocumentService.name);

  constructor(
    private readonly cacheService: CustomCacheService,
    private readonly salesApiClient: SalesApiClient,
    private readonly serviceApiClient: ServiceApiClient,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {}

  async getDocuments(
    vin: string,
    page: number,
    size: number,
  ): Promise<VehicleDocumentsResponseDto> {
    const [salesDocuments, serviceDocuments] = await Promise.all([
      this.loadSourceDocuments(
        'sales',
        vin,
        this.configService.get<number>('salesCacheTtl', 86400),
        () => this.salesApiClient.getDocuments(vin),
      ),
      this.loadSourceDocuments(
        'service',
        vin,
        this.configService.get<number>('serviceCacheTtl', 1800),
        () => this.serviceApiClient.getDocuments(vin),
      ),
    ]);

    const mergedDocuments = [...salesDocuments, ...serviceDocuments];
    const sortedDocuments = sortByTimestampDescending(mergedDocuments);

    return paginateDocuments(sortedDocuments, page, size);
  }

  private async loadSourceDocuments(
    source: 'sales' | 'service',
    vin: string,
    ttl: number,
    fetcher: () => Promise<VehicleDocumentDto[]>,
  ): Promise<VehicleDocumentDto[]> {
    const cacheKey = `cache:${source}:${vin}`;

    try {
      const cachedDocuments =
        await this.cacheService.get<VehicleDocumentDto[]>(cacheKey);
      if (cachedDocuments) {
        return cachedDocuments;
      }
    } catch {
      this.logger.warn(`Cache lookup failed for ${source} ${vin}`);
    }

    try {
      const freshDocuments = await this.cacheService.getOrSet(
        cacheKey,
        fetcher,
        ttl,
        {
          onHit: () => this.metricsService.recordCacheHit(),
          onMiss: () => this.metricsService.recordCacheMiss(),
        },
      );
      return freshDocuments;
    } catch {
      this.logger.warn(`Falling back to empty ${source} documents for ${vin}`);
      return [];
    }
  }
}
