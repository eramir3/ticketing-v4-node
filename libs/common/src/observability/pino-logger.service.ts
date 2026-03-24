import { Injectable, type LoggerService } from '@nestjs/common';
import { inspect } from 'node:util';
import pino, { type Logger as PinoLogger } from 'pino';
import { getRequestContext } from './request-context';

type NestLoggerLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose' | 'fatal';
type PinoLevel = 'info' | 'error' | 'warn' | 'debug' | 'trace' | 'fatal';

const levelMap: Record<NestLoggerLevel, PinoLevel> = {
  log: 'info',
  error: 'error',
  warn: 'warn',
  debug: 'debug',
  verbose: 'trace',
  fatal: 'fatal',
};

@Injectable()
export class PinoLoggerService implements LoggerService {
  private readonly logger: PinoLogger;

  constructor(private readonly serviceName: string) {
    this.logger = pino({
      level: process.env.LOG_LEVEL ?? 'info',
      messageKey: 'message',
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        service_name: this.serviceName,
        environment: process.env.NODE_ENV ?? 'development',
      },
      formatters: {
        bindings: ({ hostname, pid }) => ({
          host: hostname,
          pid,
        }),
        level: (label) => ({
          level: label,
        }),
      },
    });
  }

  getPinoLogger() {
    return this.logger;
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    this.write('log', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    this.write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    this.write('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]) {
    this.write('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]) {
    this.write('verbose', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]) {
    this.write('fatal', message, optionalParams);
  }

  private write(
    level: NestLoggerLevel,
    message: unknown,
    optionalParams: unknown[]
  ) {
    const { context, params } = this.extractContext(level, optionalParams);
    const payload = this.buildPayload(context);
    const [primary, ...rest] = params;
    const logger = this.logger[levelMap[level]].bind(this.logger);

    if (message instanceof Error) {
      logger(
        {
          ...payload,
          err: message,
          ...this.buildDetails(primary, rest),
        },
        message.message
      );
      return;
    }

    if (primary instanceof Error) {
      logger(
        {
          ...payload,
          err: primary,
          ...this.buildDetails(undefined, rest),
        },
        this.stringifyMessage(message)
      );
      return;
    }

    if (level === 'error' && typeof primary === 'string') {
      logger(
        {
          ...payload,
          stack: primary,
          ...this.buildDetails(undefined, rest),
        },
        this.stringifyMessage(message)
      );
      return;
    }

    logger(
      {
        ...payload,
        ...this.buildDetails(primary, rest),
      },
      this.stringifyMessage(message)
    );
  }

  private buildPayload(context?: string) {
    const requestContext = getRequestContext();

    return {
      ...(context ? { context } : {}),
      ...(requestContext?.requestId ? { request_id: requestContext.requestId } : {}),
      ...(requestContext?.traceId ? { trace_id: requestContext.traceId } : {}),
      ...(requestContext?.spanId ? { span_id: requestContext.spanId } : {}),
    };
  }

  private buildDetails(primary?: unknown, rest: unknown[] = []) {
    if (primary === undefined && rest.length === 0) {
      return {};
    }

    const details = primary === undefined ? rest : [primary, ...rest];

    return {
      details: details.length === 1 ? details[0] : details,
    };
  }

  private extractContext(level: NestLoggerLevel, optionalParams: unknown[]) {
    const params = [...optionalParams];

    if (
      params.length > (level === 'error' ? 1 : 0) &&
      typeof params.at(-1) === 'string'
    ) {
      return {
        context: params.pop() as string,
        params,
      };
    }

    return {
      context: undefined,
      params,
    };
  }

  private stringifyMessage(message: unknown) {
    if (typeof message === 'string') {
      return message;
    }

    if (message instanceof Error) {
      return message.message;
    }

    return inspect(message, { depth: 5, breakLength: Infinity });
  }
}
