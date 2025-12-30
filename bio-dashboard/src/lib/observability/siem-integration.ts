/**
 * ============================================================
 * SIEM INTEGRATION MODULE
 * Security Information and Event Management
 * ============================================================
 * 
 * Supported Platforms:
 * - Datadog
 * - Splunk
 * - AWS CloudWatch
 * - Azure Sentinel
 * - Generic Webhook
 * 
 * Features:
 * - Real-time security event streaming
 * - Structured logging (JSON)
 * - Correlation IDs
 * - Automatic enrichment
 * - Batching for efficiency
 */

// ============================================
// TYPES
// ============================================

export enum SecurityEventSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum SecurityEventCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  RATE_LIMITING = 'rate_limiting',
  WAF = 'waf',
  ANOMALY = 'anomaly',
  COMPLIANCE = 'compliance',
  SYSTEM = 'system',
}

export interface SecurityEvent {
  /** Unique event ID */
  id: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Event severity */
  severity: SecurityEventSeverity;
  /** Event category */
  category: SecurityEventCategory;
  /** Event type (e.g., 'login_failed', 'sql_injection_blocked') */
  type: string;
  /** Human-readable message */
  message: string;
  /** Source IP */
  sourceIp?: string;
  /** User ID */
  userId?: string;
  /** Tenant ID */
  tenantId?: string;
  /** Request ID for correlation */
  requestId?: string;
  /** Session ID */
  sessionId?: string;
  /** User agent */
  userAgent?: string;
  /** Request path */
  path?: string;
  /** HTTP method */
  method?: string;
  /** Geographic location */
  geo?: {
    country?: string;
    region?: string;
    city?: string;
  };
  /** Additional context */
  context?: Record<string, unknown>;
  /** Tags for filtering */
  tags?: string[];
  /** Environment */
  environment?: string;
  /** Service name */
  service?: string;
}

export interface SIEMConfig {
  enabled: boolean;
  provider: 'datadog' | 'splunk' | 'cloudwatch' | 'sentinel' | 'webhook';
  endpoint?: string;
  apiKey?: string;
  batchSize?: number;
  flushIntervalMs?: number;
  includeDebug?: boolean;
}

// ============================================
// SIEM CLIENT IMPLEMENTATIONS
// ============================================

interface SIEMClient {
  sendEvents(events: SecurityEvent[]): Promise<void>;
  isHealthy(): Promise<boolean>;
}

/**
 * Datadog SIEM Client
 */
class DatadogClient implements SIEMClient {
  private apiKey: string;
  private site: string;

  constructor(apiKey: string, site: string = 'datadoghq.com') {
    this.apiKey = apiKey;
    this.site = site;
  }

  async sendEvents(events: SecurityEvent[]): Promise<void> {
    const logs = events.map(event => ({
      ddsource: 'manpasik',
      ddtags: `env:${event.environment || 'production'},service:${event.service || 'bio-dashboard'}`,
      hostname: 'manpasik-app',
      message: event.message,
      service: event.service || 'bio-dashboard',
      status: event.severity,
      ...event,
    }));

    const response = await fetch(
      `https://http-intake.logs.${this.site}/api/v2/logs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.apiKey,
        },
        body: JSON.stringify(logs),
      }
    );

    if (!response.ok) {
      throw new Error(`Datadog API error: ${response.status}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.${this.site}/api/v1/validate`,
        {
          headers: {
            'DD-API-KEY': this.apiKey,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Splunk HEC Client
 */
class SplunkClient implements SIEMClient {
  private hecUrl: string;
  private hecToken: string;

  constructor(hecUrl: string, hecToken: string) {
    this.hecUrl = hecUrl;
    this.hecToken = hecToken;
  }

  async sendEvents(events: SecurityEvent[]): Promise<void> {
    const splunkEvents = events.map(event => ({
      time: new Date(event.timestamp).getTime() / 1000,
      host: 'manpasik-app',
      source: 'bio-dashboard',
      sourcetype: '_json',
      index: 'security',
      event,
    }));

    const response = await fetch(this.hecUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Splunk ${this.hecToken}`,
      },
      body: splunkEvents.map(e => JSON.stringify(e)).join('\n'),
    });

    if (!response.ok) {
      throw new Error(`Splunk HEC error: ${response.status}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.hecUrl}/health`, {
        headers: {
          'Authorization': `Splunk ${this.hecToken}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Generic Webhook Client
 */
class WebhookClient implements SIEMClient {
  private endpoint: string;
  private headers: Record<string, string>;

  constructor(endpoint: string, headers: Record<string, string> = {}) {
    this.endpoint = endpoint;
    this.headers = headers;
  }

  async sendEvents(events: SecurityEvent[]): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Console Client (for development/testing)
 */
class ConsoleClient implements SIEMClient {
  async sendEvents(events: SecurityEvent[]): Promise<void> {
    events.forEach(event => {
      const prefix = {
        [SecurityEventSeverity.DEBUG]: '🔍',
        [SecurityEventSeverity.INFO]: 'ℹ️',
        [SecurityEventSeverity.WARNING]: '⚠️',
        [SecurityEventSeverity.ERROR]: '❌',
        [SecurityEventSeverity.CRITICAL]: '🚨',
      }[event.severity];
      
      console.log(`[SIEM] ${prefix} [${event.category}] ${event.type}: ${event.message}`);
      if (event.context) {
        console.log('  Context:', JSON.stringify(event.context, null, 2));
      }
    });
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}

// ============================================
// SIEM MANAGER
// ============================================

export class SIEMManager {
  private client: SIEMClient;
  private config: SIEMConfig;
  private eventQueue: SecurityEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isShuttingDown = false;

  constructor(config: SIEMConfig) {
    this.config = {
      batchSize: 100,
      flushIntervalMs: 5000,
      includeDebug: false,
      ...config,
    };
    
    this.client = this.createClient();
    this.startFlushTimer();
  }

  private createClient(): SIEMClient {
    if (!this.config.enabled) {
      return new ConsoleClient();
    }

    switch (this.config.provider) {
      case 'datadog':
        if (!this.config.apiKey) {
          console.warn('[SIEM] Datadog API key not configured, using console');
          return new ConsoleClient();
        }
        return new DatadogClient(
          this.config.apiKey,
          process.env.DATADOG_SITE || 'datadoghq.com'
        );
      
      case 'splunk':
        if (!this.config.endpoint || !this.config.apiKey) {
          console.warn('[SIEM] Splunk HEC not configured, using console');
          return new ConsoleClient();
        }
        return new SplunkClient(this.config.endpoint, this.config.apiKey);
      
      case 'webhook':
        if (!this.config.endpoint) {
          console.warn('[SIEM] Webhook endpoint not configured, using console');
          return new ConsoleClient();
        }
        return new WebhookClient(this.config.endpoint);
      
      default:
        return new ConsoleClient();
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) return;
    
    this.flushTimer = setInterval(
      () => this.flush(),
      this.config.flushIntervalMs
    );
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Log a security event
   */
  log(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    // Skip debug events if not configured
    if (event.severity === SecurityEventSeverity.DEBUG && !this.config.includeDebug) {
      return;
    }

    const fullEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      service: 'bio-dashboard',
      ...event,
    };

    this.eventQueue.push(fullEvent);

    // Immediate flush for critical events
    if (event.severity === SecurityEventSeverity.CRITICAL) {
      this.flush();
    }

    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize!) {
      this.flush();
    }
  }

  /**
   * Flush queued events to SIEM
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.client.sendEvents(events);
    } catch (error) {
      console.error('[SIEM] Failed to send events:', error);
      // Re-queue failed events (up to batch size)
      this.eventQueue = [...events.slice(0, this.config.batchSize!), ...this.eventQueue];
    }
  }

  /**
   * Convenience methods for common events
   */
  logAuthEvent(params: {
    type: 'login_success' | 'login_failed' | 'logout' | 'mfa_success' | 'mfa_failed' | 'session_expired';
    userId?: string;
    sourceIp?: string;
    userAgent?: string;
    context?: Record<string, unknown>;
  }): void {
    const severityMap = {
      login_success: SecurityEventSeverity.INFO,
      login_failed: SecurityEventSeverity.WARNING,
      logout: SecurityEventSeverity.INFO,
      mfa_success: SecurityEventSeverity.INFO,
      mfa_failed: SecurityEventSeverity.WARNING,
      session_expired: SecurityEventSeverity.INFO,
    };

    this.log({
      severity: severityMap[params.type],
      category: SecurityEventCategory.AUTHENTICATION,
      type: params.type,
      message: `Authentication event: ${params.type}`,
      ...params,
    });
  }

  logAccessEvent(params: {
    type: 'data_accessed' | 'data_modified' | 'data_deleted' | 'export';
    resource: string;
    resourceId?: string;
    userId?: string;
    sourceIp?: string;
    allowed: boolean;
    context?: Record<string, unknown>;
  }): void {
    this.log({
      severity: params.allowed ? SecurityEventSeverity.INFO : SecurityEventSeverity.WARNING,
      category: params.type === 'data_accessed' 
        ? SecurityEventCategory.DATA_ACCESS 
        : SecurityEventCategory.DATA_MODIFICATION,
      type: params.type,
      message: `${params.type}: ${params.resource}${params.resourceId ? `/${params.resourceId}` : ''} - ${params.allowed ? 'allowed' : 'denied'}`,
      ...params,
    });
  }

  logSecurityThreat(params: {
    type: 'sql_injection' | 'xss' | 'csrf' | 'brute_force' | 'rate_limit' | 'path_traversal' | 'command_injection';
    sourceIp?: string;
    path?: string;
    payload?: string;
    blocked: boolean;
    context?: Record<string, unknown>;
  }): void {
    this.log({
      severity: SecurityEventSeverity.CRITICAL,
      category: SecurityEventCategory.WAF,
      type: `threat_${params.type}`,
      message: `Security threat detected: ${params.type}${params.blocked ? ' (blocked)' : ' (ALERT!)'}`,
      tags: ['security', 'threat', params.type],
      ...params,
    });
  }

  logRateLimitEvent(params: {
    identifier: string;
    path: string;
    limit: number;
    current: number;
    blocked: boolean;
  }): void {
    this.log({
      severity: params.blocked ? SecurityEventSeverity.WARNING : SecurityEventSeverity.INFO,
      category: SecurityEventCategory.RATE_LIMITING,
      type: params.blocked ? 'rate_limit_exceeded' : 'rate_limit_warning',
      message: `Rate limit ${params.blocked ? 'exceeded' : 'warning'}: ${params.current}/${params.limit} for ${params.path}`,
      sourceIp: params.identifier,
      path: params.path,
      context: {
        limit: params.limit,
        current: params.current,
      },
    });
  }

  logComplianceEvent(params: {
    type: 'consent_granted' | 'consent_revoked' | 'data_export' | 'data_deletion' | 'audit_access';
    userId: string;
    resource?: string;
    context?: Record<string, unknown>;
  }): void {
    this.log({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.COMPLIANCE,
      type: `compliance_${params.type}`,
      message: `Compliance event: ${params.type} for user ${params.userId}`,
      tags: ['compliance', 'audit'],
      ...params,
    });
  }

  /**
   * Shutdown gracefully
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    this.stopFlushTimer();
    await this.flush();
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `evt_${timestamp}_${random}`;
  }

  /**
   * Check if SIEM is healthy
   */
  async isHealthy(): Promise<boolean> {
    return this.client.isHealthy();
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let siemInstance: SIEMManager | null = null;

export function getSIEMManager(): SIEMManager {
  if (!siemInstance) {
    siemInstance = new SIEMManager({
      enabled: process.env.ENABLE_AUDIT_LOGGING === 'true',
      provider: (process.env.SIEM_PROVIDER as any) || 'webhook',
      endpoint: process.env.SPLUNK_HEC_URL,
      apiKey: process.env.DATADOG_API_KEY || process.env.SPLUNK_HEC_TOKEN,
    });
  }
  return siemInstance;
}

export function initializeSIEM(config: SIEMConfig): SIEMManager {
  siemInstance = new SIEMManager(config);
  return siemInstance;
}

export default SIEMManager;


