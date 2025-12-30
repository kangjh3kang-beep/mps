/**
 * Enterprise IAM Tests
 * Verifies RBAC and permission checking
 */

import {
  UserRole,
  ROLE_DEFINITIONS,
  getAllPermissions,
  hasPermission,
  canAccessPatientData,
  verifyMedicalCredential,
  EnterpriseUser,
} from '@/lib/iam/enterprise-auth';

describe('Enterprise IAM', () => {
  const createTestUser = (overrides: Partial<EnterpriseUser> = {}): EnterpriseUser => ({
    id: 'user-123',
    email: 'test@hospital.com',
    name: 'Test User',
    role: UserRole.USER,
    tenantId: 'tenant-1',
    permissions: [],
    dataAccessLevel: 'own',
    mfaEnabled: true,
    mfaVerified: true,
    lastLoginAt: new Date().toISOString(),
    sessionId: 'session-123',
    ...overrides,
  });

  describe('Role Definitions', () => {
    it('should have all roles defined', () => {
      expect(ROLE_DEFINITIONS[UserRole.GUEST]).toBeDefined();
      expect(ROLE_DEFINITIONS[UserRole.USER]).toBeDefined();
      expect(ROLE_DEFINITIONS[UserRole.DOCTOR]).toBeDefined();
      expect(ROLE_DEFINITIONS[UserRole.NURSE]).toBeDefined();
      expect(ROLE_DEFINITIONS[UserRole.ADMIN]).toBeDefined();
      expect(ROLE_DEFINITIONS[UserRole.SUPER_ADMIN]).toBeDefined();
    });

    it('should have proper inheritance chain', () => {
      expect(ROLE_DEFINITIONS[UserRole.USER].inheritsFrom).toContain(UserRole.GUEST);
      expect(ROLE_DEFINITIONS[UserRole.DOCTOR].inheritsFrom).toContain(UserRole.USER);
      expect(ROLE_DEFINITIONS[UserRole.ADMIN].inheritsFrom).toContain(UserRole.USER);
      expect(ROLE_DEFINITIONS[UserRole.SUPER_ADMIN].inheritsFrom).toContain(UserRole.ADMIN);
    });
  });

  describe('Permission Inheritance', () => {
    it('should include inherited permissions', () => {
      const doctorPermissions = getAllPermissions(UserRole.DOCTOR);
      const guestPermissions = getAllPermissions(UserRole.GUEST);
      
      // Doctor should have guest permissions (through inheritance)
      const guestResources = guestPermissions.map(p => p.resource);
      const hasInherited = guestResources.some(r => 
        doctorPermissions.some(dp => dp.resource === r)
      );
      
      expect(hasInherited).toBe(true);
    });

    it('should aggregate permissions from all levels', () => {
      const superAdminPermissions = getAllPermissions(UserRole.SUPER_ADMIN);
      
      // Super admin should have wildcard permission
      expect(superAdminPermissions.some(p => p.resource === '*')).toBe(true);
    });
  });

  describe('Permission Checking', () => {
    it('should allow user to access own health data', () => {
      const user = createTestUser({ role: UserRole.USER });
      
      expect(hasPermission(user, 'health:own', 'read')).toBe(true);
      expect(hasPermission(user, 'health:own', 'create')).toBe(true);
      expect(hasPermission(user, 'health:own', 'delete')).toBe(true);
    });

    it('should deny user access to others data', () => {
      const user = createTestUser({ role: UserRole.USER });
      
      expect(hasPermission(user, 'health:other', 'read')).toBe(false);
      expect(hasPermission(user, 'health:consented', 'read')).toBe(false);
    });

    it('should allow doctor to read consented patient data', () => {
      const doctor = createTestUser({ role: UserRole.DOCTOR });
      
      expect(hasPermission(
        doctor, 
        'health:consented', 
        'read',
        { consentType: 'provider_access' }
      )).toBe(true);
    });

    it('should allow admin to manage organization users', () => {
      const admin = createTestUser({ role: UserRole.ADMIN });
      
      expect(hasPermission(admin, 'users:organization', 'create')).toBe(true);
      expect(hasPermission(admin, 'users:organization', 'read')).toBe(true);
      expect(hasPermission(admin, 'users:organization', 'delete')).toBe(true);
    });

    it('should deny admin direct patient data access', () => {
      const admin = createTestUser({ role: UserRole.ADMIN });
      
      // Admin should NOT be able to access health:consented
      // (they only have users:organization, audit:organization, etc.)
      expect(hasPermission(admin, 'health:consented', 'read')).toBe(false);
    });

    it('should allow super admin everything', () => {
      const superAdmin = createTestUser({ role: UserRole.SUPER_ADMIN });
      
      expect(hasPermission(superAdmin, 'any:resource', 'read')).toBe(true);
      expect(hasPermission(superAdmin, 'health:consented', 'read')).toBe(true);
      expect(hasPermission(superAdmin, 'admin:settings', 'update')).toBe(true);
    });
  });

  describe('Patient Data Access Control', () => {
    it('should allow users to access own data', () => {
      const user = createTestUser({ id: 'patient-123' });
      
      const result = canAccessPatientData(user, 'patient-123', 'read');
      
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Own data');
    });

    it('should deny regular users access to others data', () => {
      const user = createTestUser({ role: UserRole.USER });
      
      const result = canAccessPatientData(user, 'other-patient', 'read');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Role does not permit');
    });

    it('should require consent for doctor access', () => {
      const doctor = createTestUser({ role: UserRole.DOCTOR });
      
      const result = canAccessPatientData(doctor, 'patient-456', 'read');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Consent verification');
    });

    it('should deny admin direct patient access (Privacy by Design)', () => {
      const admin = createTestUser({ role: UserRole.ADMIN });
      
      const result = canAccessPatientData(admin, 'patient-789', 'read');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('cannot access individual patient data');
    });

    it('should restrict researchers to anonymized data', () => {
      const researcher = createTestUser({ role: UserRole.RESEARCHER });
      
      const result = canAccessPatientData(researcher, 'patient-111', 'read');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('anonymized');
    });

    it('should allow super admin read with audit', () => {
      const superAdmin = createTestUser({ role: UserRole.SUPER_ADMIN });
      
      const readResult = canAccessPatientData(superAdmin, 'patient-222', 'read');
      expect(readResult.allowed).toBe(true);
      expect(readResult.reason).toContain('audited');
      
      // Even super admin cannot modify
      const writeResult = canAccessPatientData(superAdmin, 'patient-222', 'write');
      expect(writeResult.allowed).toBe(false);
    });
  });

  describe('Medical Credential Verification', () => {
    it('should reject invalid license number format', async () => {
      const result = await verifyMedicalCredential({
        licenseNumber: 'invalid',
        licenseType: 'doctor',
        fullName: 'Dr. Test',
        dateOfBirth: '1980-01-01',
        country: 'KR',
      });

      expect(result.verified).toBe(false);
      expect(result.error).toContain('Invalid license number');
    });

    it('should verify valid license format', async () => {
      const result = await verifyMedicalCredential({
        licenseNumber: 'MD123456',
        licenseType: 'doctor',
        fullName: 'Dr. Kim',
        dateOfBirth: '1980-01-01',
        country: 'KR',
      });

      expect(result.verified).toBe(true);
      expect(result.details).toBeDefined();
      expect(result.details.status).toBe('active');
    });
  });

  describe('Role Hierarchy', () => {
    const roleHierarchy = [
      UserRole.GUEST,
      UserRole.USER,
      UserRole.NURSE,
      UserRole.DOCTOR,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ];

    it('should have increasing permission count up the hierarchy', () => {
      let prevCount = 0;
      
      for (const role of roleHierarchy) {
        const permissions = getAllPermissions(role);
        const count = permissions.length;
        
        expect(count).toBeGreaterThanOrEqual(prevCount);
        prevCount = count;
      }
    });
  });
});


