/**
 * ============================================================
 * SECURITY MODULE INDEX
 * 보안 모듈 통합 내보내기
 * ============================================================
 */

// Rate Limiting
export {
  RateLimiter,
  apiRateLimiter,
  authRateLimiter,
  signupRateLimiter,
  aiRateLimiter,
  paymentRateLimiter,
  uploadRateLimiter,
  checkRateLimit,
  getRateLimitHeaders,
  getClientIP,
  getStoreStats,
  type RateLimitConfig,
  type RateLimitResult,
  type RateLimitHeaders
} from './rate-limiter';

// Input Validation
export {
  escapeHtml,
  sanitizeHtml,
  detectSqlInjection,
  detectNoSqlInjection,
  detectCommandInjection,
  detectPathTraversal,
  escapeSql,
  escapeShellArg,
  escapeLdap,
  sanitizeFilename,
  safeStringSchema,
  safeEmailSchema,
  safePasswordSchema,
  safeUsernameSchema,
  safeFilePathSchema,
  safeUrlSchema,
  safeJsonSchema,
  validateInput,
  validateRequestBody,
  type ValidationResult
} from './input-validator';

// Security Headers
export {
  buildCSPHeader,
  getSecurityHeaders,
  applySecurityHeaders,
  securityHeadersMiddleware,
  getCORSHeaders,
  handleCORSPreflight,
  type CSPDirectives,
  type SecurityHeadersConfig,
  type CORSConfig
} from './security-headers';

// Enterprise Audit
export {
  enterpriseAudit,
  auditLogin,
  auditDataAccess,
  auditSecurityEvent,
  type AuditCategory,
  type AuditSeverity,
  type AuditEventType,
  type AuditRecord,
  type AuthenticationEvent,
  type AuthorizationEvent,
  type DataEvent,
  type SecurityEvent
} from './enterprise-audit';

// E2E Encryption
export {
  deriveKeyFromPassword,
  generateKey,
  encrypt,
  decrypt,
  encryptSensitiveFields,
  decryptSensitiveFields,
  EncryptionVault,
  getEncryptionVault,
  resetEncryptionVault,
  isSensitiveField,
  hashData,
  generateSecureToken,
  wrapKey,
  unwrapKey,
  type EncryptedData,
  type DerivedKey,
  type KeyHierarchy,
  type EncryptionContext
} from './e2e-encryption';

// Redis Rate Limiter (Distributed)
export {
  RedisRateLimiter,
  getRedisRateLimiter,
  initializeRedisRateLimiter,
  createRateLimitHeaders,
  DEFAULT_TIERS,
  type RateLimitConfig as RedisRateLimitConfig,
  type RateLimitResult as RedisRateLimitResult,
  type RateLimitTier,
  type RateLimitMetrics,
  type RedisClient
} from './redis-rate-limiter';

