import { Injectable } from '@nestjs/common';

type MetricType = 'counter' | 'gauge';

/**
 * Minimal in-process metrics registry with Prometheus text exposition.
 * Counters are monotonic per process; gauges are last-write-wins. State is
 * per-process (acceptable: each web/worker process is scraped independently).
 */
@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, number>();
  private readonly gauges = new Map<string, number>();
  private readonly types = new Map<string, MetricType>();
  private readonly help = new Map<string, string>();

  registerHelp(name: string, help: string): void {
    this.help.set(name, help);
  }

  incCounter(name: string, labels: Record<string, string> = {}, by = 1): void {
    this.types.set(name, 'counter');
    const key = this.seriesKey(name, labels);
    this.counters.set(key, (this.counters.get(key) ?? 0) + by);
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    this.types.set(name, 'gauge');
    this.gauges.set(this.seriesKey(name, labels), value);
  }

  private seriesKey(name: string, labels: Record<string, string>): string {
    const parts = Object.keys(labels)
      .sort()
      .map((k) => `${k}="${this.escapeLabel(labels[k])}"`);
    return parts.length ? `${name}{${parts.join(',')}}` : name;
  }

  private escapeLabel(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
  }

  private baseName(seriesKey: string): string {
    const brace = seriesKey.indexOf('{');
    return brace === -1 ? seriesKey : seriesKey.slice(0, brace);
  }

  render(): string {
    const lines: string[] = [];
    const emitted = new Set<string>();

    const emitMetric = (store: Map<string, number>) => {
      for (const [seriesKey, value] of store) {
        const name = this.baseName(seriesKey);
        if (!emitted.has(name)) {
          emitted.add(name);
          const helpText = this.help.get(name);
          if (helpText) lines.push(`# HELP ${name} ${helpText}`);
          lines.push(`# TYPE ${name} ${this.types.get(name) ?? 'untyped'}`);
        }
        lines.push(`${seriesKey} ${value}`);
      }
    };

    emitMetric(this.counters);
    emitMetric(this.gauges);
    return lines.join('\n') + '\n';
  }
}
