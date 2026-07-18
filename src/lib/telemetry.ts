/**
 * OpenTelemetry Instrumentation — Design-Only / No-Op Implementation
 *
 * This module provides a tracer interface for future OpenTelemetry integration.
 * No external dependencies are added at this time.
 *
 * Future integration plan:
 * 1. Install `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`
 * 2. Configure `NodeSDK` with OTLP exporter targeting a collector
 * 3. Replace NoopTracer with `trace.getTracer('fleet-management')`
 * 4. Wire spans through the request lifecycle using Next.js instrumentation hook
 */

export interface Span {
  name: string;
  startTime: number;
  attributes: Record<string, unknown>;
  endTime?: number;
  error?: Error;
}

export interface Tracer {
  createSpan(name: string, attributes?: Record<string, unknown>): Span;
  endSpan(span: Span): void;
  recordError(span: Span, error: Error): void;
  setAttribute(span: Span, key: string, value: unknown): void;
}

class NoopTracer implements Tracer {
  createSpan(name: string, attributes: Record<string, unknown> = {}): Span {
    return { name, startTime: Date.now(), attributes };
  }

  endSpan(span: Span): void {
    span.endTime = Date.now();
  }

  recordError(span: Span, error: Error): void {
    span.error = error;
    span.endTime = Date.now();
  }

  setAttribute(span: Span, key: string, value: unknown): void {
    span.attributes[key] = value;
  }
}

let tracerInstance: Tracer | null = null;

export function getTracer(): Tracer {
  if (!tracerInstance) {
    tracerInstance = new NoopTracer();
  }
  return tracerInstance;
}

export function setTracer(t: Tracer): void {
  tracerInstance = t;
}

export { NoopTracer };

/*
=== FUTURE INTEGRATION NOTES ===

1. Add to package.json:
   "@opentelemetry/sdk-node": "^0.45.0",
   "@opentelemetry/auto-instrumentations-node": "^0.39.0",
   "@opentelemetry/exporter-trace-otlp-http": "^0.45.0"

2. Create `instrumentation.ts` at project root:
   import { NodeSDK } from '@opentelemetry/sdk-node';
   import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
   import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

   const sdk = new NodeSDK({
     traceExporter: new OTLPTraceExporter({ url: 'http://otel-collector:4318/v1/traces' }),
     instrumentations: [getNodeAutoInstrumentations()],
   });
   sdk.start();

3. Replace getTracer() to use:
   import { trace } from '@opentelemetry/api';
   return trace.getTracer('fleet-management', process.env.npm_package_version);

4. Add spans in middleware, Prisma, and service layers.
*/
