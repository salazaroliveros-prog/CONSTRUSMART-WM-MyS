/**
 * Módulo de Métricas y Monitoring
 * 
 * Funcionalidades:
 * - Rastreo de operaciones clave (sync, renderizado, errores)
 * - Almacenamiento de métricas en localStorage
 * - Consulta de métricas y estadísticas
 * - Alertas automáticas para anomalías
 */

interface MetricEntry {
  id: string;
  timestamp: string;
  type: 'sync' | 'render' | 'error' | 'user_action' | 'performance';
  category: string;
  value: number;
  metadata?: Record<string, unknown>;
}

interface MetricAlert {
  id: string;
  timestamp: string;
  type: 'high_error_rate' | 'slow_sync' | 'storage_quota' | 'memory_warning';
  message: string;
  severity: 'warning' | 'critical';
}

const METRICS_STORAGE_KEY = 'erp_metrics';
const ALERTS_STORAGE_KEY = 'erp_metric_alerts';
const MAX_METRICS = 1000;
const MAX_ALERTS = 50;

class MetricsManager {
  private metrics: MetricEntry[] = [];
  private alerts: MetricAlert[] = [];
  private counters: Map<string, number> = new Map();
  private timers: Map<string, number> = new Map();

  init() {
    this.loadMetrics();
    this.loadAlerts();
  }

  private loadMetrics() {
    try {
      const stored = localStorage.getItem(METRICS_STORAGE_KEY);
      if (stored) {
        this.metrics = JSON.parse(stored);
        const countersData = JSON.parse(localStorage.getItem('erp_metric_counters') || '{}');
        this.counters = new Map(Object.entries(countersData));
      }
    } catch (err) {
      console.error('[Metrics] Error loading metrics:', err);
    }
  }

  private loadAlerts() {
    try {
      const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (stored) {
        this.alerts = JSON.parse(stored);
      }
    } catch (err) {
      console.error('[Metrics] Error loading alerts:', err);
    }
  }

  private saveMetrics() {
    try {
      const trimmed = this.metrics.slice(-MAX_METRICS);
      localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(trimmed));
      localStorage.setItem('erp_metric_counters', JSON.stringify(Object.fromEntries(this.counters)));
    } catch (err) {
      console.error('[Metrics] Error saving metrics:', err);
    }
  }

  private saveAlerts() {
    try {
      const trimmed = this.alerts.slice(-MAX_ALERTS);
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (err) {
      console.error('[Metrics] Error saving alerts:', err);
    }
  }

  recordMetric(type: MetricEntry['type'], category: string, value: number, metadata?: Record<string, unknown>) {
    const entry: MetricEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      category,
      value,
      metadata
    };

    this.metrics.push(entry);
    this.saveMetrics();

    this.checkForAnomalies();
  }

  incrementCounter(category: string, amount: number = 1) {
    const current = this.counters.get(category) || 0;
    this.counters.set(category, current + amount);
    this.saveMetrics();
  }

  startTimer(category: string) {
    this.timers.set(category, performance.now());
  }

  endTimer(category: string) {
    const startTime = this.timers.get(category);
    if (startTime === undefined) return 0;
    
    const duration = performance.now() - startTime;
    this.timers.delete(category);
    this.recordMetric('performance', category, duration);
    return duration;
  }

  recordSync(duration: number, success: boolean, tableCount?: number) {
    this.recordMetric('sync', 'sync_duration', duration, { success, tableCount });
    this.incrementCounter('sync_total');
    if (!success) {
      this.incrementCounter('sync_errors');
    }
  }

  recordRender(component: string, duration: number) {
    this.recordMetric('render', component, duration);
  }

  recordError(type: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    this.incrementCounter(`error_${severity}`);
    this.recordMetric('error', type, 1, { severity });
  }

  recordUserAction(action: string, metadata?: Record<string, unknown>) {
    this.incrementCounter(`action_${action}`);
    this.recordMetric('user_action', action, 1, metadata);
  }

  private checkForAnomalies() {
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => new Date(m.timestamp) >= lastHour);

    const errorCount = recentMetrics.filter(m => m.type === 'error').length;
    const syncErrors = recentMetrics.filter(m => m.type === 'sync' && m.metadata?.success === false).length;
    const slowSyncs = recentMetrics.filter(m => m.type === 'sync' && m.value > 5000).length;

    if (errorCount > 10) {
      this.createAlert('high_error_rate', 'Alta tasa de errores en la última hora', 'warning');
    }

    if (syncErrors > 3) {
      this.createAlert('slow_sync', 'Múltiples fallos de sincronización', 'critical');
    }

    if (slowSyncs > 2) {
      this.createAlert('slow_sync', 'Sincronizaciones lentas detectadas', 'warning');
    }

    const storageUsage = this.getStorageUsage();
    if (storageUsage > 90) {
      this.createAlert('storage_quota', 'Cuota de localStorage casi llena', 'warning');
    }
  }

  private createAlert(type: MetricAlert['type'], message: string, severity: MetricAlert['severity']) {
    const alert: MetricAlert = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      message,
      severity
    };

    this.alerts.push(alert);
    this.saveAlerts();
    console.warn(`[Metrics Alert] [${severity.toUpperCase()}] ${message}`);
  }

  getMetrics(filters?: {
    type?: MetricEntry['type'];
    category?: string;
    since?: Date;
  }): MetricEntry[] {
    let filtered = [...this.metrics];

    if (filters?.type) {
      filtered = filtered.filter(m => m.type === filters.type);
    }

    if (filters?.category) {
      filtered = filtered.filter(m => m.category === filters.category);
    }

    if (filters?.since) {
      filtered = filtered.filter(m => new Date(m.timestamp) >= filters.since);
    }

    return filtered.reverse();
  }

  getAlerts(): MetricAlert[] {
    return this.alerts.reverse();
  }

  getStats() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => new Date(m.timestamp) >= last24h);

    return {
      totalMetrics: this.metrics.length,
      last24h: recentMetrics.length,
      byType: this.groupBy(recentMetrics, 'type'),
      byCategory: this.groupBy(recentMetrics, 'category'),
      counters: Object.fromEntries(this.counters),
      alerts: this.alerts.length,
      storageUsage: this.getStorageUsage()
    };
  }

  private groupBy(metrics: MetricEntry[], key: keyof MetricEntry) {
    const grouped: Record<string, number> = {};
    for (const m of metrics) {
      const value = m[key] as string;
      grouped[value] = (grouped[value] || 0) + 1;
    }
    return grouped;
  }

  private getStorageUsage(): number {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          total += localStorage.getItem(key)?.length || 0;
        }
      }
      const maxQuota = 5 * 1024 * 1024;
      return (total / maxQuota) * 100;
    } catch {
      return 0;
    }
  }

  clearOldMetrics(daysToKeep: number = 7) {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => new Date(m.timestamp) >= cutoff);
    this.saveMetrics();
  }

  clearMetrics() {
    this.metrics = [];
    this.counters.clear();
    this.saveMetrics();
  }

  clearAlerts() {
    this.alerts = [];
    this.saveAlerts();
  }
}

export const metricsManager = new MetricsManager();

export function initMetrics() {
  metricsManager.init();
}

export function recordSyncMetric(duration: number, success: boolean, tableCount?: number) {
  metricsManager.recordSync(duration, success, tableCount);
}

export function recordRenderMetric(component: string, duration: number) {
  metricsManager.recordRender(component, duration);
}

export function recordErrorMetric(type: string, severity: 'low' | 'medium' | 'high' | 'critical') {
  metricsManager.recordError(type, severity);
}

export function recordUserAction(action: string, metadata?: Record<string, unknown>) {
  metricsManager.recordUserAction(action, metadata);
}

export function startMetricTimer(category: string) {
  metricsManager.startTimer(category);
}

export function endMetricTimer(category: string) {
  return metricsManager.endTimer(category);
}
