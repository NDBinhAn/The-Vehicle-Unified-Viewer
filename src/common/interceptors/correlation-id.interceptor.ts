import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable, catchError, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CorrelationIdInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const response = context.switchToHttp().getResponse<{ setHeader: (name: string, value: string) => void }>();

    const incomingId = request.headers['x-correlation-id'] ?? request.headers['X-Correlation-ID'];
    const correlationId = Array.isArray(incomingId) ? incomingId[0] : incomingId ?? randomUUID();

    request.headers['x-correlation-id'] = correlationId;
    response.setHeader('X-Correlation-ID', correlationId);

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`[${correlationId}] request completed`);
      }),
      catchError((error: Error) => {
        this.logger.error(`[${correlationId}] ${error.message}`);
        return throwError(() => error);
      }),
    );
  }
}
