/**
 * ============================================================
 * ENTERPRISE INPUT VALIDATOR
 * 입력 검증 및 살균 - 엔터프라이즈급 보안
 * ============================================================
 * 
 * 방어 대상:
 * - XSS (Cross-Site Scripting)
 * - SQL Injection
 * - NoSQL Injection
 * - Command Injection
 * - Path Traversal
 * - LDAP Injection
 */

import { z } from 'zod';

// ============================================
// XSS 방지 - HTML 이스케이프
// ============================================

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * HTML 특수문자 이스케이프
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, char => HTML_ESCAPE_MAP[char] || char);
}

/**
 * 스크립트 태그 및 위험한 속성 제거
 */
export function sanitizeHtml(html: string): string {
  // 스크립트 태그 제거
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // 이벤트 핸들러 속성 제거 (on*)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // javascript: 프로토콜 제거
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // data: 프로토콜 제거 (이미지 제외)
  sanitized = sanitized.replace(/data:(?!image\/(png|jpeg|gif|webp))[^;,]*/gi, '');
  
  // vbscript: 프로토콜 제거
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // expression() 제거 (IE CSS 해킹)
  sanitized = sanitized.replace(/expression\s*\(/gi, '');
  
  // style 태그 제거
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // iframe 제거 (필요시 화이트리스트 방식으로 허용)
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  return sanitized;
}

// ============================================
// SQL INJECTION 방지
// ============================================

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION|DECLARE)\b)/i,
  /(--)|(;)|(\/\*)|(\*\/)/,
  /(\bOR\b|\bAND\b)\s*\d+\s*=\s*\d+/i,
  /'\s*OR\s*'1'\s*=\s*'1/i,
  /'\s*OR\s*''='/i,
  /'\s*;\s*--/i,
  /\bWAITFOR\s+DELAY\b/i,
  /\bBENCHMARK\s*\(/i,
  /\bSLEEP\s*\(/i
];

/**
 * SQL Injection 패턴 감지
 */
export function detectSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * SQL 문자열 이스케이프 (파라미터 바인딩 권장)
 */
export function escapeSql(str: string): string {
  return str
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\x00/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
}

// ============================================
// NOSQL INJECTION 방지
// ============================================

const NOSQL_INJECTION_PATTERNS = [
  /\$where/i,
  /\$gt/i,
  /\$gte/i,
  /\$lt/i,
  /\$lte/i,
  /\$ne/i,
  /\$in/i,
  /\$nin/i,
  /\$or/i,
  /\$and/i,
  /\$not/i,
  /\$regex/i,
  /\$exists/i,
  /\$type/i,
  /\$expr/i,
  /\$jsonSchema/i
];

/**
 * NoSQL Injection 패턴 감지
 */
export function detectNoSqlInjection(input: string): boolean {
  return NOSQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

// ============================================
// COMMAND INJECTION 방지
// ============================================

const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]<>]/,
  /\$\(/,
  /`.*`/,
  /\|\|/,
  /&&/,
  /\n/,
  /\r/
];

/**
 * Command Injection 패턴 감지
 */
export function detectCommandInjection(input: string): boolean {
  return COMMAND_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * 쉘 명령 인자 이스케이프
 */
export function escapeShellArg(arg: string): string {
  // 단일 따옴표로 감싸고, 내부 단일 따옴표는 이스케이프
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

// ============================================
// PATH TRAVERSAL 방지
// ============================================

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e%2f/i,
  /%2e%2e\//i,
  /\.\.%2f/i,
  /%2e%2e%5c/i,
  /\.\.%5c/i,
  /%252e%252e%252f/i
];

/**
 * Path Traversal 패턴 감지
 */
export function detectPathTraversal(input: string): boolean {
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * 파일명 살균 (안전한 문자만 허용)
 */
export function sanitizeFilename(filename: string): string {
  // 경로 구분자 제거
  let safe = filename.replace(/[\/\\]/g, '');
  // 위험한 문자 제거
  safe = safe.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
  // 선행 점 제거 (숨김 파일 방지)
  safe = safe.replace(/^\.+/, '');
  // 길이 제한
  return safe.slice(0, 255);
}

// ============================================
// LDAP INJECTION 방지
// ============================================

/**
 * LDAP 특수문자 이스케이프
 */
export function escapeLdap(str: string): string {
  const escapeChars: Record<string, string> = {
    '\\': '\\5c',
    '*': '\\2a',
    '(': '\\28',
    ')': '\\29',
    '\0': '\\00'
  };
  
  return str.replace(/[\\*()\\0]/g, char => escapeChars[char] || char);
}

// ============================================
// 통합 검증 스키마 (Zod)
// ============================================

/**
 * 안전한 문자열 스키마
 */
export const safeStringSchema = z.string()
  .transform(str => str.trim())
  .refine(str => !detectSqlInjection(str), {
    message: '잠재적으로 위험한 SQL 패턴이 감지되었습니다'
  })
  .refine(str => !detectNoSqlInjection(str), {
    message: '잠재적으로 위험한 NoSQL 패턴이 감지되었습니다'
  })
  .refine(str => !detectCommandInjection(str), {
    message: '잠재적으로 위험한 명령어 패턴이 감지되었습니다'
  });

/**
 * 안전한 이메일 스키마
 */
export const safeEmailSchema = z.string()
  .email({ message: '유효한 이메일 주소를 입력해주세요' })
  .toLowerCase()
  .refine(str => !detectSqlInjection(str), {
    message: '유효하지 않은 이메일 형식입니다'
  });

/**
 * 안전한 비밀번호 스키마
 */
export const safePasswordSchema = z.string()
  .min(8, { message: '비밀번호는 8자 이상이어야 합니다' })
  .max(128, { message: '비밀번호는 128자를 초과할 수 없습니다' })
  .regex(/[A-Z]/, { message: '대문자를 포함해야 합니다' })
  .regex(/[a-z]/, { message: '소문자를 포함해야 합니다' })
  .regex(/[0-9]/, { message: '숫자를 포함해야 합니다' })
  .regex(/[^A-Za-z0-9]/, { message: '특수문자를 포함해야 합니다' });

/**
 * 안전한 사용자명 스키마
 */
export const safeUsernameSchema = z.string()
  .min(2, { message: '사용자명은 2자 이상이어야 합니다' })
  .max(30, { message: '사용자명은 30자를 초과할 수 없습니다' })
  .regex(/^[a-zA-Z0-9가-힣_-]+$/, {
    message: '사용자명은 영문, 숫자, 한글, 밑줄, 하이픈만 허용됩니다'
  });

/**
 * 안전한 파일 경로 스키마
 */
export const safeFilePathSchema = z.string()
  .refine(str => !detectPathTraversal(str), {
    message: '유효하지 않은 파일 경로입니다'
  })
  .transform(sanitizeFilename);

/**
 * 안전한 URL 스키마
 */
export const safeUrlSchema = z.string()
  .url({ message: '유효한 URL을 입력해주세요' })
  .refine(url => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, { message: 'HTTP 또는 HTTPS URL만 허용됩니다' });

/**
 * JSON 필드 검증 (nested injection 방지)
 */
export const safeJsonSchema = z.string()
  .refine(str => {
    try {
      const parsed = JSON.parse(str);
      const stringified = JSON.stringify(parsed);
      return !detectNoSqlInjection(stringified);
    } catch {
      return false;
    }
  }, { message: '유효하지 않은 JSON 형식입니다' });

// ============================================
// 통합 검증 함수
// ============================================

export interface ValidationResult {
  valid: boolean;
  sanitized?: string;
  errors: string[];
  threats: string[];
}

/**
 * 입력값 종합 검증
 */
export function validateInput(
  input: string,
  options: {
    maxLength?: number;
    allowHtml?: boolean;
    checkSql?: boolean;
    checkNoSql?: boolean;
    checkCommand?: boolean;
    checkPath?: boolean;
  } = {}
): ValidationResult {
  const {
    maxLength = 10000,
    allowHtml = false,
    checkSql = true,
    checkNoSql = true,
    checkCommand = true,
    checkPath = true
  } = options;

  const errors: string[] = [];
  const threats: string[] = [];

  // 길이 검증
  if (input.length > maxLength) {
    errors.push(`입력이 최대 길이(${maxLength}자)를 초과했습니다`);
  }

  // 위협 감지
  if (checkSql && detectSqlInjection(input)) {
    threats.push('SQL_INJECTION');
  }
  if (checkNoSql && detectNoSqlInjection(input)) {
    threats.push('NOSQL_INJECTION');
  }
  if (checkCommand && detectCommandInjection(input)) {
    threats.push('COMMAND_INJECTION');
  }
  if (checkPath && detectPathTraversal(input)) {
    threats.push('PATH_TRAVERSAL');
  }

  // 살균
  let sanitized = input.slice(0, maxLength);
  if (!allowHtml) {
    sanitized = escapeHtml(sanitized);
  } else {
    sanitized = sanitizeHtml(sanitized);
  }

  return {
    valid: errors.length === 0 && threats.length === 0,
    sanitized,
    errors,
    threats
  };
}

/**
 * 요청 본문 전체 검증
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(body);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}


