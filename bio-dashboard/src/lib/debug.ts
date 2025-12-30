/**
 * ============================================================
 * DEBUG UTILITIES
 * Safe logging for development only
 * ============================================================
 * 
 * IMPORTANT: All console.log statements should use these utilities
 * to prevent sensitive data exposure in production.
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.ENABLE_DEBUG === 'true';

/**
 * Safe console.log - only outputs in development
 */
export function debugLog(...args: unknown[]): void {
  if (isDevelopment || isDebugEnabled) {
    console.log('[DEBUG]', ...args);
  }
}

/**
 * Safe console.warn - only outputs in development
 */
export function debugWarn(...args: unknown[]): void {
  if (isDevelopment || isDebugEnabled) {
    console.warn('[DEBUG WARN]', ...args);
  }
}

/**
 * Safe console.error - outputs in all environments but sanitized
 */
export function debugError(message: string, error?: unknown): void {
  if (isDevelopment) {
    console.error('[ERROR]', message, error);
  } else {
    // In production, log only the message, not the full error
    console.error('[ERROR]', message);
    // Send to monitoring service (Sentry, Datadog, etc.)
    // logToMonitoringService(message, error);
  }
}

/**
 * Redact sensitive data from logs
 */
export function redact(data: unknown, sensitiveKeys: string[] = []): unknown {
  const defaultSensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'cookie',
    'session',
    'credit_card',
    'ssn',
    'email',
    'phone',
    'address',
  ];

  const keysToRedact = [...defaultSensitiveKeys, ...sensitiveKeys];

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redact(item, sensitiveKeys));
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const isKeyToRedact = keysToRedact.some(k => 
      key.toLowerCase().includes(k.toLowerCase())
    );

    if (isKeyToRedact) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redact(value, sensitiveKeys);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Time a function execution (development only)
 */
export function measureTime<T>(label: string, fn: () => T): T {
  if (!isDevelopment) {
    return fn();
  }

  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`[PERF] ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

/**
 * Time an async function execution (development only)
 */
export async function measureTimeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!isDevelopment) {
    return fn();
  }

  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  console.log(`[PERF] ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

/**
 * Assert condition in development (no-op in production)
 */
export function assert(condition: boolean, message: string): void {
  if (isDevelopment && !condition) {
    throw new Error(`[ASSERT FAILED] ${message}`);
  }
}

export default {
  log: debugLog,
  warn: debugWarn,
  error: debugError,
  redact,
  measureTime,
  measureTimeAsync,
  assert,
};


