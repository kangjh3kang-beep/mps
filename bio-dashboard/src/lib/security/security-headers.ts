/**
 * ============================================================
 * ENTERPRISE SECURITY HEADERS
 * HTTP 보안 헤더 - 엔터프라이즈급 보안
 * ============================================================
 * 
 * OWASP 권장 보안 헤더 구현:
 * - Content-Security-Policy (CSP)
 * - Strict-Transport-Security (HSTS)
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================
// CSP 정책 설정
// ============================================

export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'media-src'?: string[];
  'object-src'?: string[];
  'frame-src'?: string[];
  'frame-ancestors'?: string[];
  'form-action'?: string[];
  'base-uri'?: string[];
  'manifest-src'?: string[];
  'worker-src'?: string[];
  'report-uri'?: string[];
  'report-to'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

const DEFAULT_CSP_DIRECTIVES: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",  // Next.js 요구
    "'unsafe-eval'",    // 개발 모드용 (프로덕션에서 제거 권장)
    'https://cdn.jsdelivr.net',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",  // Tailwind CSS 요구
    'https://fonts.googleapis.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'https://www.google-analytics.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:'
  ],
  'connect-src': [
    "'self'",
    'https://api.manpasik.com',
    'https://www.google-analytics.com',
    'wss:',  // WebSocket
    'https://*.openai.com'
  ],
  'media-src': ["'self'", 'blob:'],
  'object-src': ["'none'"],
  'frame-src': [
    "'self'",
    'https://www.youtube.com',
    'https://player.vimeo.com'
  ],
  'frame-ancestors': ["'self'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'manifest-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
  'upgrade-insecure-requests': true,
  'block-all-mixed-content': true
};

/**
 * CSP 헤더 문자열 생성
 */
export function buildCSPHeader(
  directives: CSPDirectives = DEFAULT_CSP_DIRECTIVES,
  nonce?: string
): string {
  const parts: string[] = [];

  for (const [directive, value] of Object.entries(directives)) {
    if (value === true) {
      parts.push(directive);
    } else if (value === false) {
      continue;
    } else if (Array.isArray(value)) {
      let sources = [...value];
      
      // nonce 추가 (script-src, style-src)
      if (nonce && (directive === 'script-src' || directive === 'style-src')) {
        sources.push(`'nonce-${nonce}'`);
      }
      
      parts.push(`${directive} ${sources.join(' ')}`);
    }
  }

  return parts.join('; ');
}

// ============================================
// 전체 보안 헤더
// ============================================

export interface SecurityHeadersConfig {
  /** CSP 활성화 */
  enableCSP?: boolean;
  /** HSTS 활성화 */
  enableHSTS?: boolean;
  /** HSTS max-age (초) */
  hstsMaxAge?: number;
  /** HSTS includeSubDomains */
  hstsIncludeSubDomains?: boolean;
  /** HSTS preload */
  hstsPreload?: boolean;
  /** Frame-Options 값 */
  frameOptions?: 'DENY' | 'SAMEORIGIN';
  /** Referrer-Policy 값 */
  referrerPolicy?: string;
  /** CSP 커스텀 설정 */
  cspDirectives?: CSPDirectives;
  /** CSP 보고 전용 모드 */
  cspReportOnly?: boolean;
}

const DEFAULT_CONFIG: Required<SecurityHeadersConfig> = {
  enableCSP: true,
  enableHSTS: true,
  hstsMaxAge: 31536000, // 1년
  hstsIncludeSubDomains: true,
  hstsPreload: true,
  frameOptions: 'SAMEORIGIN',
  referrerPolicy: 'strict-origin-when-cross-origin',
  cspDirectives: DEFAULT_CSP_DIRECTIVES,
  cspReportOnly: false
};

/**
 * 보안 헤더 객체 생성
 */
export function getSecurityHeaders(
  config: SecurityHeadersConfig = {}
): Record<string, string> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const headers: Record<string, string> = {};

  // Content-Security-Policy
  if (cfg.enableCSP) {
    const cspHeader = buildCSPHeader(cfg.cspDirectives);
    const headerName = cfg.cspReportOnly 
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';
    headers[headerName] = cspHeader;
  }

  // Strict-Transport-Security (HSTS)
  if (cfg.enableHSTS) {
    let hstsValue = `max-age=${cfg.hstsMaxAge}`;
    if (cfg.hstsIncludeSubDomains) hstsValue += '; includeSubDomains';
    if (cfg.hstsPreload) hstsValue += '; preload';
    headers['Strict-Transport-Security'] = hstsValue;
  }

  // X-Content-Type-Options
  headers['X-Content-Type-Options'] = 'nosniff';

  // X-Frame-Options
  headers['X-Frame-Options'] = cfg.frameOptions;

  // X-XSS-Protection (레거시 브라우저용)
  headers['X-XSS-Protection'] = '1; mode=block';

  // Referrer-Policy
  headers['Referrer-Policy'] = cfg.referrerPolicy;

  // Permissions-Policy (구 Feature-Policy)
  headers['Permissions-Policy'] = [
    'accelerometer=()',
    'camera=(self)',
    'geolocation=(self)',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=(self)',
    'payment=(self)',
    'usb=()',
    'interest-cohort=()'  // FLoC 비활성화
  ].join(', ');

  // X-DNS-Prefetch-Control
  headers['X-DNS-Prefetch-Control'] = 'on';

  // X-Download-Options (IE용)
  headers['X-Download-Options'] = 'noopen';

  // X-Permitted-Cross-Domain-Policies
  headers['X-Permitted-Cross-Domain-Policies'] = 'none';

  // Cross-Origin-Opener-Policy
  headers['Cross-Origin-Opener-Policy'] = 'same-origin';

  // Cross-Origin-Embedder-Policy
  headers['Cross-Origin-Embedder-Policy'] = 'require-corp';

  // Cross-Origin-Resource-Policy
  headers['Cross-Origin-Resource-Policy'] = 'same-origin';

  return headers;
}

/**
 * Next.js 응답에 보안 헤더 적용
 */
export function applySecurityHeaders(
  response: NextResponse,
  config?: SecurityHeadersConfig
): NextResponse {
  const headers = getSecurityHeaders(config);
  
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * Next.js 미들웨어용 보안 헤더 적용
 */
export function securityHeadersMiddleware(
  request: NextRequest,
  config?: SecurityHeadersConfig
): NextResponse {
  const response = NextResponse.next();
  return applySecurityHeaders(response, config);
}

// ============================================
// CORS 설정
// ============================================

export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders?: string[];
  maxAge?: number;
  credentials?: boolean;
}

const DEFAULT_CORS_CONFIG: CORSConfig = {
  allowedOrigins: [
    'https://manpasik.com',
    'https://www.manpasik.com',
    'https://app.manpasik.com'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Device-ID',
    'X-Request-ID'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400, // 24시간
  credentials: true
};

/**
 * CORS 헤더 생성
 */
export function getCORSHeaders(
  origin: string | null,
  config: CORSConfig = DEFAULT_CORS_CONFIG
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Origin 검증
  if (origin && config.allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (config.allowedOrigins.includes('*')) {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  headers['Access-Control-Allow-Methods'] = config.allowedMethods.join(', ');
  headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');

  if (config.exposedHeaders?.length) {
    headers['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ');
  }

  if (config.maxAge) {
    headers['Access-Control-Max-Age'] = String(config.maxAge);
  }

  if (config.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

/**
 * CORS Preflight 응답
 */
export function handleCORSPreflight(
  request: NextRequest,
  config?: CORSConfig
): NextResponse {
  const origin = request.headers.get('origin');
  const corsHeaders = getCORSHeaders(origin, config);

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}


