/**
 * ============================================================
 * ENTERPRISE AUDIT SYSTEM
 * 엔터프라이즈급 감사 로그 시스템
 * ============================================================
 * 
 * 규정 준수:
 * - FDA 21 CFR Part 11 (전자 기록/서명)
 * - HIPAA (의료 정보 보호)
 * - GDPR (개인정보 보호)
 * - SOC 2 Type II
 */

import { generateSHA256Hash } from '../security';

// ============================================
// AUDIT EVENT TYPES
// ============================================

export type AuditCategory = 
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'DATA_ACCESS'
  | 'DATA_MODIFICATION'
  | 'SYSTEM_CONFIG'
  | 'SECURITY'
  | 'COMPLIANCE'
  | 'PAYMENT'
  | 'USER_MANAGEMENT';

export type AuditSeverity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type AuthenticationEvent = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'MFA_VERIFIED'
  | 'MFA_FAILED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'SESSION_EXPIRED'
  | 'SESSION_REVOKED'
  | 'TOKEN_REFRESHED';

export type AuthorizationEvent = 
  | 'ACCESS_GRANTED'
  | 'ACCESS_DENIED'
  | 'PERMISSION_CHANGED'
  | 'ROLE_ASSIGNED'
  | 'ROLE_REVOKED'
  | 'PRIVILEGE_ESCALATION_ATTEMPT';

export type DataEvent = 
  | 'DATA_READ'
  | 'DATA_CREATED'
  | 'DATA_UPDATED'
  | 'DATA_DELETED'
  | 'DATA_EXPORTED'
  | 'DATA_IMPORTED'
  | 'DATA_ANONYMIZED'
  | 'DATA_RESTORED'
  | 'BULK_OPERATION';

export type SecurityEvent = 
  | 'RATE_LIMIT_EXCEEDED'
  | 'BRUTE_FORCE_DETECTED'
  | 'INJECTION_ATTEMPT'
  | 'XSS_ATTEMPT'
  | 'CSRF_ATTEMPT'
  | 'UNAUTHORIZED_IP'
  | 'SUSPICIOUS_ACTIVITY'
  | 'VULNERABILITY_DETECTED'
  | 'SECURITY_SCAN';

export type AuditEventType = 
  | AuthenticationEvent 
  | AuthorizationEvent 
  | DataEvent 
  | SecurityEvent;

// ============================================
// AUDIT RECORD INTERFACE
// ============================================

export interface AuditRecord {
  /** 고유 식별자 (UUID v4) */
  id: string;
  /** 타임스탬프 (ISO 8601 UTC) */
  timestamp: string;
  /** 카테고리 */
  category: AuditCategory;
  /** 이벤트 유형 */
  eventType: AuditEventType;
  /** 심각도 */
  severity: AuditSeverity;
  /** 사용자 ID */
  userId?: string;
  /** 사용자 이메일 (마스킹) */
  userEmail?: string;
  /** 세션 ID */
  sessionId?: string;
  /** 클라이언트 IP */
  clientIp?: string;
  /** User Agent */
  userAgent?: string;
  /** 리소스 유형 */
  resourceType?: string;
  /** 리소스 ID */
  resourceId?: string;
  /** 수행된 작업 */
  action: string;
  /** 상세 설명 */
  description: string;
  /** 이전 값 (데이터 변경 시) */
  previousValue?: unknown;
  /** 새 값 (데이터 변경 시) */
  newValue?: unknown;
  /** 성공 여부 */
  success: boolean;
  /** 실패 사유 */
  failureReason?: string;
  /** 추가 메타데이터 */
  metadata?: Record<string, unknown>;
  /** 요청 ID (분산 추적) */
  requestId?: string;
  /** 체크섬 (무결성 검증) */
  checksum: string;
  /** 이전 레코드 체크섬 (체인) */
  previousChecksum: string;
}

// ============================================
// AUDIT LOGGER CLASS
// ============================================

class EnterpriseAuditLogger {
  private logs: AuditRecord[] = [];
  private genesisChecksum = 'GENESIS_0x00000000';
  private maxLogsInMemory = 10000;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('enterprise:audit:v1');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch {
      this.logs = [];
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      // 메모리 제한
      if (this.logs.length > this.maxLogsInMemory) {
        this.logs = this.logs.slice(-this.maxLogsInMemory);
      }
      localStorage.setItem('enterprise:audit:v1', JSON.stringify(this.logs));
    } catch {
      // Storage quota exceeded - 오래된 로그 정리
      this.logs = this.logs.slice(-1000);
      try {
        localStorage.setItem('enterprise:audit:v1', JSON.stringify(this.logs));
      } catch {
        // 무시
      }
    }
  }

  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `AUD-${timestamp}-${random}`.toUpperCase();
  }

  private async computeChecksum(record: Omit<AuditRecord, 'checksum'>): Promise<string> {
    const payload = JSON.stringify(record);
    return await generateSHA256Hash(payload);
  }

  private getLastChecksum(): string {
    if (this.logs.length === 0) return this.genesisChecksum;
    return this.logs[this.logs.length - 1].checksum;
  }

  /**
   * 감사 로그 기록
   */
  async log(params: {
    category: AuditCategory;
    eventType: AuditEventType;
    severity?: AuditSeverity;
    userId?: string;
    userEmail?: string;
    sessionId?: string;
    clientIp?: string;
    userAgent?: string;
    resourceType?: string;
    resourceId?: string;
    action: string;
    description: string;
    previousValue?: unknown;
    newValue?: unknown;
    success: boolean;
    failureReason?: string;
    metadata?: Record<string, unknown>;
    requestId?: string;
  }): Promise<AuditRecord> {
    const previousChecksum = this.getLastChecksum();

    const baseRecord: Omit<AuditRecord, 'checksum'> = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      category: params.category,
      eventType: params.eventType,
      severity: params.severity ?? 'INFO',
      userId: params.userId,
      userEmail: params.userEmail ? this.maskEmail(params.userEmail) : undefined,
      sessionId: params.sessionId,
      clientIp: params.clientIp,
      userAgent: params.userAgent,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      action: params.action,
      description: params.description,
      previousValue: params.previousValue,
      newValue: params.newValue,
      success: params.success,
      failureReason: params.failureReason,
      metadata: params.metadata,
      requestId: params.requestId,
      previousChecksum
    };

    const checksum = await this.computeChecksum(baseRecord);
    const record: AuditRecord = { ...baseRecord, checksum };

    this.logs.push(record);
    this.saveToStorage();

    // 콘솔 출력 (개발용)
    this.consoleLog(record);

    return record;
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***@***';
    const maskedLocal = local.substring(0, 2) + '***';
    return `${maskedLocal}@${domain}`;
  }

  private consoleLog(record: AuditRecord): void {
    const icons: Record<AuditSeverity, string> = {
      DEBUG: '🔍',
      INFO: 'ℹ️',
      WARNING: '⚠️',
      ERROR: '❌',
      CRITICAL: '🚨'
    };

    const icon = icons[record.severity];
    const prefix = `[AUDIT] ${icon} ${record.category}/${record.eventType}`;
    
    if (record.severity === 'CRITICAL' || record.severity === 'ERROR') {
      console.error(prefix, record.description, record);
    } else if (record.severity === 'WARNING') {
      console.warn(prefix, record.description);
    } else {
      console.log(prefix, record.description);
    }
  }

  /**
   * 체인 무결성 검증
   */
  async verifyIntegrity(): Promise<{
    valid: boolean;
    totalRecords: number;
    brokenAt?: number;
    message: string;
  }> {
    if (this.logs.length === 0) {
      return { valid: true, totalRecords: 0, message: 'Empty audit log' };
    }

    let expectedPrevChecksum = this.genesisChecksum;

    for (let i = 0; i < this.logs.length; i++) {
      const record = this.logs[i];

      // 이전 체크섬 확인
      if (record.previousChecksum !== expectedPrevChecksum) {
        return {
          valid: false,
          totalRecords: this.logs.length,
          brokenAt: i,
          message: `Chain broken at record ${i}: previousChecksum mismatch`
        };
      }

      // 현재 레코드 체크섬 확인
      const { checksum, ...baseRecord } = record;
      const computedChecksum = await this.computeChecksum(baseRecord as Omit<AuditRecord, 'checksum'>);
      
      if (checksum !== computedChecksum) {
        return {
          valid: false,
          totalRecords: this.logs.length,
          brokenAt: i,
          message: `Tampering detected at record ${i}: checksum mismatch`
        };
      }

      expectedPrevChecksum = record.checksum;
    }

    return {
      valid: true,
      totalRecords: this.logs.length,
      message: `Audit chain verified: ${this.logs.length} records`
    };
  }

  /**
   * 로그 조회
   */
  query(filters: {
    category?: AuditCategory;
    eventType?: AuditEventType;
    userId?: string;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
    limit?: number;
    offset?: number;
  }): AuditRecord[] {
    let results = [...this.logs];

    if (filters.category) {
      results = results.filter(r => r.category === filters.category);
    }
    if (filters.eventType) {
      results = results.filter(r => r.eventType === filters.eventType);
    }
    if (filters.userId) {
      results = results.filter(r => r.userId === filters.userId);
    }
    if (filters.severity) {
      results = results.filter(r => r.severity === filters.severity);
    }
    if (filters.success !== undefined) {
      results = results.filter(r => r.success === filters.success);
    }
    if (filters.startDate) {
      results = results.filter(r => new Date(r.timestamp) >= filters.startDate!);
    }
    if (filters.endDate) {
      results = results.filter(r => new Date(r.timestamp) <= filters.endDate!);
    }

    // 최신순 정렬
    results.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 100;
    return results.slice(offset, offset + limit);
  }

  /**
   * 보안 알림 조회
   */
  getSecurityAlerts(): AuditRecord[] {
    return this.query({
      category: 'SECURITY',
      severity: 'CRITICAL',
      limit: 50
    });
  }

  /**
   * 실패한 로그인 시도 조회
   */
  getFailedLogins(hours: number = 24): AuditRecord[] {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.logs.filter(r => 
      r.eventType === 'LOGIN_FAILED' &&
      new Date(r.timestamp) >= startDate
    );
  }

  /**
   * 통계 조회
   */
  getStats(hours: number = 24): {
    totalEvents: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    failedLogins: number;
    securityAlerts: number;
  } {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recent = this.logs.filter(r => new Date(r.timestamp) >= startDate);

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let failedLogins = 0;
    let securityAlerts = 0;

    for (const record of recent) {
      byCategory[record.category] = (byCategory[record.category] ?? 0) + 1;
      bySeverity[record.severity] = (bySeverity[record.severity] ?? 0) + 1;
      
      if (record.eventType === 'LOGIN_FAILED') failedLogins++;
      if (record.category === 'SECURITY' && record.severity === 'CRITICAL') {
        securityAlerts++;
      }
    }

    return {
      totalEvents: recent.length,
      byCategory,
      bySeverity,
      failedLogins,
      securityAlerts
    };
  }

  /**
   * 로그 내보내기 (CSV)
   */
  exportToCSV(): string {
    const headers = [
      'ID', 'Timestamp', 'Category', 'EventType', 'Severity',
      'UserId', 'UserEmail', 'ClientIP', 'Action', 'Description',
      'Success', 'FailureReason', 'ResourceType', 'ResourceId'
    ];

    const rows = this.logs.map(r => [
      r.id,
      r.timestamp,
      r.category,
      r.eventType,
      r.severity,
      r.userId ?? '',
      r.userEmail ?? '',
      r.clientIp ?? '',
      r.action,
      `"${r.description.replace(/"/g, '""')}"`,
      r.success ? 'true' : 'false',
      r.failureReason ?? '',
      r.resourceType ?? '',
      r.resourceId ?? ''
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const enterpriseAudit = new EnterpriseAuditLogger();

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export async function auditLogin(params: {
  userId: string;
  userEmail: string;
  success: boolean;
  clientIp?: string;
  userAgent?: string;
  failureReason?: string;
}): Promise<AuditRecord> {
  return enterpriseAudit.log({
    category: 'AUTHENTICATION',
    eventType: params.success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
    severity: params.success ? 'INFO' : 'WARNING',
    userId: params.userId,
    userEmail: params.userEmail,
    clientIp: params.clientIp,
    userAgent: params.userAgent,
    action: 'USER_LOGIN',
    description: params.success 
      ? `User ${params.userEmail} logged in successfully`
      : `Failed login attempt for ${params.userEmail}`,
    success: params.success,
    failureReason: params.failureReason
  });
}

export async function auditDataAccess(params: {
  userId: string;
  resourceType: string;
  resourceId: string;
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE';
  success: boolean;
  previousValue?: unknown;
  newValue?: unknown;
  clientIp?: string;
}): Promise<AuditRecord> {
  const eventTypes: Record<string, DataEvent> = {
    READ: 'DATA_READ',
    CREATE: 'DATA_CREATED',
    UPDATE: 'DATA_UPDATED',
    DELETE: 'DATA_DELETED'
  };

  return enterpriseAudit.log({
    category: 'DATA_ACCESS',
    eventType: eventTypes[params.action],
    severity: params.action === 'DELETE' ? 'WARNING' : 'INFO',
    userId: params.userId,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    action: params.action,
    description: `${params.action} ${params.resourceType}:${params.resourceId}`,
    success: params.success,
    previousValue: params.previousValue,
    newValue: params.newValue,
    clientIp: params.clientIp
  });
}

export async function auditSecurityEvent(params: {
  eventType: SecurityEvent;
  severity: AuditSeverity;
  description: string;
  clientIp?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}): Promise<AuditRecord> {
  return enterpriseAudit.log({
    category: 'SECURITY',
    eventType: params.eventType,
    severity: params.severity,
    userId: params.userId,
    clientIp: params.clientIp,
    action: params.eventType,
    description: params.description,
    success: false,
    metadata: params.metadata
  });
}

export default enterpriseAudit;


