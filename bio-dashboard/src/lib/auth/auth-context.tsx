"use client";

/**
 * ============================================================
 * MANPASIK AUTH CONTEXT
 * 인증 및 권한 관리 Context Provider
 * ============================================================
 */

import * as React from "react";
import { 
  User, 
  MemberLevel, 
  Permission, 
  hasPermission, 
  hasMinLevel,
  canAccessProMode,
  getLevelMeta,
  createGuestUser,
  MemberLevelMeta,
} from "./permissions";

// ===== Context 타입 정의 =====
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // 권한 체크
  hasPermission: (permission: Permission) => boolean;
  hasMinLevel: (minLevel: MemberLevel) => boolean;
  canAccessProMode: () => boolean;
  
  // 레벨 정보
  getLevelMeta: () => MemberLevelMeta | null;
  
  // 인증 액션
  login: (email: string, password: string) => Promise<boolean>;
  loginWithProvider: (provider: 'google' | 'kakao' | 'naver' | 'apple') => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  
  // 사용자 업데이트 (테스트용)
  setUserLevel: (level: MemberLevel) => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing?: boolean;
}

// ===== Context 생성 =====
const AuthContext = React.createContext<AuthContextType | null>(null);

// ===== Provider 컴포넌트 =====
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // 초기화: localStorage에서 사용자 정보 복원
  React.useEffect(() => {
    const storedUser = localStorage.getItem('manpasik_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
          lastLoginAt: parsed.lastLoginAt ? new Date(parsed.lastLoginAt) : undefined,
        });
      } catch {
        localStorage.removeItem('manpasik_user');
      }
    }
    setIsLoading(false);
  }, []);

  // 사용자 정보 저장
  const saveUser = React.useCallback((u: User) => {
    localStorage.setItem('manpasik_user', JSON.stringify(u));
    setUser(u);
  }, []);

  // 로그인
  const login = React.useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 실제 구현 시 API 호출
      // const response = await fetch('/api/auth/login', { ... });
      
      // 데모용: 이메일로 레벨 결정
      let level = MemberLevel.MEMBER;
      if (email.includes('expert')) level = MemberLevel.EXPERT;
      if (email.includes('researcher')) level = MemberLevel.RESEARCHER;
      if (email.includes('admin')) level = MemberLevel.SUPER_ADMIN;
      
      const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0],
        level,
        verificationStatus: level >= MemberLevel.EXPERT ? 'verified' : 'pending',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      
      saveUser(newUser);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [saveUser]);

  // 소셜 로그인
  const loginWithProvider = React.useCallback(async (
    provider: 'google' | 'kakao' | 'naver' | 'apple'
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 실제 구현 시 OAuth 흐름
      // window.location.href = `/api/auth/${provider}`;
      
      // 데모용: 간편 로그인 시뮬레이션
      const newUser: User = {
        id: `${provider}-${Date.now()}`,
        email: `user@${provider}.com`,
        name: `${provider} 사용자`,
        level: MemberLevel.ASSOCIATE, // 간편 가입 시 준회원으로 시작
        verificationStatus: 'pending',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        metadata: { provider },
      };
      
      saveUser(newUser);
      return true;
    } catch (error) {
      console.error('Social login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [saveUser]);

  // 로그아웃
  const logout = React.useCallback(() => {
    localStorage.removeItem('manpasik_user');
    setUser(null);
  }, []);

  // 회원가입
  const register = React.useCallback(async (
    data: RegisterData
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      // 유효성 검사
      if (!data.email || !data.password || !data.name) {
        return { success: false, error: '필수 정보를 모두 입력해주세요.' };
      }
      
      if (!data.agreeTerms || !data.agreePrivacy) {
        return { success: false, error: '필수 약관에 동의해주세요.' };
      }
      
      if (data.password.length < 8) {
        return { success: false, error: '비밀번호는 8자 이상이어야 합니다.' };
      }
      
      // 실제 구현 시 API 호출
      // const response = await fetch('/api/auth/signup', { ... });
      
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: data.email,
        name: data.name,
        level: MemberLevel.ASSOCIATE, // 신규 가입 시 준회원
        verificationStatus: 'pending',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      
      saveUser(newUser);
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: '회원가입에 실패했습니다. 다시 시도해주세요.' };
    } finally {
      setIsLoading(false);
    }
  }, [saveUser]);

  // 레벨 변경 (테스트/개발용)
  const setUserLevel = React.useCallback((level: MemberLevel) => {
    if (user) {
      const updatedUser = { 
        ...user, 
        level,
        verificationStatus: level >= MemberLevel.EXPERT ? 'verified' as const : user.verificationStatus,
      };
      saveUser(updatedUser);
    }
  }, [user, saveUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    
    hasPermission: (permission: Permission) => hasPermission(user, permission),
    hasMinLevel: (minLevel: MemberLevel) => hasMinLevel(user, minLevel),
    canAccessProMode: () => canAccessProMode(user),
    
    getLevelMeta: () => user ? getLevelMeta(user.level) : null,
    
    login,
    loginWithProvider,
    logout,
    register,
    setUserLevel,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ===== Hook =====
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ===== 권한 가드 컴포넌트 =====
interface RequireAuthProps {
  children: React.ReactNode;
  minLevel?: MemberLevel;
  permission?: Permission;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RequireAuth({
  children,
  minLevel,
  permission,
  fallback,
  redirectTo,
}: RequireAuthProps) {
  const { user, isLoading, hasPermission: checkPermission, hasMinLevel: checkMinLevel } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // 레벨 체크
  if (minLevel !== undefined && !checkMinLevel(minLevel)) {
    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
      return null;
    }
    return fallback ? <>{fallback}</> : <AccessDenied requiredLevel={minLevel} />;
  }

  // 권한 체크
  if (permission && !checkPermission(permission)) {
    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
      return null;
    }
    return fallback ? <>{fallback}</> : <AccessDenied requiredPermission={permission} />;
  }

  return <>{children}</>;
}

// ===== 접근 거부 컴포넌트 =====
function AccessDenied({ 
  requiredLevel, 
  requiredPermission 
}: { 
  requiredLevel?: MemberLevel; 
  requiredPermission?: Permission;
}) {
  const levelMeta = requiredLevel !== undefined ? getLevelMeta(requiredLevel) : null;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <span className="text-3xl">🔒</span>
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        접근 권한이 없습니다
      </h2>
      {levelMeta && (
        <p className="text-muted-foreground mb-4">
          이 기능은 <span className="font-medium text-{levelMeta.color}-600">{levelMeta.icon} {levelMeta.nameKo}</span> 
          {" "}이상 등급에서 사용할 수 있습니다.
        </p>
      )}
      {requiredPermission && (
        <p className="text-muted-foreground mb-4">
          필요한 권한: <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">{requiredPermission}</code>
        </p>
      )}
      <div className="flex gap-3 mt-4">
        <a 
          href="/auth/signin"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          로그인
        </a>
        <a 
          href="/"
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
        >
          홈으로
        </a>
      </div>
    </div>
  );
}

export { MemberLevel, type Permission, type User };

