"use client";

/**
 * ============================================================
 * MANPASIK SIGNUP PAGE
 * 간편 회원가입 (소셜 로그인) + 이메일 가입
 * v0 디자인 적용
 * ============================================================
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Lock, User, Phone, Eye, EyeOff, Check, ChevronRight,
  ArrowLeft, Sparkles, Shield, Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

// 소셜 로그인 제공자
const SOCIAL_PROVIDERS = [
  { 
    id: 'kakao', 
    name: '카카오', 
    color: 'bg-[#FEE500] hover:bg-[#FDD800]', 
    textColor: 'text-[#391B1B]',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 3c5.8 0 10.5 3.66 10.5 8.18 0 4.52-4.7 8.18-10.5 8.18-.98 0-1.93-.1-2.83-.28l-3.48 2.38c-.55.38-1.19-.23-.97-.86l.73-2.51C3.18 16.74 1.5 14.58 1.5 11.18 1.5 6.66 6.2 3 12 3z"/>
      </svg>
    )
  },
  { 
    id: 'naver', 
    name: '네이버', 
    color: 'bg-[#03C75A] hover:bg-[#02B351]', 
    textColor: 'text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
      </svg>
    )
  },
  { 
    id: 'google', 
    name: 'Google', 
    color: 'bg-white hover:bg-gray-50 border border-gray-300', 
    textColor: 'text-gray-700',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    )
  },
  { 
    id: 'apple', 
    name: 'Apple', 
    color: 'bg-black hover:bg-gray-900', 
    textColor: 'text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    )
  },
];

// 회원 혜택
const BENEFITS = [
  { icon: "🎁", title: "신규 가입 혜택", desc: "1,000 MPS 포인트 즉시 지급" },
  { icon: "📊", title: "무료 건강 분석", desc: "AI 기반 건강 리포트 제공" },
  { icon: "🏥", title: "전문가 상담", desc: "첫 상담 50% 할인 쿠폰" },
];

export default function SignupPage() {
  const router = useRouter();
  const { loginWithProvider, register, isLoading } = useAuth();
  
  const [step, setStep] = React.useState<'social' | 'email'>('social');
  const [showPassword, setShowPassword] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
    agreeAll: false,
  });
  const [error, setError] = React.useState<string | null>(null);

  // 전체 동의 핸들러
  const handleAgreeAll = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      agreeAll: checked,
      agreeTerms: checked,
      agreePrivacy: checked,
      agreeMarketing: checked,
    }));
  };

  // 개별 동의 핸들러
  const handleAgreeItem = (key: 'agreeTerms' | 'agreePrivacy' | 'agreeMarketing', checked: boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: checked };
      updated.agreeAll = updated.agreeTerms && updated.agreePrivacy && updated.agreeMarketing;
      return updated;
    });
  };

  // 소셜 로그인 핸들러
  const handleSocialLogin = async (provider: 'google' | 'kakao' | 'naver' | 'apple') => {
    const success = await loginWithProvider(provider);
    if (success) {
      router.push('/');
    } else {
      setError('소셜 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 이메일 가입 핸들러
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검사
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const result = await register({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      phone: formData.phone,
      agreeTerms: formData.agreeTerms,
      agreePrivacy: formData.agreePrivacy,
      agreeMarketing: formData.agreeMarketing,
    });

    if (result.success) {
      router.push('/auth/welcome');
    } else {
      setError(result.error || '회원가입에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-ink/5 via-dancheong-blue/5 to-dancheong-green/5 p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ink/70 to-ink-light/50 flex items-center justify-center text-hanji font-medium">
              M
            </div>
            <span className="text-xl font-medium text-foreground">만파식</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-medium text-foreground mb-4">
              건강한 미래,<br />
              <span className="text-dancheong-red">만파식</span>과 함께 시작하세요
            </h1>
            <p className="text-muted-foreground mb-8">
              AI 기반 바이오 분석 플랫폼으로<br />
              나만의 건강 데이터를 관리하세요.
            </p>
          </motion.div>

          {/* Benefits */}
          <div className="space-y-4">
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="hanji-card rounded-xl p-4 flex items-center gap-4"
              >
                <div className="text-2xl">{benefit.icon}</div>
                <div>
                  <p className="font-medium text-foreground">{benefit.title}</p>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          © 2024 Manpasik. All rights reserved.
        </p>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === 'social' ? (
              <motion.div
                key="social"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Mobile Logo */}
                <div className="lg:hidden flex items-center gap-2 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ink/70 to-ink-light/50 flex items-center justify-center text-hanji font-medium">
                    M
                  </div>
                  <span className="text-xl font-medium text-foreground">만파식</span>
                </div>

                <h2 className="text-2xl font-medium text-foreground mb-2">
                  회원가입
                </h2>
                <p className="text-muted-foreground mb-8">
                  간편하게 가입하고 건강 관리를 시작하세요
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                    {error}
                  </div>
                )}

                {/* 소셜 로그인 버튼 */}
                <div className="space-y-3 mb-6">
                  {SOCIAL_PROVIDERS.map((provider) => (
                    <Button
                      key={provider.id}
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full h-12 rounded-xl font-medium transition-all",
                        provider.color,
                        provider.textColor
                      )}
                      onClick={() => handleSocialLogin(provider.id as 'google' | 'kakao' | 'naver' | 'apple')}
                      disabled={isLoading}
                    >
                      {provider.icon}
                      <span className="ml-2">{provider.name}로 시작하기</span>
                    </Button>
                  ))}
                </div>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-ink/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-background text-muted-foreground">
                      또는 이메일로 가입
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl"
                  onClick={() => setStep('email')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  이메일로 가입하기
                </Button>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  이미 계정이 있으신가요?{" "}
                  <Link href="/auth/signin" className="text-dancheong-blue hover:underline">
                    로그인
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setStep('social')}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  뒤로
                </button>

                <h2 className="text-2xl font-medium text-foreground mb-2">
                  이메일로 가입
                </h2>
                <p className="text-muted-foreground mb-6">
                  정보를 입력하고 가입을 완료하세요
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEmailSignup} className="space-y-4">
                  {/* 이름 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">이름</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="홍길동"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* 이메일 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">이메일</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* 비밀번호 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">비밀번호</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="8자 이상 입력"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10 h-11 rounded-xl"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 비밀번호 확인 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">비밀번호 확인</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="비밀번호 재입력"
                        value={formData.passwordConfirm}
                        onChange={(e) => setFormData(prev => ({ ...prev, passwordConfirm: e.target.value }))}
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* 전화번호 (선택) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      전화번호 <span className="text-muted-foreground">(선택)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="010-0000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="pl-10 h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* 약관 동의 */}
                  <div className="hanji-card rounded-xl p-4 space-y-3 mt-6">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={formData.agreeAll}
                          onCheckedChange={(checked) => handleAgreeAll(checked as boolean)}
                        />
                        <span className="font-medium text-foreground">전체 동의</span>
                      </label>
                    </div>
                    <div className="border-t border-ink/10 pt-3 space-y-2">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.agreeTerms}
                            onCheckedChange={(checked) => handleAgreeItem('agreeTerms', checked as boolean)}
                          />
                          <span className="text-sm text-foreground">[필수] 서비스 이용약관</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.agreePrivacy}
                            onCheckedChange={(checked) => handleAgreeItem('agreePrivacy', checked as boolean)}
                          />
                          <span className="text-sm text-foreground">[필수] 개인정보 처리방침</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.agreeMarketing}
                            onCheckedChange={(checked) => handleAgreeItem('agreeMarketing', checked as boolean)}
                          />
                          <span className="text-sm text-foreground">[선택] 마케팅 정보 수신</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl ink-btn mt-6"
                    disabled={isLoading || !formData.agreeTerms || !formData.agreePrivacy}
                  >
                    {isLoading ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        가입 완료
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
