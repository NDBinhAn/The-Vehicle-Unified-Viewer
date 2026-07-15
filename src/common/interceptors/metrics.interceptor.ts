import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MetricsService } from '../../monitoring/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly includedRoutes = [
    '/api/v1/vehicles/:vin/documents',
    '/api/health',
  ];

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const routePath: string = request.route?.path ?? request.url ?? 'unknown';
    const shouldRecord = this.shouldRecordRoute(routePath);
    const startTime = Date.now();

    console.log(`MetricsInterceptor: routePath=${routePath}, shouldRecord=${shouldRecord}`);

    return next.handle().pipe(
      finalize(() => {
        if (!shouldRecord) {
          return;
        }

        const durationMillis = Date.now() - startTime;
        this.metricsService.recordHttpRequest(routePath, durationMillis);
      }),
    );
  }

  private shouldRecordRoute(routePath: string): boolean {
    return this.includedRoutes.some((allowedRoute) => {
      if (!routePath) {
        return false;
      }

      if (allowedRoute.includes(':')) {
        const pattern = allowedRoute.replace(/:[^/]+/g, '[^/]+');
        return new RegExp(`^${pattern}$`).test(routePath);
      }

      return routePath === allowedRoute;
    });
  }
}
