# 🛡️ WAF & CDN Configuration Guide

## Overview

This guide covers the setup of Web Application Firewall (WAF) and Content Delivery Network (CDN) for the Manpasik Enterprise platform using Cloudflare, AWS WAF, or Azure WAF.

---

## Cloudflare Configuration

### 1. DNS Setup

```bash
# Point your domain to Cloudflare
manpasik.com -> Cloudflare Proxy (Orange Cloud)
api.manpasik.com -> Cloudflare Proxy
```

### 2. SSL/TLS Settings

```yaml
# Cloudflare Dashboard > SSL/TLS
SSL Mode: Full (Strict)
Minimum TLS Version: 1.2
TLS 1.3: Enabled
Automatic HTTPS Rewrites: On
Always Use HTTPS: On
```

### 3. WAF Rules

Create these custom rules in Cloudflare Dashboard > Security > WAF:

#### Rule 1: Block SQL Injection
```
Expression:
(http.request.uri.query contains "UNION" and http.request.uri.query contains "SELECT") or
(http.request.uri.query contains "--") or
(http.request.uri.query contains "' OR '") or
(http.request.body.raw contains "UNION SELECT") or
(http.request.body.raw contains "DROP TABLE")

Action: Block
Priority: 1
```

#### Rule 2: Block XSS Attempts
```
Expression:
(http.request.uri.query contains "<script") or
(http.request.uri.query contains "javascript:") or
(http.request.uri.query contains "onerror=") or
(http.request.body.raw contains "<script") or
(http.request.body.raw contains "javascript:")

Action: Block
Priority: 2
```

#### Rule 3: Rate Limit Authentication
```
Expression:
(http.request.uri.path contains "/api/auth" or http.request.uri.path contains "/auth/")

Action: Rate Limit (5 requests per minute per IP)
Priority: 3
```

#### Rule 4: Block Path Traversal
```
Expression:
(http.request.uri.path contains "..") or
(http.request.uri.query contains "../") or
(http.request.uri.query contains "%2e%2e")

Action: Block
Priority: 4
```

#### Rule 5: API Rate Limiting
```
Expression:
(http.request.uri.path starts with "/api/")

Action: Rate Limit (100 requests per minute per IP)
Priority: 5
```

### 4. Firewall Rules

```yaml
# Block known bad countries (optional)
Rule Name: "Geo Block"
Expression: ip.geoip.country in {"XX" "YY"}
Action: Block

# Allow only known good bots
Rule Name: "Bot Management"
Expression: cf.bot_management.verified_bot
Action: Allow

# Challenge suspicious traffic
Rule Name: "Challenge Suspicious"
Expression: cf.threat_score > 20
Action: Managed Challenge
```

### 5. Security Headers (Transform Rules)

Create a Transform Rule to add security headers:

```
Set response header:
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 6. Page Rules

```yaml
# API Caching
URL: api.manpasik.com/api/public/*
Settings:
  - Cache Level: Standard
  - Edge Cache TTL: 1 hour

# Auth - No Cache
URL: *manpasik.com/auth/*
Settings:
  - Cache Level: Bypass
  - Security Level: High

# Admin - Extra Security
URL: *manpasik.com/admin/*
Settings:
  - Security Level: I'm Under Attack
  - Browser Integrity Check: On
```

---

## AWS WAF Configuration

### 1. Create Web ACL

```bash
aws wafv2 create-web-acl \
  --name "manpasik-waf" \
  --scope REGIONAL \
  --default-action Allow={} \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=manpasik-waf
```

### 2. Add Managed Rule Groups

```json
{
  "Name": "manpasik-waf",
  "Rules": [
    {
      "Name": "AWS-AWSManagedRulesCommonRuleSet",
      "Priority": 1,
      "OverrideAction": {"None": {}},
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesCommonRuleSet"
        }
      }
    },
    {
      "Name": "AWS-AWSManagedRulesSQLiRuleSet",
      "Priority": 2,
      "OverrideAction": {"None": {}},
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesSQLiRuleSet"
        }
      }
    },
    {
      "Name": "AWS-AWSManagedRulesKnownBadInputsRuleSet",
      "Priority": 3,
      "OverrideAction": {"None": {}},
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesKnownBadInputsRuleSet"
        }
      }
    }
  ]
}
```

### 3. Rate-Based Rules

```json
{
  "Name": "RateLimitAuth",
  "Priority": 10,
  "Action": {"Block": {}},
  "Statement": {
    "RateBasedStatement": {
      "Limit": 100,
      "AggregateKeyType": "IP",
      "ScopeDownStatement": {
        "ByteMatchStatement": {
          "SearchString": "/api/auth",
          "FieldToMatch": {"UriPath": {}},
          "TextTransformations": [{"Priority": 0, "Type": "LOWERCASE"}],
          "PositionalConstraint": "CONTAINS"
        }
      }
    }
  }
}
```

### 4. CloudFront Integration

```bash
# Associate WAF with CloudFront distribution
aws wafv2 associate-web-acl \
  --web-acl-arn arn:aws:wafv2:us-east-1:123456789:regional/webacl/manpasik-waf/xxx \
  --resource-arn arn:aws:cloudfront::123456789:distribution/XXXXX
```

---

## Next.js Configuration

### next.config.js Security Headers

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https:;
      font-src 'self' https://fonts.gstatic.com data:;
      connect-src 'self' https://api.manpasik.com wss:;
      media-src 'self' blob:;
      object-src 'none';
      frame-ancestors 'self';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim()
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(self), geolocation=(self), payment=(self)'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## Verification Checklist

### Pre-Deployment
- [ ] SSL/TLS certificates valid
- [ ] WAF rules tested with OWASP ZAP
- [ ] Rate limiting tested under load
- [ ] Security headers verified (https://securityheaders.com)
- [ ] CSP tested with report-only mode first

### Post-Deployment
- [ ] Monitor WAF logs for false positives
- [ ] Review blocked requests weekly
- [ ] Update rule sets monthly
- [ ] Penetration test quarterly

### Monitoring Dashboards
- [ ] Cloudflare Analytics enabled
- [ ] AWS WAF metrics in CloudWatch
- [ ] Real-time alerting configured
- [ ] Weekly security reports scheduled

---

## Emergency Procedures

### Under DDoS Attack
1. Enable Cloudflare "I'm Under Attack" mode
2. Increase rate limiting thresholds
3. Enable IP reputation filtering
4. Contact CDN support if needed

### False Positive Blocking
1. Check WAF logs for blocked rule
2. Add IP to allowlist if legitimate
3. Adjust rule sensitivity if needed
4. Document and review

---

## Cost Estimates

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| Cloudflare | Pro | $20/month |
| Cloudflare | Business (WAF) | $200/month |
| AWS WAF | Per rule | $5/month + $0.60/million requests |
| AWS CloudFront | Standard | Pay-per-use |

---

## Support Contacts

- Cloudflare Support: support.cloudflare.com
- AWS Support: aws.amazon.com/support
- Security Team: security@manpasik.com


