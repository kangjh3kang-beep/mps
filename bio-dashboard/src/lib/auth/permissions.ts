/**
 * ============================================================
 * MANPASIK PERMISSION SYSTEM
 * 확장 가능한 회원 레벨 및 권한 관리 시스템
 * ============================================================
 * 
 * 회원 레벨 구조 (확장성 고려):
 * Level 0: GUEST (비회원/일반인)
 * Level 1: ASSOCIATE (준회원)
 * Level 2: MEMBER (정회원)
 * Level 3: EXPERT (검증된 전문가)
 * Level 4: RESEARCHER (연구자)
 * Level 5: REGIONAL_ADMIN (지역 관리자)
 * Level 6: NATIONAL_ADMIN (국가 관리자)
 * Level 7: SUPER_ADMIN (총괄 관리자)
 * 
 * 향후 확장:
 * Level 8+: PARTNER, ENTERPRISE, GOVERNMENT 등
 */

// ===== 회원 레벨 정의 =====
export enum MemberLevel {
  GUEST = 0,           // 비회원/일반인 - 기본 열람만 가능
  ASSOCIATE = 1,       // 준회원 - 제한적 기능 사용
  MEMBER = 2,          // 정회원 - 전체 기본 기능
  EXPERT = 3,          // 검증된 전문가 - 프로모드 접근
  RESEARCHER = 4,      // 연구자 - 연구 데이터 접근
  REGIONAL_ADMIN = 5,  // 지역 관리자
  NATIONAL_ADMIN = 6,  // 국가 관리자
  SUPER_ADMIN = 7,     // 총괄 관리자
  
  // 향후 확장을 위한 예약 레벨
  PARTNER = 10,        // 파트너사
  ENTERPRISE = 11,     // 기업 고객
  GOVERNMENT = 12,     // 정부 기관
}

// ===== 전문가 유형 정의 =====
export enum ExpertType {
  NONE = 'none',
  DOCTOR = 'doctor',           // 의사
  NURSE = 'nurse',             // 간호사
  PHARMACIST = 'pharmacist',   // 약사
  NUTRITIONIST = 'nutritionist', // 영양사
  TRAINER = 'trainer',         // 트레이너
  THERAPIST = 'therapist',     // 치료사
  RESEARCHER = 'researcher',   // 연구원
  PROFESSOR = 'professor',     // 교수
  OTHER = 'other',
}

// ===== 회원 레벨 메타데이터 =====
export interface MemberLevelMeta {
  level: MemberLevel;
  name: string;
  nameKo: string;
  description: string;
  color: string;
  icon: string;
  badge: string;
  requiredVerification: boolean;
  maxDataRetentionDays: number;
  apiRateLimit: number;
  features: string[];
}

export const MEMBER_LEVEL_META: Record<MemberLevel, MemberLevelMeta> = {
  [MemberLevel.GUEST]: {
    level: MemberLevel.GUEST,
    name: 'Guest',
    nameKo: '비회원',
    description: '기본 열람 및 체험 가능',
    color: 'slate',
    icon: '👤',
    badge: '',
    requiredVerification: false,
    maxDataRetentionDays: 7,
    apiRateLimit: 10,
    features: ['basic_view', 'demo_measurement'],
  },
  [MemberLevel.ASSOCIATE]: {
    level: MemberLevel.ASSOCIATE,
    name: 'Associate',
    nameKo: '준회원',
    description: '제한적 기능 사용 가능',
    color: 'blue',
    icon: '🌱',
    badge: '준회원',
    requiredVerification: false,
    maxDataRetentionDays: 30,
    apiRateLimit: 50,
    features: ['basic_view', 'measurement', 'history_7days', 'ai_basic'],
  },
  [MemberLevel.MEMBER]: {
    level: MemberLevel.MEMBER,
    name: 'Member',
    nameKo: '정회원',
    description: '전체 기본 기능 사용 가능',
    color: 'emerald',
    icon: '✨',
    badge: '정회원',
    requiredVerification: true,
    maxDataRetentionDays: 365,
    apiRateLimit: 200,
    features: ['full_view', 'measurement', 'history_full', 'ai_advanced', 'export', 'mall', 'school'],
  },
  [MemberLevel.EXPERT]: {
    level: MemberLevel.EXPERT,
    name: 'Expert',
    nameKo: '전문가',
    description: '검증된 전문가 - 프로모드 접근',
    color: 'purple',
    icon: '🏆',
    badge: '전문가',
    requiredVerification: true,
    maxDataRetentionDays: 730,
    apiRateLimit: 500,
    features: ['pro_mode', 'patient_management', 'advanced_analytics', 'telemedicine', 'prescription'],
  },
  [MemberLevel.RESEARCHER]: {
    level: MemberLevel.RESEARCHER,
    name: 'Researcher',
    nameKo: '연구자',
    description: '연구 데이터 접근 가능',
    color: 'indigo',
    icon: '🔬',
    badge: '연구자',
    requiredVerification: true,
    maxDataRetentionDays: 1825,
    apiRateLimit: 1000,
    features: ['research_data', 'bulk_export', 'api_access', 'anonymized_data', 'research_hub'],
  },
  [MemberLevel.REGIONAL_ADMIN]: {
    level: MemberLevel.REGIONAL_ADMIN,
    name: 'Regional Admin',
    nameKo: '지역 관리자',
    description: '지역 단위 관리 권한',
    color: 'amber',
    icon: '🏛️',
    badge: '지역관리자',
    requiredVerification: true,
    maxDataRetentionDays: 3650,
    apiRateLimit: 2000,
    features: ['regional_dashboard', 'user_management', 'regional_stats', 'regional_settings'],
  },
  [MemberLevel.NATIONAL_ADMIN]: {
    level: MemberLevel.NATIONAL_ADMIN,
    name: 'National Admin',
    nameKo: '국가 관리자',
    description: '국가 단위 관리 권한',
    color: 'rose',
    icon: '🌐',
    badge: '국가관리자',
    requiredVerification: true,
    maxDataRetentionDays: 7300,
    apiRateLimit: 5000,
    features: ['national_dashboard', 'policy_management', 'national_stats', 'compliance'],
  },
  [MemberLevel.SUPER_ADMIN]: {
    level: MemberLevel.SUPER_ADMIN,
    name: 'Super Admin',
    nameKo: '총괄 관리자',
    description: '전체 시스템 관리 권한',
    color: 'red',
    icon: '👑',
    badge: '총괄관리자',
    requiredVerification: true,
    maxDataRetentionDays: -1, // 무제한
    apiRateLimit: -1, // 무제한
    features: ['all', 'system_config', 'audit_logs', 'security', 'infrastructure'],
  },
  [MemberLevel.PARTNER]: {
    level: MemberLevel.PARTNER,
    name: 'Partner',
    nameKo: '파트너',
    description: '파트너사 전용 기능',
    color: 'cyan',
    icon: '🤝',
    badge: '파트너',
    requiredVerification: true,
    maxDataRetentionDays: 3650,
    apiRateLimit: 10000,
    features: ['partner_api', 'white_label', 'custom_integration'],
  },
  [MemberLevel.ENTERPRISE]: {
    level: MemberLevel.ENTERPRISE,
    name: 'Enterprise',
    nameKo: '기업',
    description: '기업 고객 전용',
    color: 'sky',
    icon: '🏢',
    badge: '기업',
    requiredVerification: true,
    maxDataRetentionDays: 3650,
    apiRateLimit: 20000,
    features: ['enterprise_dashboard', 'team_management', 'sso', 'dedicated_support'],
  },
  [MemberLevel.GOVERNMENT]: {
    level: MemberLevel.GOVERNMENT,
    name: 'Government',
    nameKo: '정부기관',
    description: '정부 기관 전용',
    color: 'violet',
    icon: '🏛️',
    badge: '정부기관',
    requiredVerification: true,
    maxDataRetentionDays: 7300,
    apiRateLimit: 50000,
    features: ['government_dashboard', 'public_health_data', 'policy_integration'],
  },
};

// ===== 권한(Permission) 정의 =====
export type Permission = 
  // 기본 권한
  | 'view_dashboard'
  | 'view_results'
  | 'perform_measurement'
  | 'view_history'
  | 'export_data'
  
  // AI 관련
  | 'ai_basic'
  | 'ai_advanced'
  | 'ai_pro'
  
  // 프로모드 권한
  | 'pro_mode_access'
  | 'pro_mode_desktop'
  | 'pro_mode_reader'
  | 'raw_data_access'
  | 'calibration_access'
  
  // 쇼핑/서비스
  | 'mall_access'
  | 'prescription_view'
  | 'telemedicine'
  
  // 커뮤니티
  | 'school_access'
  | 'agora_vote'
  | 'agora_submit'
  
  // 연구
  | 'research_hub_access'
  | 'anonymized_data_access'
  | 'bulk_export'
  | 'api_access'
  
  // 관리
  | 'user_management'
  | 'regional_management'
  | 'national_management'
  | 'system_config'
  | 'audit_logs'
  | 'security_settings';

// ===== 레벨별 권한 매핑 =====
const LEVEL_PERMISSIONS: Record<MemberLevel, Permission[]> = {
  [MemberLevel.GUEST]: [
    'view_dashboard',
  ],
  [MemberLevel.ASSOCIATE]: [
    'view_dashboard',
    'perform_measurement',
    'ai_basic',
  ],
  [MemberLevel.MEMBER]: [
    'view_dashboard',
    'view_results',
    'perform_measurement',
    'view_history',
    'export_data',
    'ai_basic',
    'ai_advanced',
    'mall_access',
    'school_access',
    'agora_vote',
  ],
  [MemberLevel.EXPERT]: [
    'view_dashboard',
    'view_results',
    'perform_measurement',
    'view_history',
    'export_data',
    'ai_basic',
    'ai_advanced',
    'ai_pro',
    'pro_mode_access',
    'pro_mode_desktop',
    'pro_mode_reader',
    'raw_data_access',
    'calibration_access',
    'mall_access',
    'prescription_view',
    'telemedicine',
    'school_access',
    'agora_vote',
    'agora_submit',
  ],
  [MemberLevel.RESEARCHER]: [
    'view_dashboard',
    'view_results',
    'perform_measurement',
    'view_history',
    'export_data',
    'ai_basic',
    'ai_advanced',
    'ai_pro',
    'pro_mode_access',
    'pro_mode_desktop',
    'raw_data_access',
    'mall_access',
    'school_access',
    'agora_vote',
    'agora_submit',
    'research_hub_access',
    'anonymized_data_access',
    'bulk_export',
    'api_access',
  ],
  [MemberLevel.REGIONAL_ADMIN]: [
    'view_dashboard',
    'view_results',
    'perform_measurement',
    'view_history',
    'export_data',
    'ai_basic',
    'ai_advanced',
    'ai_pro',
    'pro_mode_access',
    'pro_mode_desktop',
    'pro_mode_reader',
    'raw_data_access',
    'calibration_access',
    'mall_access',
    'school_access',
    'agora_vote',
    'agora_submit',
    'user_management',
    'regional_management',
  ],
  [MemberLevel.NATIONAL_ADMIN]: [
    'view_dashboard',
    'view_results',
    'perform_measurement',
    'view_history',
    'export_data',
    'ai_basic',
    'ai_advanced',
    'ai_pro',
    'pro_mode_access',
    'pro_mode_desktop',
    'pro_mode_reader',
    'raw_data_access',
    'calibration_access',
    'mall_access',
    'school_access',
    'agora_vote',
    'agora_submit',
    'research_hub_access',
    'anonymized_data_access',
    'user_management',
    'regional_management',
    'national_management',
    'audit_logs',
  ],
  [MemberLevel.SUPER_ADMIN]: [
    'view_dashboard',
    'view_results',
    'perform_measurement',
    'view_history',
    'export_data',
    'ai_basic',
    'ai_advanced',
    'ai_pro',
    'pro_mode_access',
    'pro_mode_desktop',
    'pro_mode_reader',
    'raw_data_access',
    'calibration_access',
    'mall_access',
    'prescription_view',
    'telemedicine',
    'school_access',
    'agora_vote',
    'agora_submit',
    'research_hub_access',
    'anonymized_data_access',
    'bulk_export',
    'api_access',
    'user_management',
    'regional_management',
    'national_management',
    'system_config',
    'audit_logs',
    'security_settings',
  ],
  [MemberLevel.PARTNER]: [
    'view_dashboard',
    'api_access',
    'bulk_export',
  ],
  [MemberLevel.ENTERPRISE]: [
    'view_dashboard',
    'view_results',
    'perform_measurement',
    'view_history',
    'export_data',
    'ai_basic',
    'ai_advanced',
    'mall_access',
    'user_management',
  ],
  [MemberLevel.GOVERNMENT]: [
    'view_dashboard',
    'view_results',
    'view_history',
    'export_data',
    'ai_basic',
    'ai_advanced',
    'research_hub_access',
    'anonymized_data_access',
    'bulk_export',
    'national_management',
    'audit_logs',
  ],
};

// ===== 사용자 타입 정의 =====
export interface User {
  id: string;
  email: string;
  name: string;
  level: MemberLevel;
  expertType?: ExpertType;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDocuments?: string[];
  region?: string;
  country?: string;
  organization?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  metadata?: Record<string, unknown>;
}

// ===== 권한 체크 함수 =====
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  
  const levelPermissions = LEVEL_PERMISSIONS[user.level] || [];
  return levelPermissions.includes(permission);
}

export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(user, p));
}

export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(user, p));
}

// ===== 레벨 체크 함수 =====
export function hasMinLevel(user: User | null, minLevel: MemberLevel): boolean {
  if (!user) return false;
  return user.level >= minLevel;
}

export function isExpert(user: User | null): boolean {
  return hasMinLevel(user, MemberLevel.EXPERT);
}

export function isAdmin(user: User | null): boolean {
  return hasMinLevel(user, MemberLevel.REGIONAL_ADMIN);
}

export function isSuperAdmin(user: User | null): boolean {
  return user?.level === MemberLevel.SUPER_ADMIN;
}

// ===== 레벨 메타 정보 조회 =====
export function getLevelMeta(level: MemberLevel): MemberLevelMeta {
  return MEMBER_LEVEL_META[level];
}

export function getLevelName(level: MemberLevel, lang: 'ko' | 'en' = 'ko'): string {
  const meta = MEMBER_LEVEL_META[level];
  return lang === 'ko' ? meta.nameKo : meta.name;
}

export function getLevelBadge(level: MemberLevel): string {
  return MEMBER_LEVEL_META[level].badge;
}

export function getLevelColor(level: MemberLevel): string {
  return MEMBER_LEVEL_META[level].color;
}

// ===== 프로모드 접근 가능 여부 =====
export function canAccessProMode(user: User | null): boolean {
  if (!user) return false;
  
  // 전문가 이상 + 검증 완료 필요
  if (user.level >= MemberLevel.EXPERT && user.verificationStatus === 'verified') {
    return true;
  }
  
  // 관리자는 검증 없이도 접근 가능
  if (user.level >= MemberLevel.REGIONAL_ADMIN) {
    return true;
  }
  
  return false;
}

// ===== 기본 사용자 생성 (테스트용) =====
export function createGuestUser(): User {
  return {
    id: 'guest',
    email: '',
    name: '게스트',
    level: MemberLevel.GUEST,
    verificationStatus: 'pending',
    createdAt: new Date(),
  };
}

export function createTestUser(level: MemberLevel = MemberLevel.MEMBER): User {
  return {
    id: `test-${Date.now()}`,
    email: 'test@manpasik.com',
    name: '테스트 사용자',
    level,
    verificationStatus: level >= MemberLevel.EXPERT ? 'verified' : 'pending',
    expertType: level === MemberLevel.EXPERT ? ExpertType.DOCTOR : ExpertType.NONE,
    createdAt: new Date(),
  };
}

