import { Logger } from '@nestjs/common';
import { pino } from 'pino';

const enablePino = process.env.ENABLE_PINO_LOGGER !== 'false';
const enablePrettyPrint = process.env.ENABLE_PRETTY_LOGGER === 'true';

export const logger = enablePino
  ? pino({
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        enablePrettyPrint && process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true, singleLine: false } }
          : undefined,
    })
  : undefined;

export function getNestLogger(): Logger {
  return new Logger();
}
