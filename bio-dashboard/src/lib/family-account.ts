/**
 * ============================================================
 * FAMILY ACCOUNT SYSTEM
 * Multi-Profile Health Management for Families
 * ============================================================
 * 
 * Generated from 41-Persona Simulation
 * Addressing: User #26 (주부), User #28 (중학생)
 * Issues: 
 *   - "가족 전체 관리 불편"
 *   - "부모가 모든 데이터 볼 수 있음" (프라이버시)
 */

// ============================================
// TYPES
// ============================================

export type FamilyRole = 'owner' | 'adult' | 'teen' | 'child';

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: FamilyRole;
  age: number;
  healthScore?: number;
  lastMeasurement?: string;
  privacyLevel: PrivacyLevel;
}

export interface FamilyAccount {
  id: string;
  name: string;
  ownerId: string;
  members: FamilyMember[];
  createdAt: string;
  plan: 'free' | 'family' | 'premium';
}

// ============================================
// PRIVACY SYSTEM (For Teens)
// ============================================

export type PrivacyLevel = 'full' | 'summary' | 'emergency_only' | 'private';

export interface PrivacySettings {
  memberId: string;
  level: PrivacyLevel;
  sharedWith: string[];  // Member IDs who can view
  hiddenMetrics: string[];  // Specific metrics to hide
  emergencyOverride: boolean;  // Allow viewing in emergency
}

/**
 * 프라이버시 레벨별 설명
 */
export const PRIVACY_LEVEL_DESCRIPTIONS: Record<PrivacyLevel, {
  title: string;
  description: string;
  emoji: string;
}> = {
  full: {
    title: "전체 공개",
    description: "가족 모두가 모든 건강 데이터를 볼 수 있어요",
    emoji: "👀"
  },
  summary: {
    title: "요약만 공개",
    description: "건강 점수와 간단한 상태만 공유돼요",
    emoji: "📊"
  },
  emergency_only: {
    title: "응급 시에만",
    description: "응급 상황에서만 가족이 데이터를 볼 수 있어요",
    emoji: "🆘"
  },
  private: {
    title: "비공개",
    description: "나만 볼 수 있어요 (만 14세 이상)",
    emoji: "🔒"
  }
};

// ============================================
// FAMILY DASHBOARD DATA
// ============================================

export interface FamilyDashboardData {
  familyHealthScore: number;  // Average of all members
  alerts: FamilyAlert[];
  memberSummaries: MemberSummary[];
}

export interface FamilyAlert {
  id: string;
  memberId: string;
  memberName: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: string;
}

export interface MemberSummary {
  memberId: string;
  name: string;
  avatar: string;
  healthScore: number | null;  // null if private
  trend: 'up' | 'down' | 'stable' | 'unknown';
  lastActive: string;
  needsAttention: boolean;
}

// ============================================
// FAMILY ACCOUNT MANAGER
// ============================================

class FamilyAccountManager {
  private currentFamily: FamilyAccount | null = null;
  private privacySettings: Map<string, PrivacySettings> = new Map();

  /**
   * 가족 계정 생성
   */
  createFamily(name: string, owner: Omit<FamilyMember, 'id' | 'privacyLevel'>): FamilyAccount {
    const ownerId = `member-${Date.now()}`;
    const ownerMember: FamilyMember = {
      ...owner,
      id: ownerId,
      role: 'owner',
      privacyLevel: 'full'
    };

    const family: FamilyAccount = {
      id: `family-${Date.now()}`,
      name,
      ownerId,
      members: [ownerMember],
      createdAt: new Date().toISOString(),
      plan: 'family'
    };

    this.currentFamily = family;
    this.privacySettings.set(ownerId, {
      memberId: ownerId,
      level: 'full',
      sharedWith: [],
      hiddenMetrics: [],
      emergencyOverride: true
    });

    return family;
  }

  /**
   * 가족 구성원 추가
   */
  addMember(member: Omit<FamilyMember, 'id' | 'privacyLevel'>): FamilyMember | null {
    if (!this.currentFamily) return null;

    const id = `member-${Date.now()}`;
    
    // 역할 결정
    let role: FamilyRole = 'adult';
    let privacyLevel: PrivacyLevel = 'full';
    
    if (member.age < 13) {
      role = 'child';
      privacyLevel = 'full';  // 아이들은 부모가 전체 볼 수 있음
    } else if (member.age < 18) {
      role = 'teen';
      privacyLevel = 'summary';  // 청소년은 기본 요약만
    }

    const newMember: FamilyMember = {
      ...member,
      id,
      role,
      privacyLevel
    };

    this.currentFamily.members.push(newMember);
    
    this.privacySettings.set(id, {
      memberId: id,
      level: privacyLevel,
      sharedWith: [this.currentFamily.ownerId],
      hiddenMetrics: [],
      emergencyOverride: true
    });

    return newMember;
  }

  /**
   * 프라이버시 설정 업데이트
   */
  updatePrivacy(memberId: string, settings: Partial<PrivacySettings>): boolean {
    if (!this.currentFamily) return false;

    const member = this.currentFamily.members.find(m => m.id === memberId);
    if (!member) return false;

    // 만 14세 미만은 비공개 설정 불가
    if (settings.level === 'private' && member.age < 14) {
      console.warn('[Family] Under 14 cannot set private mode');
      return false;
    }

    const current = this.privacySettings.get(memberId);
    if (current) {
      this.privacySettings.set(memberId, { ...current, ...settings });
      member.privacyLevel = settings.level ?? current.level;
    }

    return true;
  }

  /**
   * 다른 구성원의 데이터 조회 가능 여부 확인
   */
  canViewMemberData(
    viewerId: string, 
    targetId: string, 
    isEmergency = false
  ): {
    canView: boolean;
    level: 'full' | 'summary' | 'none';
    reason: string;
  } {
    if (viewerId === targetId) {
      return { canView: true, level: 'full', reason: '본인 데이터' };
    }

    const privacy = this.privacySettings.get(targetId);
    if (!privacy) {
      return { canView: false, level: 'none', reason: '설정 없음' };
    }

    // 응급 상황 오버라이드
    if (isEmergency && privacy.emergencyOverride) {
      return { canView: true, level: 'full', reason: '응급 상황' };
    }

    // 공유 대상 확인
    if (!privacy.sharedWith.includes(viewerId)) {
      return { canView: false, level: 'none', reason: '공유 대상 아님' };
    }

    switch (privacy.level) {
      case 'full':
        return { canView: true, level: 'full', reason: '전체 공개' };
      case 'summary':
        return { canView: true, level: 'summary', reason: '요약만 공개' };
      case 'emergency_only':
        return { 
          canView: isEmergency, 
          level: isEmergency ? 'full' : 'none', 
          reason: '응급 시에만' 
        };
      case 'private':
        return { canView: false, level: 'none', reason: '비공개' };
    }
  }

  /**
   * 가족 대시보드 데이터 생성
   */
  getFamilyDashboard(viewerId: string): FamilyDashboardData | null {
    if (!this.currentFamily) return null;

    const summaries: MemberSummary[] = [];
    const alerts: FamilyAlert[] = [];
    let totalScore = 0;
    let scoreCount = 0;

    for (const member of this.currentFamily.members) {
      const access = this.canViewMemberData(viewerId, member.id);
      
      let healthScore: number | null = null;
      if (access.canView && member.healthScore !== undefined) {
        if (access.level === 'full' || access.level === 'summary') {
          healthScore = member.healthScore;
          totalScore += healthScore;
          scoreCount++;
        }
      }

      summaries.push({
        memberId: member.id,
        name: member.name,
        avatar: member.avatar,
        healthScore,
        trend: healthScore ? (healthScore > 70 ? 'up' : healthScore > 50 ? 'stable' : 'down') : 'unknown',
        lastActive: member.lastMeasurement ?? '알 수 없음',
        needsAttention: healthScore !== null && healthScore < 60
      });

      // 주의가 필요한 경우 알림 생성
      if (healthScore !== null && healthScore < 60) {
        alerts.push({
          id: `alert-${member.id}`,
          memberId: member.id,
          memberName: member.name,
          type: healthScore < 40 ? 'critical' : 'warning',
          message: `${member.name}님의 건강 점수가 ${healthScore}점입니다. 확인이 필요합니다.`,
          timestamp: new Date().toISOString()
        });
      }
    }

    return {
      familyHealthScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
      alerts,
      memberSummaries: summaries
    };
  }

  /**
   * 현재 가족 계정 조회
   */
  getCurrentFamily(): FamilyAccount | null {
    return this.currentFamily;
  }
}

// Singleton
export const familyAccountManager = new FamilyAccountManager();

// ============================================
// REACT HOOK
// ============================================

export function useFamilyAccount() {
  const [family, setFamily] = React.useState<FamilyAccount | null>(
    familyAccountManager.getCurrentFamily()
  );

  const createFamily = React.useCallback((
    name: string, 
    owner: Omit<FamilyMember, 'id' | 'privacyLevel'>
  ) => {
    const created = familyAccountManager.createFamily(name, owner);
    setFamily(created);
    return created;
  }, []);

  const addMember = React.useCallback((
    member: Omit<FamilyMember, 'id' | 'privacyLevel'>
  ) => {
    const added = familyAccountManager.addMember(member);
    setFamily(familyAccountManager.getCurrentFamily());
    return added;
  }, []);

  const updatePrivacy = React.useCallback((
    memberId: string, 
    settings: Partial<PrivacySettings>
  ) => {
    const success = familyAccountManager.updatePrivacy(memberId, settings);
    setFamily(familyAccountManager.getCurrentFamily());
    return success;
  }, []);

  const getDashboard = React.useCallback((viewerId: string) => {
    return familyAccountManager.getFamilyDashboard(viewerId);
  }, []);

  return {
    family,
    createFamily,
    addMember,
    updatePrivacy,
    getDashboard,
    canViewMemberData: familyAccountManager.canViewMemberData.bind(familyAccountManager)
  };
}

// React import at the end to avoid circular deps
import * as React from "react";






