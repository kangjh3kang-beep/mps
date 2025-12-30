/**
 * ============================================================
 * PERMISSION SYSTEM TESTS
 * 권한 레벨 시스템 테스트
 * ============================================================
 */

import {
  MemberLevel,
  hasPermission,
  hasMinLevel,
  hasAnyPermission,
  hasAllPermissions,
  canAccessProMode,
  isExpert,
  isAdmin,
  isSuperAdmin,
  getLevelMeta,
  getLevelName,
  createGuestUser,
  createTestUser,
  type User,
  type Permission
} from '@/lib/auth/permissions';

describe('Permission System', () => {
  // ============================================
  // MemberLevel Tests
  // ============================================
  describe('MemberLevel Hierarchy', () => {
    it('should have correct level order', () => {
      expect(MemberLevel.GUEST).toBeLessThan(MemberLevel.ASSOCIATE);
      expect(MemberLevel.ASSOCIATE).toBeLessThan(MemberLevel.MEMBER);
      expect(MemberLevel.MEMBER).toBeLessThan(MemberLevel.EXPERT);
      expect(MemberLevel.EXPERT).toBeLessThan(MemberLevel.RESEARCHER);
      expect(MemberLevel.RESEARCHER).toBeLessThan(MemberLevel.REGIONAL_ADMIN);
      expect(MemberLevel.REGIONAL_ADMIN).toBeLessThan(MemberLevel.NATIONAL_ADMIN);
      expect(MemberLevel.NATIONAL_ADMIN).toBeLessThan(MemberLevel.SUPER_ADMIN);
    });

    it('should have future expansion levels above SUPER_ADMIN', () => {
      expect(MemberLevel.PARTNER).toBeGreaterThan(MemberLevel.SUPER_ADMIN);
      expect(MemberLevel.ENTERPRISE).toBeGreaterThan(MemberLevel.SUPER_ADMIN);
      expect(MemberLevel.GOVERNMENT).toBeGreaterThan(MemberLevel.SUPER_ADMIN);
    });
  });

  // ============================================
  // hasPermission Tests
  // ============================================
  describe('hasPermission', () => {
    it('should return false for null user', () => {
      expect(hasPermission(null, 'view_dashboard')).toBe(false);
    });

    it('should allow GUEST to view dashboard', () => {
      const guest = createGuestUser();
      expect(hasPermission(guest, 'view_dashboard')).toBe(true);
    });

    it('should not allow GUEST to perform measurement', () => {
      const guest = createGuestUser();
      expect(hasPermission(guest, 'perform_measurement')).toBe(false);
    });

    it('should allow ASSOCIATE to perform measurement', () => {
      const associate = createTestUser(MemberLevel.ASSOCIATE);
      expect(hasPermission(associate, 'perform_measurement')).toBe(true);
    });

    it('should allow MEMBER to access mall', () => {
      const member = createTestUser(MemberLevel.MEMBER);
      expect(hasPermission(member, 'mall_access')).toBe(true);
    });

    it('should allow EXPERT to access pro mode', () => {
      const expert = createTestUser(MemberLevel.EXPERT);
      expect(hasPermission(expert, 'pro_mode_access')).toBe(true);
    });

    it('should allow RESEARCHER to access research hub', () => {
      const researcher = createTestUser(MemberLevel.RESEARCHER);
      expect(hasPermission(researcher, 'research_hub_access')).toBe(true);
    });

    it('should allow SUPER_ADMIN to access all permissions', () => {
      const admin = createTestUser(MemberLevel.SUPER_ADMIN);
      expect(hasPermission(admin, 'system_config')).toBe(true);
      expect(hasPermission(admin, 'security_settings')).toBe(true);
      expect(hasPermission(admin, 'audit_logs')).toBe(true);
    });
  });

  // ============================================
  // hasMinLevel Tests
  // ============================================
  describe('hasMinLevel', () => {
    it('should return false for null user', () => {
      expect(hasMinLevel(null, MemberLevel.GUEST)).toBe(false);
    });

    it('should return true when user level equals minimum', () => {
      const member = createTestUser(MemberLevel.MEMBER);
      expect(hasMinLevel(member, MemberLevel.MEMBER)).toBe(true);
    });

    it('should return true when user level exceeds minimum', () => {
      const expert = createTestUser(MemberLevel.EXPERT);
      expect(hasMinLevel(expert, MemberLevel.MEMBER)).toBe(true);
    });

    it('should return false when user level is below minimum', () => {
      const associate = createTestUser(MemberLevel.ASSOCIATE);
      expect(hasMinLevel(associate, MemberLevel.MEMBER)).toBe(false);
    });
  });

  // ============================================
  // hasAnyPermission / hasAllPermissions Tests
  // ============================================
  describe('hasAnyPermission', () => {
    it('should return true if user has any of the permissions', () => {
      const member = createTestUser(MemberLevel.MEMBER);
      expect(hasAnyPermission(member, ['pro_mode_access', 'mall_access'])).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      const guest = createGuestUser();
      expect(hasAnyPermission(guest, ['pro_mode_access', 'mall_access'])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      const member = createTestUser(MemberLevel.MEMBER);
      expect(hasAllPermissions(member, ['view_dashboard', 'mall_access'])).toBe(true);
    });

    it('should return false if user is missing any permission', () => {
      const member = createTestUser(MemberLevel.MEMBER);
      expect(hasAllPermissions(member, ['mall_access', 'pro_mode_access'])).toBe(false);
    });
  });

  // ============================================
  // canAccessProMode Tests
  // ============================================
  describe('canAccessProMode', () => {
    it('should return false for null user', () => {
      expect(canAccessProMode(null)).toBe(false);
    });

    it('should return false for MEMBER level', () => {
      const member = createTestUser(MemberLevel.MEMBER);
      expect(canAccessProMode(member)).toBe(false);
    });

    it('should return true for verified EXPERT', () => {
      const expert = createTestUser(MemberLevel.EXPERT);
      expect(canAccessProMode(expert)).toBe(true);
    });

    it('should return false for unverified EXPERT', () => {
      const expert: User = {
        ...createTestUser(MemberLevel.EXPERT),
        verificationStatus: 'pending'
      };
      expect(canAccessProMode(expert)).toBe(false);
    });

    it('should return true for REGIONAL_ADMIN without verification', () => {
      const admin: User = {
        ...createTestUser(MemberLevel.REGIONAL_ADMIN),
        verificationStatus: 'pending'
      };
      expect(canAccessProMode(admin)).toBe(true);
    });
  });

  // ============================================
  // Helper Functions Tests
  // ============================================
  describe('isExpert / isAdmin / isSuperAdmin', () => {
    it('isExpert should return true for EXPERT and above', () => {
      expect(isExpert(createTestUser(MemberLevel.MEMBER))).toBe(false);
      expect(isExpert(createTestUser(MemberLevel.EXPERT))).toBe(true);
      expect(isExpert(createTestUser(MemberLevel.SUPER_ADMIN))).toBe(true);
    });

    it('isAdmin should return true for REGIONAL_ADMIN and above', () => {
      expect(isAdmin(createTestUser(MemberLevel.EXPERT))).toBe(false);
      expect(isAdmin(createTestUser(MemberLevel.REGIONAL_ADMIN))).toBe(true);
      expect(isAdmin(createTestUser(MemberLevel.SUPER_ADMIN))).toBe(true);
    });

    it('isSuperAdmin should return true only for SUPER_ADMIN', () => {
      expect(isSuperAdmin(createTestUser(MemberLevel.NATIONAL_ADMIN))).toBe(false);
      expect(isSuperAdmin(createTestUser(MemberLevel.SUPER_ADMIN))).toBe(true);
    });
  });

  // ============================================
  // getLevelMeta Tests
  // ============================================
  describe('getLevelMeta', () => {
    it('should return correct metadata for each level', () => {
      const guestMeta = getLevelMeta(MemberLevel.GUEST);
      expect(guestMeta.nameKo).toBe('비회원');
      expect(guestMeta.icon).toBe('👤');

      const expertMeta = getLevelMeta(MemberLevel.EXPERT);
      expect(expertMeta.nameKo).toBe('전문가');
      expect(expertMeta.icon).toBe('🏆');

      const adminMeta = getLevelMeta(MemberLevel.SUPER_ADMIN);
      expect(adminMeta.nameKo).toBe('총괄 관리자');
      expect(adminMeta.icon).toBe('👑');
    });
  });

  describe('getLevelName', () => {
    it('should return Korean name by default', () => {
      expect(getLevelName(MemberLevel.MEMBER)).toBe('정회원');
    });

    it('should return English name when specified', () => {
      expect(getLevelName(MemberLevel.MEMBER, 'en')).toBe('Member');
    });
  });
});


