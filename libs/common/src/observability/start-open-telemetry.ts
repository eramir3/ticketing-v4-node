import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

type GlobalOpenTelemetryState = typeof globalThis & {
  __ticketingOpenTelemetrySdk?: NodeSDK;
};

const openTelemetryState = globalThis as GlobalOpenTelemetryState;

export async function startOpenTelemetry(serviceName: string) {
  if (process.env.NODE_ENV === 'test' || process.env.OTEL_SDK_DISABLED === 'true') {
    return;
  }

  const tracesEndpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;

  if (!tracesEndpoint || openTelemetryState.__ticketingOpenTelemetrySdk) {
    return;
  }

  if (process.env.OTEL_LOG_LEVEL === 'debug') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.0',
    }),
    traceExporter: new OTLPTraceExporter({
      url: tracesEndpoint,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
      }),
      new NestInstrumentation(),
    ],
  });

  await sdk.start();
  openTelemetryState.__ticketingOpenTelemetrySdk = sdk;

  process.once('SIGTERM', () => {
    void sdk.shutdown();
  });
  process.once('SIGINT', () => {
    void sdk.shutdown();
  });
}
