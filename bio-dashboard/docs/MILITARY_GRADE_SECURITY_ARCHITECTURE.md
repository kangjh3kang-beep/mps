# 🛡️ Military-Grade SaaS Security Architecture

## Manpasik Enterprise - Zero Trust Platform

**Version:** 1.0.0  
**Classification:** CONFIDENTIAL  
**Last Updated:** 2024-12-29

---

## Executive Summary

이 문서는 Manpasik Enterprise 플랫폼의 Military-Grade 보안 아키텍처를 설명합니다.
"Defense in Depth" 철학을 기반으로 모든 계층에서 보안을 강화하여 99.999% 가용성과 Zero Trust 보안을 보장합니다.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────────────┐│
│  │ Mobile  │ │   Web   │ │ Desktop │ │    Hardware Devices     ││
│  │   App   │ │   App   │ │   App   │ │ (Reader + Cartridge)    ││
│  └────┬────┘ └────┬────┘ └────┬────┘ └───────────┬─────────────┘│
│       └──────────┼──────────┘                    │               │
└──────────────────┼───────────────────────────────┼───────────────┘
                   │ TLS 1.3                       │ BLE/USB Secure
                   ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY GATEWAY                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐│
│  │ WAF (SQLi,  │ │    Rate     │ │   DDoS      │ │   Geo      ││
│  │ XSS Filter) │ │   Limiter   │ │ Protection  │ │  Blocking  ││
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬──────┘│
└─────────┼───────────────┼───────────────┼──────────────┼────────┘
          │               │               │              │
          ▼               ▼               ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ZERO TRUST MIDDLEWARE                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              middleware.ts - Defense in Depth              │ │
│  │  Layer 1: IP Blocklist      Layer 5: Tenant Isolation     │ │
│  │  Layer 2: Attack Detection  Layer 6: RBAC Authorization   │ │
│  │  Layer 3: Rate Limiting     Layer 7: Security Headers     │ │
│  │  Layer 4: Authentication                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│    APPLICATION   │ │    APPLICATION   │ │    APPLICATION   │
│     (Seoul)      │ │   (Virginia)     │ │   (Frankfurt)    │
│  ┌────────────┐  │ │  ┌────────────┐  │ │  ┌────────────┐  │
│  │ Next.js    │  │ │  │ Next.js    │  │ │  │ Next.js    │  │
│  │ App Router │  │ │  │ App Router │  │ │  │ App Router │  │
│  └─────┬──────┘  │ │  └─────┬──────┘  │ │  └─────┬──────┘  │
│        │         │ │        │         │ │        │         │
│  ┌─────▼──────┐  │ │  ┌─────▼──────┐  │ │  ┌─────▼──────┐  │
│  │ Enterprise │  │ │  │ Enterprise │  │ │  │ Enterprise │  │
│  │    IAM     │  │ │  │    IAM     │  │ │  │    IAM     │  │
│  └─────┬──────┘  │ │  └─────┬──────┘  │ │  └─────┬──────┘  │
│        │         │ │        │         │ │        │         │
│  ┌─────▼──────┐  │ │  ┌─────▼──────┐  │ │  ┌─────▼──────┐  │
│  │ E2E Vault  │  │ │  │ E2E Vault  │  │ │  │ E2E Vault  │  │
│  │ Encryption │  │ │  │ Encryption │  │ │  │ Encryption │  │
│  └────────────┘  │ │  └────────────┘  │ │  └────────────┘  │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  PostgreSQL + RLS                         │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │   │
│  │  │  users     │ │  health_   │ │  audit_    │            │   │
│  │  │ (tenant_id)│ │  records   │ │  logs      │            │   │
│  │  │            │ │ (encrypted)│ │(immutable) │            │   │
│  │  └────────────┘ └────────────┘ └────────────┘            │   │
│  │                                                           │   │
│  │  Row-Level Security (RLS) Policies:                       │   │
│  │  - Users see only their tenant's data                     │   │
│  │  - Doctors see only consented patients                    │   │
│  │  - Admins CANNOT see patient data (Privacy by Design)    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Implemented Components

### Module 1: Zero Trust Security Architecture

| File | Description |
|------|-------------|
| `src/middleware.ts` | 7-Layer Defense Middleware |
| `src/lib/security/rate-limiter.ts` | API Rate Limiting |
| `src/lib/security/input-validator.ts` | Zod-based Input Validation |
| `src/lib/security/security-headers.ts` | HTTP Security Headers |

### Module 2: Multi-Tenancy SaaS Core

| File | Description |
|------|-------------|
| `prisma/migrations/001_multi_tenancy_rls.sql` | DB Schema + RLS Policies |
| `src/lib/infra/disaster-recovery.ts` | Active-Active DR Controller |

### Module 3: Hardware Safety Interlock

| File | Description |
|------|-------------|
| `src/lib/hardware/SafetyGuard.ts` | Hardware Abstraction Layer |

### Module 4: Enterprise IAM

| File | Description |
|------|-------------|
| `src/lib/iam/enterprise-auth.ts` | SAML/OIDC + RBAC |
| `src/lib/security/e2e-encryption.ts` | Field-Level Encryption |
| `src/lib/security/enterprise-audit.ts` | Immutable Audit Ledger |

### Module 5: Audit & Compliance

| File | Description |
|------|-------------|
| `src/app/admin/security/page.tsx` | Security Dashboard UI |
| `scripts/penetration-test.ts` | Automated Pen Test Suite |

---

## 🔐 Security Features

### 1. Zero Trust Middleware (7 Layers)

```typescript
// middleware.ts implements:
1. IP Blocklist Check
2. WAF Attack Pattern Detection (SQLi, XSS, Path Traversal)
3. Rate Limiting (Tiered by endpoint type)
4. JWT Authentication
5. Multi-Tenant Context Injection
6. RBAC Authorization
7. Security Headers + CSP
```

### 2. Rate Limiting Configuration

| Endpoint Type | Limit | Window | Block Duration |
|--------------|-------|--------|----------------|
| Global | 200/min | 60s | - |
| API | 100/min | 60s | - |
| Auth | 5/min | 60s | 5 min block |
| Sensitive | 10/min | 60s | - |
| Admin | 50/min | 60s | - |

### 3. RBAC Role Hierarchy

```
SUPER_ADMIN
    └── ADMIN (No patient data access)
         ├── DOCTOR (Consented patients only)
         ├── NURSE (Consented patients only)
         ├── PHARMACIST (Prescriptions only)
         └── RESEARCHER (Anonymized data only)
              └── USER (Own data only)
                   └── FAMILY (Consented family)
                        └── GUEST (Public only)
```

### 4. Field-Level Encryption

```typescript
// Encrypted fields (AES-256-GCM):
- blood_glucose
- blood_pressure
- heart_rate
- body_temperature
- medical_history
- diagnosis
- prescription
- biometric_data
- raw_sensor_data
```

### 5. Hardware Safety Rules

| Condition | Action |
|-----------|--------|
| `EHD_VOLTAGE > 3.3V && SKIN_CONTACT` | **BLOCK + ALARM** |
| `BATTERY_TEMP > 45°C` | **SHUTDOWN CHARGING** |
| `AI_PREDICTION outside 20-600 mg/dL` | **REQUIRE HUMAN VERIFICATION** |
| `HEARTBEAT_MISSING > 2000ms` | **ENTER SAFE MODE** |

---

## 🌍 Multi-Region Architecture

### Active-Active Configuration

| Region | Role | Latency | Failover Priority |
|--------|------|---------|-------------------|
| `ap-northeast-2` (Seoul) | Primary | 12ms | 1 |
| `us-east-1` (Virginia) | Secondary | 180ms | 2 |
| `eu-central-1` (Frankfurt) | Tertiary | 250ms | 3 |

### Failover SLA

- **Detection Time:** < 10 seconds
- **Failover Time:** < 1 second
- **RPO:** < 1 second (async replication)
- **RTO:** < 5 seconds

---

## 🧪 Security Testing

### Run Penetration Tests

```bash
# Install dependencies
npm install

# Run pen test against local
npx ts-node scripts/penetration-test.ts --target http://localhost:3000

# Run pen test against staging
npx ts-node scripts/penetration-test.ts --target https://staging.manpasik.com
```

### Test Categories

1. **SQL Injection** (15 payloads)
2. **XSS** (12 payloads)
3. **Path Traversal** (5 payloads)
4. **Command Injection** (6 payloads)
5. **IDOR** (4 tests)
6. **Auth Bypass** (5 tests)
7. **Rate Limiting** (150 requests)

---

## 📊 Compliance Matrix

| Standard | Requirement | Implementation |
|----------|-------------|----------------|
| **HIPAA** | PHI Encryption | E2E Vault (AES-256-GCM) |
| **HIPAA** | Access Controls | RBAC + Consent Management |
| **HIPAA** | Audit Trail | Immutable Ledger + Hash Chain |
| **FDA 21 CFR Part 11** | Electronic Signatures | Audit Logger with Signatures |
| **FDA 21 CFR Part 11** | Data Integrity | Checksum Chaining |
| **GDPR** | Data Minimization | Field-Level Encryption |
| **GDPR** | Right to Erasure | Privacy Guard (De-identification) |
| **SOC 2** | Security Controls | WAF + Rate Limiting |
| **ISO 27001** | Access Management | Enterprise IAM |
| **ISO 13485** | Quality Management | Hardware SafetyGuard |
| **IEC 62304** | Medical Device SW | Safety Interlock |

---

## 🚀 Deployment Checklist

### Pre-Production

- [ ] Enable all security headers in production
- [ ] Configure real SAML/OIDC providers
- [ ] Set up Redis for distributed rate limiting
- [ ] Configure WAF rules in CDN (CloudFlare/AWS WAF)
- [ ] Enable audit log shipping to SIEM
- [ ] Run full penetration test suite
- [ ] Review and approve RLS policies
- [ ] Test DR failover procedure

### Production Monitoring

- [ ] Set up security alerts in PagerDuty/OpsGenie
- [ ] Configure log aggregation (ELK/Datadog)
- [ ] Enable real-time threat detection
- [ ] Schedule weekly security audits
- [ ] Implement chaos engineering tests

---

## 📞 Security Contacts

| Role | Contact | Response Time |
|------|---------|---------------|
| Security Lead | security@manpasik.com | < 1 hour |
| Incident Response | incident@manpasik.com | < 15 minutes |
| Compliance Officer | compliance@manpasik.com | < 4 hours |

---

**Document Classification:** CONFIDENTIAL  
**Distribution:** Internal Use Only  
**Review Cycle:** Quarterly


