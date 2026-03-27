import {
  ROOT_CONTEXT,
  context as otelContext,
  propagation,
  type Context,
} from '@opentelemetry/api';

export type TraceCarrier = Record<string, string>;

export function injectTraceCarrier(context: Context = otelContext.active()): TraceCarrier {
  const carrier: TraceCarrier = {};
  propagation.inject(context, carrier);
  return carrier;
}

export function extractTraceCarrierContext(carrier?: TraceCarrier): Context {
  return propagation.extract(ROOT_CONTEXT, carrier ?? {});
}
