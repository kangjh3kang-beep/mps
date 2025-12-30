/**
 * ============================================================
 * PENETRATION TEST SCRIPT
 * Automated Security Vulnerability Scanner
 * ============================================================
 * 
 * This script simulates various attack vectors to verify
 * the security controls implemented in the middleware.
 * 
 * Attack Types:
 * 1. SQL Injection
 * 2. XSS (Cross-Site Scripting)
 * 3. IDOR (Insecure Direct Object Reference)
 * 4. Rate Limiting Bypass
 * 5. Authentication Bypass
 * 6. Path Traversal
 * 7. Command Injection
 * 8. CSRF (Cross-Site Request Forgery)
 * 
 * Usage:
 *   npx ts-node scripts/penetration-test.ts --target http://localhost:3000
 * 
 * ⚠️ WARNING: Only run this against your own test environments!
 */

interface TestResult {
  name: string;
  category: string;
  payload: string;
  endpoint: string;
  expected: 'blocked' | 'allowed';
  actual: 'blocked' | 'allowed';
  status: number;
  passed: boolean;
  duration: number;
  response?: string;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: string;
  vulnerabilities: string[];
  timestamp: string;
}

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_TARGET = 'http://localhost:3000';
const TIMEOUT_MS = 10000;
const VERBOSE = process.argv.includes('--verbose');

// ============================================
// TEST PAYLOADS
// ============================================

const SQL_INJECTION_PAYLOADS = [
  // Basic
  "' OR '1'='1",
  "' OR 1=1--",
  "'; DROP TABLE users;--",
  
  // Union-based
  "' UNION SELECT * FROM users--",
  "' UNION SELECT password FROM users WHERE '1'='1",
  
  // Blind
  "' AND SLEEP(5)--",
  "' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--",
  
  // Error-based
  "' AND EXTRACTVALUE(1,CONCAT(0x7e,VERSION()))--",
  
  // Time-based
  "'; WAITFOR DELAY '0:0:5'--",
  "' AND BENCHMARK(10000000,SHA1('test'))--",
  
  // Stacked queries
  "'; INSERT INTO users VALUES('hacker','hacked');--",
  
  // Commenting
  "admin'--",
  "admin'/*",
];

const XSS_PAYLOADS = [
  // Basic
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert('XSS')>",
  
  // Event handlers
  "<div onmouseover=alert('XSS')>Hover</div>",
  "<body onload=alert('XSS')>",
  
  // SVG
  "<svg onload=alert('XSS')>",
  "<svg/onload=alert('XSS')>",
  
  // JavaScript protocol
  "javascript:alert('XSS')",
  "javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/\"/+/onmouseover=1/+/[*/[]/+alert(1)//'>",
  
  // Encoding
  "%3Cscript%3Ealert('XSS')%3C/script%3E",
  "&#60;script&#62;alert('XSS')&#60;/script&#62;",
  
  // Expression
  "<div style=\"expression(alert('XSS'))\">",
  
  // Data URL
  "<a href=\"data:text/html,<script>alert('XSS')</script>\">",
];

const PATH_TRAVERSAL_PAYLOADS = [
  "../../../etc/passwd",
  "..\\..\\..\\windows\\system32\\config\\sam",
  "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
  "....//....//....//etc/passwd",
  "..%252f..%252f..%252fetc/passwd",
];

const COMMAND_INJECTION_PAYLOADS = [
  "; ls -la",
  "| cat /etc/passwd",
  "`whoami`",
  "$(id)",
  "& net user",
  "|| dir c:\\",
];

const IDOR_TESTS = [
  // Access other users' data
  { path: '/api/users/999', method: 'GET', description: 'Access other user profile' },
  { path: '/api/measurements/other-user-id', method: 'GET', description: 'Access other user measurements' },
  { path: '/api/health-records/admin-record-id', method: 'GET', description: 'Access admin health records' },
  { path: '/api/settings/admin', method: 'GET', description: 'Access admin settings' },
];

const AUTH_BYPASS_TESTS = [
  // Missing auth
  { path: '/admin/dashboard', method: 'GET', description: 'Admin without auth' },
  { path: '/mode/pro', method: 'GET', description: 'Pro mode without expert verification' },
  { path: '/api/users', method: 'GET', description: 'List users without auth' },
  
  // JWT manipulation
  { 
    path: '/api/profile', 
    method: 'GET', 
    headers: { 'Authorization': 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiJ9.' },
    description: 'JWT with alg:none'
  },
  {
    path: '/api/profile',
    method: 'GET',
    headers: { 'Authorization': 'Bearer invalid.token.here' },
    description: 'Malformed JWT'
  },
];

// ============================================
// HTTP UTILITIES
// ============================================

async function makeRequest(
  target: string,
  path: string,
  method: string = 'GET',
  body?: any,
  headers?: Record<string, string>
): Promise<{ status: number; body: string; duration: number }> {
  const startTime = Date.now();
  const url = `${target}${path}`;
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Manpasik-PenTest/1.0',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    const responseBody = await response.text();
    const duration = Date.now() - startTime;
    
    return {
      status: response.status,
      body: responseBody.slice(0, 500), // Limit response size
      duration,
    };
  } catch (error: any) {
    return {
      status: error.name === 'AbortError' ? 408 : 0,
      body: error.message,
      duration: Date.now() - startTime,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function isBlocked(status: number, body: string): boolean {
  // Blocked responses
  if (status === 400 || status === 403 || status === 429) return true;
  
  // Check for security error messages
  const blockedPatterns = [
    'blocked',
    'denied',
    'forbidden',
    'rate limit',
    'malicious',
    'security policy',
    'invalid input',
    'validation error',
  ];
  
  const lowerBody = body.toLowerCase();
  return blockedPatterns.some(pattern => lowerBody.includes(pattern));
}

// ============================================
// TEST RUNNERS
// ============================================

async function testSqlInjection(target: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const endpoints = [
    '/api/search?q=',
    '/api/users?filter=',
    '/auth/signin',
  ];
  
  for (const endpoint of endpoints) {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      const path = endpoint.includes('?') 
        ? `${endpoint}${encodeURIComponent(payload)}`
        : endpoint;
      
      const body = endpoint.includes('signin') 
        ? { email: payload, password: 'test' }
        : undefined;
      
      const method = body ? 'POST' : 'GET';
      const response = await makeRequest(target, path, method, body);
      const blocked = isBlocked(response.status, response.body);
      
      results.push({
        name: `SQLi: ${payload.slice(0, 30)}...`,
        category: 'SQL Injection',
        payload,
        endpoint: path,
        expected: 'blocked',
        actual: blocked ? 'blocked' : 'allowed',
        status: response.status,
        passed: blocked,
        duration: response.duration,
        response: VERBOSE ? response.body : undefined,
      });
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  return results;
}

async function testXss(target: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const endpoints = [
    '/api/search?q=',
    '/api/feedback',
  ];
  
  for (const endpoint of endpoints) {
    for (const payload of XSS_PAYLOADS) {
      const path = endpoint.includes('?')
        ? `${endpoint}${encodeURIComponent(payload)}`
        : endpoint;
      
      const body = !endpoint.includes('?')
        ? { message: payload, name: 'Test' }
        : undefined;
      
      const method = body ? 'POST' : 'GET';
      const response = await makeRequest(target, path, method, body);
      const blocked = isBlocked(response.status, response.body);
      
      // Also check if payload is reflected (XSS vulnerability)
      const reflected = response.body.includes(payload) || 
                        response.body.includes(decodeURIComponent(payload));
      
      results.push({
        name: `XSS: ${payload.slice(0, 30)}...`,
        category: 'Cross-Site Scripting',
        payload,
        endpoint: path,
        expected: 'blocked',
        actual: (blocked || !reflected) ? 'blocked' : 'allowed',
        status: response.status,
        passed: blocked || !reflected,
        duration: response.duration,
        response: VERBOSE ? response.body : undefined,
      });
      
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  return results;
}

async function testPathTraversal(target: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  for (const payload of PATH_TRAVERSAL_PAYLOADS) {
    const path = `/api/files/${encodeURIComponent(payload)}`;
    const response = await makeRequest(target, path);
    const blocked = isBlocked(response.status, response.body);
    
    // Check for sensitive file content
    const leaked = response.body.includes('root:') || 
                   response.body.includes('Administrator:');
    
    results.push({
      name: `Path Traversal: ${payload.slice(0, 30)}`,
      category: 'Path Traversal',
      payload,
      endpoint: path,
      expected: 'blocked',
      actual: (blocked && !leaked) ? 'blocked' : 'allowed',
      status: response.status,
      passed: blocked && !leaked,
      duration: response.duration,
      response: VERBOSE ? response.body : undefined,
    });
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  return results;
}

async function testCommandInjection(target: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  for (const payload of COMMAND_INJECTION_PAYLOADS) {
    const path = `/api/ping?host=${encodeURIComponent(`localhost${payload}`)}`;
    const response = await makeRequest(target, path);
    const blocked = isBlocked(response.status, response.body);
    
    results.push({
      name: `Command Injection: ${payload}`,
      category: 'Command Injection',
      payload,
      endpoint: path,
      expected: 'blocked',
      actual: blocked ? 'blocked' : 'allowed',
      status: response.status,
      passed: blocked,
      duration: response.duration,
      response: VERBOSE ? response.body : undefined,
    });
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  return results;
}

async function testIdor(target: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  for (const test of IDOR_TESTS) {
    const response = await makeRequest(target, test.path, test.method);
    
    // IDOR is blocked if we get 401, 403, or redirect to login
    const blocked = response.status === 401 || 
                    response.status === 403 || 
                    response.status === 302 ||
                    response.body.includes('unauthorized') ||
                    response.body.includes('access denied');
    
    results.push({
      name: `IDOR: ${test.description}`,
      category: 'IDOR',
      payload: test.path,
      endpoint: test.path,
      expected: 'blocked',
      actual: blocked ? 'blocked' : 'allowed',
      status: response.status,
      passed: blocked,
      duration: response.duration,
      response: VERBOSE ? response.body : undefined,
    });
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  return results;
}

async function testAuthBypass(target: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  for (const test of AUTH_BYPASS_TESTS) {
    const response = await makeRequest(
      target, 
      test.path, 
      test.method,
      undefined,
      test.headers
    );
    
    // Auth bypass is blocked if we get redirect to login or 401/403
    const blocked = response.status === 401 || 
                    response.status === 403 || 
                    response.status === 302 ||
                    response.body.includes('signin');
    
    results.push({
      name: `Auth Bypass: ${test.description}`,
      category: 'Authentication Bypass',
      payload: test.path,
      endpoint: test.path,
      expected: 'blocked',
      actual: blocked ? 'blocked' : 'allowed',
      status: response.status,
      passed: blocked,
      duration: response.duration,
      response: VERBOSE ? response.body : undefined,
    });
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  return results;
}

async function testRateLimiting(target: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const endpoint = '/api/test';
  
  console.log('🔄 Testing Rate Limiting (sending 150 requests)...');
  
  let blockedAt = -1;
  for (let i = 0; i < 150; i++) {
    const response = await makeRequest(target, `${endpoint}?i=${i}`);
    
    if (response.status === 429) {
      blockedAt = i;
      break;
    }
  }
  
  results.push({
    name: 'Rate Limiting',
    category: 'Rate Limiting',
    payload: `${endpoint} x 150`,
    endpoint,
    expected: 'blocked',
    actual: blockedAt > 0 ? 'blocked' : 'allowed',
    status: blockedAt > 0 ? 429 : 200,
    passed: blockedAt > 0 && blockedAt <= 110, // Should block around 100
    duration: 0,
    response: blockedAt > 0 ? `Blocked after ${blockedAt} requests` : 'Not blocked',
  });
  
  return results;
}

// ============================================
// MAIN EXECUTION
// ============================================

async function runPenetrationTest(target: string): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         🛡️  MANPASIK PENETRATION TEST SUITE  🛡️           ║');
  console.log('║         Military-Grade Security Verification             ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Target: ${target.padEnd(49)}║`);
  console.log(`║  Time: ${new Date().toISOString().padEnd(51)}║`);
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  const allResults: TestResult[] = [];
  
  // Run all test categories
  console.log('🔍 Phase 1: SQL Injection Tests');
  allResults.push(...await testSqlInjection(target));
  
  console.log('🔍 Phase 2: XSS Tests');
  allResults.push(...await testXss(target));
  
  console.log('🔍 Phase 3: Path Traversal Tests');
  allResults.push(...await testPathTraversal(target));
  
  console.log('🔍 Phase 4: Command Injection Tests');
  allResults.push(...await testCommandInjection(target));
  
  console.log('🔍 Phase 5: IDOR Tests');
  allResults.push(...await testIdor(target));
  
  console.log('🔍 Phase 6: Authentication Bypass Tests');
  allResults.push(...await testAuthBypass(target));
  
  console.log('🔍 Phase 7: Rate Limiting Tests');
  allResults.push(...await testRateLimiting(target));
  
  // Generate summary
  const summary: TestSummary = {
    total: allResults.length,
    passed: allResults.filter(r => r.passed).length,
    failed: allResults.filter(r => !r.passed).length,
    passRate: `${((allResults.filter(r => r.passed).length / allResults.length) * 100).toFixed(1)}%`,
    vulnerabilities: allResults.filter(r => !r.passed).map(r => `${r.category}: ${r.name}`),
    timestamp: new Date().toISOString(),
  };
  
  // Print results
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                        TEST RESULTS                           ');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Group by category
  const categories = [...new Set(allResults.map(r => r.category))];
  
  for (const category of categories) {
    const categoryResults = allResults.filter(r => r.category === category);
    const categoryPassed = categoryResults.filter(r => r.passed).length;
    const categoryTotal = categoryResults.length;
    const categoryIcon = categoryPassed === categoryTotal ? '✅' : '⚠️';
    
    console.log(`\n${categoryIcon} ${category}: ${categoryPassed}/${categoryTotal}`);
    
    for (const result of categoryResults) {
      const icon = result.passed ? '  ✓' : '  ✗';
      const status = result.passed ? '' : ` [VULNERABLE - ${result.status}]`;
      console.log(`${icon} ${result.name}${status}`);
    }
  }
  
  // Print summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                        SUMMARY                               ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Tests: ${summary.total}`);
  console.log(`Passed: ${summary.passed} ✅`);
  console.log(`Failed: ${summary.failed} ${summary.failed > 0 ? '❌' : ''}`);
  console.log(`Pass Rate: ${summary.passRate}`);
  
  if (summary.vulnerabilities.length > 0) {
    console.log('');
    console.log('⚠️  VULNERABILITIES DETECTED:');
    for (const vuln of summary.vulnerabilities) {
      console.log(`   - ${vuln}`);
    }
  } else {
    console.log('');
    console.log('🎉 ALL SECURITY TESTS PASSED!');
    console.log('   The application appears to be well-protected against common attacks.');
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Exit with appropriate code
  process.exit(summary.failed > 0 ? 1 : 0);
}

// Parse arguments and run
const targetArg = process.argv.find(arg => arg.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1] : DEFAULT_TARGET;

runPenetrationTest(target).catch(error => {
  console.error('Penetration test failed:', error);
  process.exit(1);
});


