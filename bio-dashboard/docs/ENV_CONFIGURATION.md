# 🔐 Environment Configuration Guide

## Required Environment Variables

### Authentication

```bash
# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-nextauth-secret-here-at-least-32-chars
NEXTAUTH_URL=http://localhost:3000
```

### Encryption

```bash
# Master encryption key (generate with: openssl rand -base64 32)
ENCRYPTION_SECRET=your-encryption-secret-here-at-least-32-chars
```

### Database

```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/manpasik?schema=public

# Redis connection string (for distributed rate limiting)
REDIS_URL=redis://localhost:6379
```

### Device Security

```bash
# Registered devices format: DEVICE_ID:SECRET,DEVICE_ID:SECRET
REGISTERED_DEVICES=MPS-001:device-secret-key-001,MPS-002:device-secret-key-002

# Safety override keys (store in HSM/Vault in production)
SAFETY_ADMIN_KEY=your-safety-admin-key-here
SAFETY_OVERRIDE_KEY=your-safety-override-key-here
```

### Enterprise SSO

```bash
# Azure AD
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=

# Okta
OKTA_CLIENT_ID=
OKTA_CLIENT_SECRET=
OKTA_ISSUER=https://your-domain.okta.com

# Google Workspace
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Observability & SIEM

```bash
# Datadog
DATADOG_API_KEY=
DATADOG_APP_KEY=
DATADOG_SITE=datadoghq.com

# Splunk
SPLUNK_HEC_URL=https://http-inputs.splunk.com
SPLUNK_HEC_TOKEN=

# Sentry
SENTRY_DSN=
```

### Infrastructure

```bash
# Primary Region
PRIMARY_REGION=ap-northeast-2
PRIMARY_DB_HOST=seoul.db.manpasik.com

# Secondary Region
SECONDARY_REGION=us-east-1
SECONDARY_DB_HOST=virginia.db.manpasik.com

# CDN/WAF
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
```

### Feature Flags

```bash
ENABLE_MFA=true
ENABLE_AUDIT_LOGGING=true
ENABLE_RATE_LIMITING=true
ENABLE_CHAOS_TESTING=false
```

## Key Generation Commands

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_SECRET
openssl rand -base64 32

# Generate device secrets
openssl rand -hex 32
```

## Production Security Checklist

- [ ] All secrets stored in secure vault (AWS Secrets Manager, HashiCorp Vault)
- [ ] No default/demo values in production
- [ ] MFA enabled for all admin accounts
- [ ] Audit logging enabled
- [ ] Rate limiting configured for all regions
- [ ] Backup secrets rotated regularly


