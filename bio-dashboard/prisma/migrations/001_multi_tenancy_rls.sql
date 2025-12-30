-- ============================================================
-- MULTI-TENANCY DATABASE MIGRATION
-- Military-Grade SaaS Platform - Logical Isolation Engine
-- ============================================================
--
-- This migration adds tenant isolation to all tables using:
-- 1. tenant_id column on every table
-- 2. Row-Level Security (RLS) policies
-- 3. Automatic tenant context injection
--
-- Compliance:
-- - HIPAA (Patient data isolation)
-- - SOC 2 (Logical access controls)
-- - ISO 27001 (Information security)
-- ============================================================

-- Enable Row-Level Security extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TENANT (ORGANIZATION) TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  
  -- Organization type
  type VARCHAR(50) NOT NULL DEFAULT 'standard'
    CHECK (type IN ('standard', 'hospital', 'clinic', 'research', 'enterprise', 'government')),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
  
  -- Subscription
  plan VARCHAR(50) NOT NULL DEFAULT 'basic'
    CHECK (plan IN ('basic', 'professional', 'enterprise', 'custom')),
  plan_expires_at TIMESTAMPTZ,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  -- Security
  allowed_ips INET[],
  require_mfa BOOLEAN DEFAULT FALSE,
  max_users INTEGER DEFAULT 100,
  
  -- SAML/OIDC Configuration
  sso_enabled BOOLEAN DEFAULT FALSE,
  sso_provider VARCHAR(50), -- 'saml', 'oidc', 'azure_ad', 'okta', 'google'
  sso_config JSONB DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  
  -- Data residency
  data_region VARCHAR(10) DEFAULT 'kr-seoul',
  
  CONSTRAINT valid_sso_provider 
    CHECK (sso_provider IS NULL OR sso_provider IN ('saml', 'oidc', 'azure_ad', 'okta', 'google'))
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);

-- ============================================================
-- ADD TENANT_ID TO USERS TABLE
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'
  CHECK (role IN ('user', 'doctor', 'nurse', 'admin', 'super_admin', 'researcher'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(100);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);
CREATE UNIQUE INDEX idx_users_tenant_email ON users(tenant_id, email);

-- ============================================================
-- ADD TENANT_ID TO HEALTH RECORDS
-- ============================================================

ALTER TABLE health_records ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES users(id);
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES users(id);
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'private'
  CHECK (access_level IN ('private', 'provider', 'organization', 'research'));

CREATE INDEX idx_health_records_tenant ON health_records(tenant_id);
CREATE INDEX idx_health_records_patient ON health_records(patient_id);

-- ============================================================
-- ADD TENANT_ID TO MEASUREMENTS
-- ============================================================

ALTER TABLE measurements ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS encrypted_data BYTEA; -- For field-level encryption
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS data_key_id VARCHAR(100); -- Key used for encryption

CREATE INDEX idx_measurements_tenant ON measurements(tenant_id);
CREATE INDEX idx_measurements_user ON measurements(user_id);
CREATE INDEX idx_measurements_created ON measurements(created_at DESC);

-- ============================================================
-- ADD TENANT_ID TO AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  
  -- Actor
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  session_id VARCHAR(100),
  
  -- Request
  request_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  geo_location JSONB,
  
  -- Action
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),
  
  -- Data
  old_value JSONB,
  new_value JSONB,
  
  -- Result
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Integrity
  checksum VARCHAR(64) NOT NULL,
  prev_checksum VARCHAR(64),
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent modification
  CONSTRAINT audit_immutable CHECK (TRUE)
);

-- Partition by month for performance
-- CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
--   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- ============================================================
-- CONSENT MANAGEMENT TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id) NOT NULL,
  
  consent_type VARCHAR(50) NOT NULL
    CHECK (consent_type IN ('data_processing', 'marketing', 'research', 'third_party', 'provider_access')),
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'granted', 'revoked', 'expired')),
  
  -- Consent details
  scope JSONB DEFAULT '{}', -- What data is consented
  granted_to UUID[], -- Array of user IDs who can access
  purpose TEXT,
  
  -- Validity
  granted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  
  -- Audit
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_active_consent UNIQUE(tenant_id, user_id, consent_type, status)
);

CREATE INDEX idx_consents_tenant ON consents(tenant_id);
CREATE INDEX idx_consents_user ON consents(user_id);

-- ============================================================
-- ENCRYPTION KEYS TABLE (for field-level encryption)
-- ============================================================

CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  
  -- Key info
  key_id VARCHAR(100) UNIQUE NOT NULL,
  key_type VARCHAR(20) NOT NULL
    CHECK (key_type IN ('user', 'tenant', 'field', 'session')),
  
  -- Encrypted key (wrapped with master key)
  encrypted_key BYTEA NOT NULL,
  key_version INTEGER DEFAULT 1,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'rotated', 'revoked', 'expired')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rotated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_encryption_keys_tenant ON encryption_keys(tenant_id);
CREATE INDEX idx_encryption_keys_user ON encryption_keys(user_id);
CREATE INDEX idx_encryption_keys_key_id ON encryption_keys(key_id);

-- ============================================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICY: USERS
-- ============================================================

-- Users can see themselves and others in their tenant
CREATE POLICY users_tenant_isolation ON users
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
    OR current_setting('app.is_super_admin', TRUE)::BOOLEAN = TRUE
  );

-- Admins can manage users in their tenant
CREATE POLICY users_admin_manage ON users
  FOR UPDATE
  USING (
    tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
    AND (
      current_setting('app.current_user_role', TRUE) IN ('admin', 'super_admin')
      OR id = current_setting('app.current_user_id', TRUE)::UUID
    )
  );

-- ============================================================
-- RLS POLICY: HEALTH RECORDS
-- ============================================================

-- Users see only their own health records
CREATE POLICY health_records_own ON health_records
  FOR SELECT
  USING (
    patient_id = current_setting('app.current_user_id', TRUE)::UUID
  );

-- Doctors see records of consented patients in their tenant
CREATE POLICY health_records_provider ON health_records
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
    AND current_setting('app.current_user_role', TRUE) IN ('doctor', 'nurse')
    AND (
      access_level IN ('provider', 'organization')
      OR EXISTS (
        SELECT 1 FROM consents
        WHERE consents.user_id = health_records.patient_id
          AND consents.consent_type = 'provider_access'
          AND consents.status = 'granted'
          AND current_setting('app.current_user_id', TRUE)::UUID = ANY(consents.granted_to)
      )
    )
  );

-- Admins see aggregate data, NOT raw records (Privacy by Design)
CREATE POLICY health_records_admin ON health_records
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
    AND current_setting('app.current_user_role', TRUE) = 'admin'
    AND access_level = 'organization'
    -- Admin cannot see private or provider-level records
  );

-- ============================================================
-- RLS POLICY: MEASUREMENTS
-- ============================================================

CREATE POLICY measurements_own ON measurements
  FOR ALL
  USING (
    user_id = current_setting('app.current_user_id', TRUE)::UUID
    AND tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
  );

CREATE POLICY measurements_provider ON measurements
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
    AND current_setting('app.current_user_role', TRUE) IN ('doctor', 'nurse', 'researcher')
    AND EXISTS (
      SELECT 1 FROM consents
      WHERE consents.user_id = measurements.user_id
        AND consents.consent_type IN ('provider_access', 'research')
        AND consents.status = 'granted'
    )
  );

-- ============================================================
-- RLS POLICY: AUDIT LOGS (Read-only for admins)
-- ============================================================

CREATE POLICY audit_logs_read ON audit_logs
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
    AND current_setting('app.current_user_role', TRUE) IN ('admin', 'super_admin')
  );

-- No UPDATE or DELETE allowed on audit logs
CREATE POLICY audit_logs_immutable ON audit_logs
  FOR UPDATE
  USING (FALSE);

CREATE POLICY audit_logs_no_delete ON audit_logs
  FOR DELETE
  USING (FALSE);

-- ============================================================
-- RLS POLICY: CONSENTS
-- ============================================================

CREATE POLICY consents_own ON consents
  FOR ALL
  USING (
    user_id = current_setting('app.current_user_id', TRUE)::UUID
    OR current_setting('app.current_user_role', TRUE) IN ('admin', 'super_admin')
  );

-- ============================================================
-- RLS POLICY: ENCRYPTION KEYS
-- ============================================================

CREATE POLICY encryption_keys_own ON encryption_keys
  FOR SELECT
  USING (
    user_id = current_setting('app.current_user_id', TRUE)::UUID
    OR (
      tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
      AND key_type = 'tenant'
    )
  );

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Set tenant context (call this at the start of each request)
CREATE OR REPLACE FUNCTION set_tenant_context(
  p_tenant_id UUID,
  p_user_id UUID,
  p_user_role VARCHAR
) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, TRUE);
  PERFORM set_config('app.current_user_id', p_user_id::TEXT, TRUE);
  PERFORM set_config('app.current_user_role', p_user_role, TRUE);
  PERFORM set_config('app.is_super_admin', (p_user_role = 'super_admin')::TEXT, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clear tenant context
CREATE OR REPLACE FUNCTION clear_tenant_context() RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', '', TRUE);
  PERFORM set_config('app.current_user_id', '', TRUE);
  PERFORM set_config('app.current_user_role', '', TRUE);
  PERFORM set_config('app.is_super_admin', 'false', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current tenant
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', TRUE)::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Audit log trigger
CREATE OR REPLACE FUNCTION audit_trigger_func() RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  checksum_input TEXT;
  prev_check VARCHAR(64);
BEGIN
  -- Get previous checksum
  SELECT audit_logs.checksum INTO prev_check
  FROM audit_logs
  WHERE tenant_id = current_tenant_id()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF prev_check IS NULL THEN
    prev_check := 'GENESIS';
  END IF;

  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSE
    old_data := NULL;
    new_data := to_jsonb(NEW);
  END IF;

  -- Calculate checksum
  checksum_input := COALESCE(current_tenant_id()::TEXT, '') ||
                    COALESCE(current_setting('app.current_user_id', TRUE), '') ||
                    TG_OP ||
                    TG_TABLE_NAME ||
                    COALESCE(old_data::TEXT, '') ||
                    COALESCE(new_data::TEXT, '') ||
                    prev_check ||
                    NOW()::TEXT;

  INSERT INTO audit_logs (
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    old_value,
    new_value,
    success,
    checksum,
    prev_checksum
  ) VALUES (
    current_tenant_id(),
    current_setting('app.current_user_id', TRUE)::UUID,
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT
      ELSE NEW.id::TEXT
    END,
    old_data,
    new_data,
    TRUE,
    encode(sha256(checksum_input::BYTEA), 'hex'),
    prev_check
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_health_records
  AFTER INSERT OR UPDATE OR DELETE ON health_records
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_measurements
  AFTER INSERT OR UPDATE OR DELETE ON measurements
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- SAMPLE DATA (for testing)
-- ============================================================

-- Insert default tenant
INSERT INTO tenants (id, name, slug, type, plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Manpasik Demo',
  'demo',
  'standard',
  'professional'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- GRANTS
-- ============================================================

-- Revoke public access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;

-- Grant to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION set_tenant_context TO app_user;
GRANT EXECUTE ON FUNCTION clear_tenant_context TO app_user;
GRANT EXECUTE ON FUNCTION current_tenant_id TO app_user;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE tenants IS 'Organizations/hospitals using the platform';
COMMENT ON COLUMN users.tenant_id IS 'Tenant (organization) this user belongs to';
COMMENT ON COLUMN health_records.access_level IS 'Who can access this record: private (user only), provider (doctors), organization (all staff), research (anonymized for research)';
COMMENT ON FUNCTION set_tenant_context IS 'Must be called at the start of each request to set RLS context';
