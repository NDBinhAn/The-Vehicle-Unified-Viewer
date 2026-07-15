import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { VehicleDocumentModule } from './core/vehicle-document/vehicle-document.module';
import { MockExternalModule } from './mock-external/mock-external.module';
import configuration from './config/configuration';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { MonitoringModule } from './monitoring/monitoring.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { LoggerModule } from 'nestjs-pino';
import { trace, context } from '@opentelemetry/api';

const enablePinoLogger = process.env.ENABLE_PINO_LOGGER !== 'false';
const enablePrettyLogger = process.env.ENABLE_PRETTY_LOGGER === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    LoggerModule.forRoot({
      pinoHttp: enablePinoLogger
        ? {
            customProps: (req, res) => {
              const activeSpan = trace.getSpan(context.active());
              if (!activeSpan) return {};

              const spanContext = activeSpan.spanContext();
              return {
                trace_id: spanContext.traceId,
                span_id: spanContext.spanId,
              };
            },
            transport: enablePrettyLogger
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    messageFormat: '[{X-Correlation-ID}] [{trace_id}] - {msg}',
                  },
                }
              : undefined,
          }
        : undefined,
    }),
    VehicleDocumentModule,
    MockExternalModule,
    MonitoringModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor,
    },
  ],
})
export class AppModule {}
