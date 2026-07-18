/**
 * Lightweight Prometheus-compatible metrics registry.
 * No external dependencies — manual string formatting.
 */

type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

interface MetricValue {
  labels: Record<string, string>;
  value: number;
  timestamp?: number;
  _count?: number;
}

interface MetricDefinition {
  name: string;
  help: string;
  type: MetricType;
  values: Map<string, MetricValue>;
}

class PrometheusRegistry {
  private metrics: Map<string, MetricDefinition> = new Map();

  counter(name: string, help: string, labels: Record<string, string> = {}): void {
    this.ensureMetric(name, help, 'counter');
    const key = this.labelKey(labels);
    const metric = this.metrics.get(name)!;
    const existing = metric.values.get(key);
    if (existing) {
      existing.value += 1;
    } else {
      metric.values.set(key, { labels, value: 1 });
    }
  }

  gauge(name: string, help: string, value: number, labels: Record<string, string> = {}): void {
    this.ensureMetric(name, help, 'gauge');
    const key = this.labelKey(labels);
    this.metrics.get(name)!.values.set(key, { labels, value });
  }

  histogram(
    name: string,
    help: string,
    value: number,
    labels: Record<string, string> = {}
  ): void {
    this.ensureMetric(name, help, 'histogram');
    const key = this.labelKey(labels);
    const metric = this.metrics.get(name)!;
    const existing = metric.values.get(key);
    if (existing) {
      // Store running sum and count for histogram approximations
      existing.value += value;
      if (!existing._count) existing._count = 0;
      existing._count += 1;
      metric.values.set(key, existing as MetricValue & { _count: number });
    } else {
      metric.values.set(key, { labels, value, _count: 1 } as MetricValue & { _count: number });
    }
  }

  set(name: string, help: string, value: number, labels: Record<string, string> = {}): void {
    this.gauge(name, help, value, labels);
  }

  format(): string {
    const lines: string[] = [];
    for (const [, metric] of this.metrics) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);
      for (const [, value] of metric.values) {
        const labelStr = Object.entries(value.labels)
          .map(([k, v]) => `${k}="${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
          .join(',');
        const labelPart = labelStr ? `{${labelStr}}` : '';

        if (metric.type === 'histogram') {
          // Prometheus histogram convention: emit _sum and _count
          const count = value._count || 1;
          lines.push(`${metric.name}_sum${labelPart} ${value.value}${value.timestamp ? ` ${value.timestamp}` : ''}`);
          lines.push(`${metric.name}_count${labelPart} ${count}${value.timestamp ? ` ${value.timestamp}` : ''}`);
        } else {
          lines.push(`${metric.name}${labelPart} ${value.value}${value.timestamp ? ` ${value.timestamp}` : ''}`);
        }
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  private ensureMetric(name: string, help: string, type: MetricType): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, { name, help, type, values: new Map() });
    }
  }

  private labelKey(labels: Record<string, string>): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
  }
}

// Global singleton registry
let globalRegistry: PrometheusRegistry | null = null;

export function getRegistry(): PrometheusRegistry {
  if (!globalRegistry) {
    globalRegistry = new PrometheusRegistry();
  }
  return globalRegistry;
}

export function resetRegistry(): void {
  globalRegistry = new PrometheusRegistry();
}

export { PrometheusRegistry };
