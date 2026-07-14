import { LoggerService } from '@nestjs/common';
import { Logger as PinoLogger } from 'pino';

export class PinoNestLogger implements LoggerService {
  constructor(private readonly logger: PinoLogger) {}

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.info({ context: optionalParams[0] ?? 'Nest' }, String(message));
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.error({ context: optionalParams[0] ?? 'Nest' }, String(message));
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.warn({ context: optionalParams[0] ?? 'Nest' }, String(message));
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.debug({ context: optionalParams[0] ?? 'Nest' }, String(message));
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.info({ context: optionalParams[0] ?? 'Nest' }, String(message));
  }
}
