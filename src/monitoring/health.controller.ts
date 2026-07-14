import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('sales-mock', 'http://127.0.0.1:3000/api/mock-api/sales/ping'),
      () => this.http.pingCheck('service-mock', 'http://127.0.0.1:3000/api/mock-api/service/ping'),
    ]);
  }
}
