/**
 * ============================================================
 * ENTERPRISE IAM (Identity & Access Management)
 * SAML 2.0 / OIDC Federation Support
 * ============================================================
 * 
 * Features:
 * - SAML 2.0 SSO for hospitals/enterprises
 * - OIDC support for modern IdPs
 * - Azure AD, Okta, Google Workspace integration
 * - Role-Based Access Control (RBAC)
 * - Attribute-Based Access Control (ABAC)
 * 
 * Use Cases:
 * - Samsung Medical: Employees log in with hospital ID
 * - Johns Hopkins: Federated identity with existing AD
 * - Research Consortium: Cross-organization access
 */

import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// ============================================
// TYPES
// ============================================

export enum UserRole {
  GUEST = 'guest',           // Unauthenticated or minimal access
  USER = 'user',             // Regular patient/user
  FAMILY = 'family',         // Family member with consent
  DOCTOR = 'doctor',         // Licensed medical doctor
  NURSE = 'nurse',           // Licensed nurse
  PHARMACIST = 'pharmacist', // Licensed pharmacist
  RESEARCHER = 'researcher', // Research access (anonymized data)
  ANALYST = 'analyst',       // Data analyst (aggregated data)
  ADMIN = 'admin',           // Organization admin
  SUPER_ADMIN = 'super',     // Platform super admin
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'execute')[];
  conditions?: Record<string, any>;
}

export interface RoleDefinition {
  role: UserRole;
  name: string;
  description: string;
  permissions: Permission[];
  inheritsFrom?: UserRole[];
}

export interface SSOConfig {
  provider: 'saml' | 'oidc' | 'azure_ad' | 'okta' | 'google';
  tenantId: string;
  enabled: boolean;
  
  // SAML-specific
  saml?: {
    entryPoint: string;
    issuer: string;
    cert: string;
    callbackUrl: string;
    signatureAlgorithm: 'sha256' | 'sha512';
    digestAlgorithm: 'sha256' | 'sha512';
    wantAssertionsSigned: boolean;
    attributeMapping: Record<string, string>;
  };
  
  // OIDC-specific
  oidc?: {
    clientId: string;
    clientSecret: string;
    issuer: string;
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    scope: string[];
    claimsMapping: Record<string, string>;
  };
  
  // Azure AD-specific
  azureAd?: {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    scope: string[];
  };
  
  // Role mapping from IdP to Manpasik roles
  roleMapping: Record<string, UserRole>;
  
  // Default role for new SSO users
  defaultRole: UserRole;
  
  // Domain restriction (only allow users from specific domains)
  allowedDomains?: string[];
}

export interface EnterpriseUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  
  // SSO attributes
  ssoId?: string;
  ssoProvider?: string;
  department?: string;
  employeeId?: string;
  
  // Medical credentials (for doctors/nurses)
  credentials?: {
    licenseNumber: string;
    licenseType: string;
    expiresAt: string;
    verifiedAt: string;
    specialty?: string;
  };
  
  // Access control
  permissions: string[];
  dataAccessLevel: 'own' | 'consented' | 'department' | 'organization' | 'research';
  
  // Session info
  mfaEnabled: boolean;
  mfaVerified: boolean;
  lastLoginAt: string;
  sessionId: string;
}

// ============================================
// ROLE DEFINITIONS (RBAC)
// ============================================

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  [UserRole.GUEST]: {
    role: UserRole.GUEST,
    name: '게스트',
    description: '기본 접근만 가능',
    permissions: [
      { resource: 'public:*', actions: ['read'] },
      { resource: 'auth:*', actions: ['execute'] },
    ],
  },
  
  [UserRole.USER]: {
    role: UserRole.USER,
    name: '사용자',
    description: '개인 건강 데이터 관리',
    permissions: [
      { resource: 'health:own', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'measurements:own', actions: ['create', 'read'] },
      { resource: 'reports:own', actions: ['read'] },
      { resource: 'consents:own', actions: ['create', 'read', 'update'] },
      { resource: 'profile:own', actions: ['read', 'update'] },
      { resource: 'devices:own', actions: ['create', 'read', 'update', 'delete'] },
    ],
    inheritsFrom: [UserRole.GUEST],
  },
  
  [UserRole.FAMILY]: {
    role: UserRole.FAMILY,
    name: '가족',
    description: '동의받은 가족 데이터 조회',
    permissions: [
      { resource: 'health:consented', actions: ['read'], conditions: { consentType: 'family' } },
      { resource: 'alerts:consented', actions: ['read'] },
    ],
    inheritsFrom: [UserRole.USER],
  },
  
  [UserRole.DOCTOR]: {
    role: UserRole.DOCTOR,
    name: '의사',
    description: '환자 데이터 조회 및 진료',
    permissions: [
      { resource: 'health:consented', actions: ['read'], conditions: { consentType: 'provider_access' } },
      { resource: 'measurements:consented', actions: ['read'] },
      { resource: 'diagnosis:*', actions: ['create', 'read', 'update'] },
      { resource: 'prescription:*', actions: ['create', 'read'] },
      { resource: 'notes:patient', actions: ['create', 'read', 'update'] },
      { resource: 'referrals:*', actions: ['create', 'read'] },
    ],
    inheritsFrom: [UserRole.USER],
  },
  
  [UserRole.NURSE]: {
    role: UserRole.NURSE,
    name: '간호사',
    description: '환자 데이터 조회 및 기록',
    permissions: [
      { resource: 'health:consented', actions: ['read'], conditions: { consentType: 'provider_access' } },
      { resource: 'measurements:consented', actions: ['read', 'create'] },
      { resource: 'vitals:*', actions: ['create', 'read'] },
      { resource: 'notes:nursing', actions: ['create', 'read', 'update'] },
    ],
    inheritsFrom: [UserRole.USER],
  },
  
  [UserRole.PHARMACIST]: {
    role: UserRole.PHARMACIST,
    name: '약사',
    description: '처방전 조회',
    permissions: [
      { resource: 'prescription:consented', actions: ['read'] },
      { resource: 'drug_interactions:*', actions: ['read'] },
      { resource: 'dispensing:*', actions: ['create', 'read'] },
    ],
    inheritsFrom: [UserRole.USER],
  },
  
  [UserRole.RESEARCHER]: {
    role: UserRole.RESEARCHER,
    name: '연구자',
    description: '익명화된 연구 데이터 접근',
    permissions: [
      { resource: 'health:anonymized', actions: ['read'], conditions: { consentType: 'research' } },
      { resource: 'aggregate:*', actions: ['read'] },
      { resource: 'cohorts:*', actions: ['create', 'read'] },
      { resource: 'exports:anonymized', actions: ['create', 'read'] },
    ],
    inheritsFrom: [UserRole.USER],
  },
  
  [UserRole.ANALYST]: {
    role: UserRole.ANALYST,
    name: '분석가',
    description: '집계 데이터 분석',
    permissions: [
      { resource: 'aggregate:*', actions: ['read'] },
      { resource: 'dashboards:analytics', actions: ['read'] },
      { resource: 'reports:organization', actions: ['read'] },
    ],
    inheritsFrom: [UserRole.USER],
  },
  
  [UserRole.ADMIN]: {
    role: UserRole.ADMIN,
    name: '관리자',
    description: '조직 관리 (환자 데이터 직접 접근 불가)',
    permissions: [
      { resource: 'users:organization', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'audit:organization', actions: ['read'] },
      { resource: 'settings:organization', actions: ['read', 'update'] },
      { resource: 'billing:organization', actions: ['read', 'update'] },
      { resource: 'compliance:organization', actions: ['read'] },
      // NOTE: No direct patient data access (Privacy by Design)
    ],
    inheritsFrom: [UserRole.USER],
  },
  
  [UserRole.SUPER_ADMIN]: {
    role: UserRole.SUPER_ADMIN,
    name: '총괄관리자',
    description: '플랫폼 전체 관리',
    permissions: [
      { resource: '*', actions: ['create', 'read', 'update', 'delete', 'execute'] },
    ],
    inheritsFrom: [UserRole.ADMIN],
  },
};

// ============================================
// PERMISSION CHECKING
// ============================================

/**
 * Get all permissions for a role (including inherited)
 */
export function getAllPermissions(role: UserRole): Permission[] {
  const roleDef = ROLE_DEFINITIONS[role];
  if (!roleDef) return [];
  
  const permissions = [...roleDef.permissions];
  
  if (roleDef.inheritsFrom) {
    for (const inheritedRole of roleDef.inheritsFrom) {
      permissions.push(...getAllPermissions(inheritedRole));
    }
  }
  
  return permissions;
}

/**
 * Check if a user has permission for a resource action
 */
export function hasPermission(
  user: EnterpriseUser,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'execute',
  context?: Record<string, any>
): boolean {
  const permissions = getAllPermissions(user.role);
  
  for (const permission of permissions) {
    // Check if resource matches (supports wildcards)
    const resourcePattern = new RegExp(
      `^${permission.resource.replace(/\*/g, '.*')}$`
    );
    
    if (!resourcePattern.test(resource)) continue;
    if (!permission.actions.includes(action)) continue;
    
    // Check conditions if present
    if (permission.conditions && context) {
      const conditionsMet = Object.entries(permission.conditions).every(
        ([key, value]) => context[key] === value
      );
      if (!conditionsMet) continue;
    }
    
    return true;
  }
  
  return false;
}

/**
 * Check if user can access specific patient data
 */
export function canAccessPatientData(
  user: EnterpriseUser,
  patientId: string,
  accessType: 'read' | 'write'
): { allowed: boolean; reason: string } {
  // Users can always access their own data
  if (user.id === patientId) {
    return { allowed: true, reason: 'Own data' };
  }
  
  // Role-based checks
  switch (user.role) {
    case UserRole.GUEST:
    case UserRole.USER:
    case UserRole.ANALYST:
      return { allowed: false, reason: 'Role does not permit patient data access' };
    
    case UserRole.FAMILY:
      // Family needs explicit consent
      return { 
        allowed: false, // Would check consent table in real implementation
        reason: 'Consent verification required' 
      };
    
    case UserRole.DOCTOR:
    case UserRole.NURSE:
    case UserRole.PHARMACIST:
      // Medical professionals need consent
      return {
        allowed: false, // Would check consent table in real implementation
        reason: 'Consent verification required'
      };
    
    case UserRole.RESEARCHER:
      // Researchers only get anonymized data
      return { 
        allowed: false, 
        reason: 'Researchers can only access anonymized aggregate data' 
      };
    
    case UserRole.ADMIN:
      // Admins cannot access patient data directly (Privacy by Design)
      return { 
        allowed: false, 
        reason: 'Admins cannot access individual patient data' 
      };
    
    case UserRole.SUPER_ADMIN:
      // Super admin can access with audit
      if (accessType === 'read') {
        return { 
          allowed: true, 
          reason: 'Super admin access (audited)' 
        };
      }
      return { 
        allowed: false, 
        reason: 'Even super admin cannot modify patient data directly' 
      };
    
    default:
      return { allowed: false, reason: 'Unknown role' };
  }
}

// ============================================
// SSO CONFIGURATION
// ============================================

/**
 * Create NextAuth options for SAML provider
 */
export function createSAMLProvider(config: SSOConfig['saml']) {
  if (!config) throw new Error('SAML config required');
  
  return {
    id: 'saml',
    name: 'SAML SSO',
    type: 'oauth' as const,
    version: '2.0',
    
    authorization: {
      url: config.entryPoint,
      params: {
        response_type: 'code',
      },
    },
    
    // In production, use passport-saml or similar
    profile(profile: any) {
      const mapping = config.attributeMapping;
      
      return {
        id: profile[mapping.id || 'nameID'],
        email: profile[mapping.email || 'email'],
        name: profile[mapping.name || 'displayName'],
        department: profile[mapping.department],
        employeeId: profile[mapping.employeeId],
      };
    },
  };
}

/**
 * Create NextAuth options for Azure AD
 */
export function createAzureADProvider(config: SSOConfig['azureAd']) {
  if (!config) throw new Error('Azure AD config required');
  
  return {
    id: 'azure-ad',
    name: 'Microsoft',
    type: 'oauth' as const,
    
    wellKnown: `https://login.microsoftonline.com/${config.tenantId}/v2.0/.well-known/openid-configuration`,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    
    authorization: {
      params: { scope: config.scope.join(' ') },
    },
    
    profile(profile: any) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email || profile.preferred_username,
        department: profile.department,
        employeeId: profile.employee_id,
      };
    },
  };
}

/**
 * Create NextAuth options for Okta
 */
export function createOktaProvider(config: SSOConfig['oidc']) {
  if (!config) throw new Error('OIDC config required');
  
  return {
    id: 'okta',
    name: 'Okta',
    type: 'oauth' as const,
    
    wellKnown: `${config.issuer}/.well-known/openid-configuration`,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    
    authorization: {
      params: { scope: config.scope.join(' ') },
    },
    
    profile(profile: any) {
      const mapping = config.claimsMapping;
      
      return {
        id: profile[mapping.id || 'sub'],
        name: profile[mapping.name || 'name'],
        email: profile[mapping.email || 'email'],
        groups: profile[mapping.groups || 'groups'],
      };
    },
  };
}

// ============================================
// SESSION & JWT CALLBACKS
// ============================================

export function createEnterpriseCallbacks(ssoConfig?: SSOConfig) {
  return {
    async jwt({ token, user, account }: any): Promise<JWT> {
      if (account && user) {
        // Initial sign-in
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.tenantId = user.tenantId;
        token.ssoProvider = account.provider;
        
        // Map role from SSO groups or default
        if (ssoConfig && user.groups) {
          const mappedRole = mapSSORole(user.groups, ssoConfig.roleMapping);
          token.role = mappedRole || ssoConfig.defaultRole;
        } else {
          token.role = user.role || UserRole.USER;
        }
        
        // Add enterprise fields
        token.department = user.department;
        token.employeeId = user.employeeId;
        token.credentials = user.credentials;
        token.dataAccessLevel = user.dataAccessLevel || 'own';
        token.mfaEnabled = user.mfaEnabled || false;
        token.mfaVerified = false;
      }
      
      return token;
    },
    
    async session({ session, token }: any) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.tenantId = token.tenantId;
      session.user.department = token.department;
      session.user.employeeId = token.employeeId;
      session.user.dataAccessLevel = token.dataAccessLevel;
      session.user.mfaEnabled = token.mfaEnabled;
      session.user.mfaVerified = token.mfaVerified;
      session.user.permissions = getAllPermissions(token.role as UserRole)
        .map(p => `${p.resource}:${p.actions.join(',')}`);
      
      return session;
    },
  };
}

function mapSSORole(
  groups: string[], 
  roleMapping: Record<string, UserRole>
): UserRole | null {
  for (const [pattern, role] of Object.entries(roleMapping)) {
    const regex = new RegExp(pattern, 'i');
    if (groups.some(g => regex.test(g))) {
      return role;
    }
  }
  return null;
}

// ============================================
// MEDICAL CREDENTIAL VERIFICATION
// ============================================

export interface CredentialVerification {
  licenseNumber: string;
  licenseType: 'doctor' | 'nurse' | 'pharmacist' | 'therapist';
  fullName: string;
  dateOfBirth: string;
  country: string;
}

/**
 * Verify medical credentials (mock implementation)
 * In production, integrate with:
 * - 대한의사협회 (Korean Medical Association)
 * - 국가자격정보시스템 (National Qualification Information System)
 * - State Medical Boards (US)
 */
export async function verifyMedicalCredential(
  verification: CredentialVerification
): Promise<{ 
  verified: boolean; 
  details?: any; 
  error?: string;
  expiresAt?: string;
}> {
  // Mock verification - in production, call real verification APIs
  console.log('[IAM] Verifying medical credential:', verification.licenseNumber);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock validation rules
  if (!verification.licenseNumber.match(/^[A-Z]{2}\d{6}$/)) {
    return { verified: false, error: 'Invalid license number format' };
  }
  
  // Mock successful verification
  return {
    verified: true,
    details: {
      name: verification.fullName,
      licenseType: verification.licenseType,
      licenseNumber: verification.licenseNumber,
      status: 'active',
      specialty: 'General Practice',
      issuedAt: '2020-01-15',
      verifiedAt: new Date().toISOString(),
    },
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  ROLE_DEFINITIONS,
  getAllPermissions,
  hasPermission,
  canAccessPatientData,
  createSAMLProvider,
  createAzureADProvider,
  createOktaProvider,
  createEnterpriseCallbacks,
  verifyMedicalCredential,
};


