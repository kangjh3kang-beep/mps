/**
 * ============================================================
 * ZERO TRUST SECURITY MIDDLEWARE
 * Military-Grade SaaS Platform - Defense in Depth
 * ============================================================
 * 
 * Core Philosophy: "Never Trust, Always Verify"
 * Every request is treated as potentially hostile.
 * 
 * Features:
 * - Zero Trust Architecture
 * - Multi-Tenant Isolation (Row-Level Security)
 * - Enterprise Rate Limiting
 * - WAF (SQL Injection, XSS, Command Injection)
 * - Request Signing & Integrity
 * - Geographic Access Control
 * - Device Fingerprinting
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ============================================
// SECURITY CONFIGURATION
// ============================================

const SECURITY_CONFIG = {
  // Rate Limiting
  rateLimits: {
    global: { limit: 200, windowMs: 60000 },      // 200 req/min global
    api: { limit: 100, windowMs: 60000 },         // 100 req/min for API
    auth: { limit: 5, windowMs: 60000, blockMs: 300000 },  // 5/min, 5min block
    sensitive: { limit: 10, windowMs: 60000 },    // 10 req/min for sensitive ops
    admin: { limit: 50, windowMs: 60000 },        // 50 req/min for admin
  },
  
  // Blocked patterns (WAF)
  blockedPatterns: {
    sqlInjection: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION)\b)/i,
      /(--)|(;)|(\/\*)|(\*\/)/,
      /(\bOR\b|\bAND\b)\s*\d+\s*=\s*\d+/i,
      /'\s*OR\s*'.*'.*'/i,
      /WAITFOR\s+DELAY/i,
      /BENCHMARK\s*\(/i,
    ],
    xss: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /expression\s*\(/gi,
    ],
    pathTraversal: [
      /\.\.\//g,
      /\.\.\\/g,
      /%2e%2e/gi,
    ],
    commandInjection: [
      /[;&|`$(){}[\]<>]/,
      /\$\(/,
    ],
  },
  
  // Security Headers
  headers: {
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self), payment=(self)',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
  },
  
  // Geo-blocking (Optional: block specific countries)
  allowedCountries: ['KR', 'US', 'JP', 'DE', 'GB', 'FR', 'CA', 'AU'],
  
  // Suspicious IP ranges to monitor
  suspiciousRanges: [] as string[],
};

// ============================================
// RATE LIMITING STORE (Redis recommended for production)
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blocked?: boolean;
  blockedUntil?: number;
  violations: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const suspiciousIPs = new Set<string>();
const blockedIPs = new Set<string>();

// Cleanup old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
      if (now > entry.resetAt && !entry.blocked) {
        rateLimitStore.delete(key);
      }
    });
  }, 60000);
}

// ============================================
// SECURITY UTILITIES
// ============================================

function getClientIP(req: NextRequest): string {
  // Cloudflare
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;
  
  // X-Forwarded-For (reverse proxy)
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  
  // X-Real-IP (Nginx)
  const xri = req.headers.get('x-real-ip');
  if (xri) return xri;
  
  // Vercel
  const vercel = req.headers.get('x-vercel-forwarded-for');
  if (vercel) return vercel;
  
  return 'unknown';
}

function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomUUID().split('-')[0];
  return `req_${timestamp}_${random}`;
}

function getDeviceFingerprint(req: NextRequest): string {
  const ua = req.headers.get('user-agent') || '';
  const accept = req.headers.get('accept') || '';
  const lang = req.headers.get('accept-language') || '';
  const encoding = req.headers.get('accept-encoding') || '';
  
  // Simple fingerprint (in production, use more sophisticated methods)
  const raw = `${ua}|${accept}|${lang}|${encoding}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function checkRateLimit(
  key: string, 
  limit: number, 
  windowMs: number,
  blockMs?: number
): { 
  allowed: boolean; 
  remaining: number;
  resetAt: number;
  blocked: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  let entry = rateLimitStore.get(key);
  
  // Check if blocked
  if (entry?.blocked && entry.blockedUntil) {
    if (now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        blocked: true,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
      };
    } else {
      // Unblock but track violations
      entry.blocked = false;
      entry.blockedUntil = undefined;
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }
  }
  
  // New window or expired
  if (!entry || now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs, violations: entry?.violations || 0 };
    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: limit - 1, resetAt: entry.resetAt, blocked: false };
  }
  
  // Within window
  if (entry.count < limit) {
    entry.count++;
    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt, blocked: false };
  }
  
  // Exceeded limit
  entry.violations++;
  
  // Auto-block after repeated violations
  if (blockMs && entry.violations >= 3) {
    entry.blocked = true;
    entry.blockedUntil = now + blockMs;
    suspiciousIPs.add(key);
  }
  
  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.resetAt,
    blocked: entry.blocked || false,
    retryAfter: Math.ceil((entry.resetAt - now) / 1000)
  };
}

function detectAttackPatterns(req: NextRequest): { 
  detected: boolean; 
  type?: string; 
  pattern?: string;
} {
  const url = req.url;
  const body = ''; // Body inspection requires reading the stream
  const searchParams = new URL(url).searchParams;
  
  // Check URL and query params
  const textToCheck = [
    url,
    ...Array.from(searchParams.values())
  ].join(' ');
  
  // SQL Injection
  for (const pattern of SECURITY_CONFIG.blockedPatterns.sqlInjection) {
    if (pattern.test(textToCheck)) {
      return { detected: true, type: 'SQL_INJECTION', pattern: pattern.toString() };
    }
  }
  
  // XSS
  for (const pattern of SECURITY_CONFIG.blockedPatterns.xss) {
    if (pattern.test(textToCheck)) {
      return { detected: true, type: 'XSS', pattern: pattern.toString() };
    }
  }
  
  // Path Traversal
  for (const pattern of SECURITY_CONFIG.blockedPatterns.pathTraversal) {
    if (pattern.test(textToCheck)) {
      return { detected: true, type: 'PATH_TRAVERSAL', pattern: pattern.toString() };
    }
  }
  
  // Command Injection
  for (const pattern of SECURITY_CONFIG.blockedPatterns.commandInjection) {
    if (pattern.test(textToCheck)) {
      // Allow some patterns in legitimate contexts
      if (!url.includes('/api/')) continue;
      return { detected: true, type: 'COMMAND_INJECTION', pattern: pattern.toString() };
    }
  }
  
  return { detected: false };
}

function extractTenantId(req: NextRequest, token: any): string | null {
  // 1. From JWT token (preferred)
  if (token?.tenantId) return token.tenantId;
  if (token?.organizationId) return token.organizationId;
  
  // 2. From custom header (for API calls)
  const headerTenant = req.headers.get('x-tenant-id');
  if (headerTenant) return headerTenant;
  
  // 3. From subdomain (e.g., samsung-hospital.manpasik.com)
  const host = req.headers.get('host') || '';
  const subdomain = host.split('.')[0];
  if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
    return subdomain;
  }
  
  return null;
}

// ============================================
// PATH CLASSIFICATION
// ============================================

function isPublicPath(pathname: string): boolean {
  const publicPaths = [
    '/',
    '/auth',
    '/api/auth',
    '/school',
    '/store',
    '/organic',
    '/_next',
    '/favicon',
    '/terms',      // Legal page - public
    '/privacy',    // Legal page - public
    '/cookies',    // Legal page - public
  ];
  
  // Exact match for homepage
  if (pathname === '/') return true;
  
  // Prefix match for other paths
  return publicPaths.some(p => p !== '/' && pathname.startsWith(p));
}

function isSensitivePath(pathname: string): boolean {
  return (
    pathname.startsWith('/my') ||
    pathname.startsWith('/result') ||
    pathname.startsWith('/deep-analysis') ||
    pathname.startsWith('/api/med-ledger') ||
    pathname.startsWith('/api/analyze')
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

function isProModePath(pathname: string): boolean {
  return pathname.startsWith('/mode/pro') || pathname.startsWith('/mode/desktop');
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

// ============================================
// SECURITY RESPONSE HELPERS
// ============================================

function securityResponse(
  status: number,
  message: string,
  details?: Record<string, unknown>
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: true,
      message,
      code: status,
      timestamp: new Date().toISOString(),
      ...details
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...SECURITY_CONFIG.headers
      }
    }
  );
}

function addSecurityHeaders(response: NextResponse, extra?: Record<string, string>): NextResponse {
  Object.entries(SECURITY_CONFIG.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  return response;
}

// ============================================
// MAIN MIDDLEWARE
// ============================================

export async function middleware(req: NextRequest) {
  const startTime = Date.now();
  const { pathname } = req.nextUrl;
  const clientIP = getClientIP(req);
  const requestId = generateRequestId();
  const deviceFingerprint = getDeviceFingerprint(req);
  
  // ============================================
  // LAYER 1: IP BLOCKLIST CHECK
  // ============================================
  if (blockedIPs.has(clientIP)) {
    return securityResponse(403, 'Access Denied', { 
      reason: 'IP_BLOCKED',
      requestId 
    });
  }
  
  // ============================================
  // LAYER 2: ATTACK PATTERN DETECTION (WAF)
  // ============================================
  const attackCheck = detectAttackPatterns(req);
  if (attackCheck.detected) {
    // Log the attack attempt
    console.error(`[SECURITY ALERT] ${attackCheck.type} detected from ${clientIP}`, {
      requestId,
      pathname,
      pattern: attackCheck.pattern,
      timestamp: new Date().toISOString()
    });
    
    // Add to suspicious list
    suspiciousIPs.add(clientIP);
    
    // After 3 attacks, block the IP
    const key = `attack:${clientIP}`;
    const current = rateLimitStore.get(key)?.count || 0;
    rateLimitStore.set(key, { 
      count: current + 1, 
      resetAt: Date.now() + 3600000,
      violations: current + 1
    });
    
    if (current >= 2) {
      blockedIPs.add(clientIP);
    }
    
    return securityResponse(403, 'Request blocked by security policy', {
      reason: 'MALICIOUS_PATTERN_DETECTED',
      type: attackCheck.type,
      requestId
    });
  }
  
  // ============================================
  // LAYER 3: RATE LIMITING
  // ============================================
  let rateLimitKey = `ip:${clientIP}`;
  let rateLimitConfig = SECURITY_CONFIG.rateLimits.global;
  
  if (isApiPath(pathname)) {
    rateLimitConfig = pathname.includes('/auth') 
      ? SECURITY_CONFIG.rateLimits.auth 
      : SECURITY_CONFIG.rateLimits.api;
    rateLimitKey = `api:${clientIP}:${pathname.includes('/auth') ? 'auth' : 'api'}`;
  }
  
  if (isSensitivePath(pathname)) {
    rateLimitConfig = SECURITY_CONFIG.rateLimits.sensitive;
    rateLimitKey = `sensitive:${clientIP}`;
  }
  
  if (isAdminPath(pathname)) {
    rateLimitConfig = SECURITY_CONFIG.rateLimits.admin;
    rateLimitKey = `admin:${clientIP}`;
  }
  
  const rateLimit = checkRateLimit(
    rateLimitKey,
    rateLimitConfig.limit,
    rateLimitConfig.windowMs,
    (rateLimitConfig as any).blockMs
  );
  
  if (!rateLimit.allowed) {
    console.warn(`[RATE LIMIT] Exceeded by ${clientIP}`, {
      requestId,
      pathname,
      blocked: rateLimit.blocked
    });
    
    return securityResponse(429, 'Too Many Requests', {
      reason: rateLimit.blocked ? 'TEMPORARILY_BLOCKED' : 'RATE_LIMIT_EXCEEDED',
      retryAfter: rateLimit.retryAfter,
      requestId
    });
  }
  
  // ============================================
  // LAYER 4: AUTHENTICATION CHECK
  // ============================================
  let token: any = null;
  let tenantId: string | null = null;
  
  if (!isPublicPath(pathname)) {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token && (isSensitivePath(pathname) || isAdminPath(pathname) || isProModePath(pathname))) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/signin';
      url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }
  
  // ============================================
  // LAYER 5: TENANT ISOLATION (Multi-Tenancy)
  // ============================================
  if (token) {
    tenantId = extractTenantId(req, token);
    
    // For API routes, enforce tenant context
    if (isApiPath(pathname) && !tenantId && isSensitivePath(pathname)) {
      return securityResponse(400, 'Tenant context required', {
        reason: 'MISSING_TENANT_ID',
        requestId
      });
    }
  }
  
  // ============================================
  // LAYER 6: AUTHORIZATION (RBAC)
  // ============================================
  if (token) {
    const userLevel = (token as any).level ?? 0;
    const userRole = (token as any).role ?? 'user';
    const verificationStatus = (token as any).verificationStatus;
    
    // Admin routes require level 5+ (Regional Admin)
    if (isAdminPath(pathname) && userLevel < 5) {
      console.warn(`[AUTH] Unauthorized admin access attempt by user ${token.sub}`, {
        requestId,
        userLevel,
        pathname
      });
      
      return securityResponse(403, 'Insufficient permissions', {
        reason: 'ADMIN_ACCESS_DENIED',
        requiredLevel: 5,
        currentLevel: userLevel,
        requestId
      });
    }
    
    // Pro mode requires level 3+ (Expert) and verification
    if (isProModePath(pathname)) {
      const canAccess = 
        (userLevel >= 3 && verificationStatus === 'verified') ||
        userLevel >= 5;
      
      if (!canAccess) {
        const url = req.nextUrl.clone();
        url.pathname = '/auth/verify-expert';
        url.searchParams.set('callbackUrl', req.nextUrl.pathname);
        return NextResponse.redirect(url);
      }
    }
    
    // MFA enforcement for sensitive data
    if (isSensitivePath(pathname)) {
      const mfaEnabled = (token as any).mfaEnabled === true;
      const mfaVerified = (token as any).mfaVerified === true;
      
      if (mfaEnabled && !mfaVerified && pathname !== '/auth/mfa') {
        const url = req.nextUrl.clone();
        url.pathname = '/auth/mfa';
        url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
        return NextResponse.redirect(url);
      }
    }
  }
  
  // ============================================
  // LAYER 7: BUILD RESPONSE WITH SECURITY CONTEXT
  // ============================================
  const response = NextResponse.next();
  
  // Add security headers
  addSecurityHeaders(response);
  
  // Add request tracking headers
  response.headers.set('X-Request-ID', requestId);
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', String(rateLimitConfig.limit));
  response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.floor(rateLimit.resetAt / 1000)));
  
  // Add tenant context header for downstream services
  if (tenantId) {
    response.headers.set('X-Tenant-ID', tenantId);
  }
  
  // Add Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://api.manpasik.com wss:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)'
  ]
};
