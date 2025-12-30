"use client";

import * as React from "react";
import { ArrowLeft, Settings as SettingsIcon, Volume2, Users, Lock, Sparkles, Baby, Accessibility, Watch, Phone, Code2, ChevronRight, Pencil, RotateCcw, Check, Quote } from "lucide-react";
import { useSettings, DEFAULT_SUBTITLE } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

/**
 * 설정 페이지
 * 41-Persona Simulation에서 도출된 접근성 옵션 포함
 */
export default function SettingsPage() {
  const { settings, setSetting } = useSettings();
  const [hasMounted, setHasMounted] = React.useState(false);

  // Hydration fix: 클라이언트에서만 실제 값 표시
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  // 서브타이틀 편집 상태
  const [isEditingSubtitle, setIsEditingSubtitle] = React.useState(false);
  const [subtitleDraft, setSubtitleDraft] = React.useState("");

  // 서버/클라이언트 일관성을 위한 안전한 값
  const safeSettings = hasMounted ? settings : {
    darkMode: false,
    seniorMode: false,
    kidsMode: false,
    voiceEnabled: false,
    familyAccount: false,
    privacyZone: false,
    fontScale: 1.0,
    customSubtitle: DEFAULT_SUBTITLE,
  };

  // 서브타이틀 편집 시작
  const startEditingSubtitle = () => {
    setSubtitleDraft(settings.customSubtitle || DEFAULT_SUBTITLE);
    setIsEditingSubtitle(true);
  };

  // 서브타이틀 저장
  const saveSubtitle = () => {
    setSetting("customSubtitle", subtitleDraft.trim() || DEFAULT_SUBTITLE);
    setIsEditingSubtitle(false);
  };

  // 서브타이틀 기본값으로 초기화
  const resetSubtitle = () => {
    setSetting("customSubtitle", DEFAULT_SUBTITLE);
    setSubtitleDraft(DEFAULT_SUBTITLE);
    setIsEditingSubtitle(false);
  };

  const SettingRow = ({ 
    label, 
    description, 
    value, 
    onToggle,
    icon: Icon,
    badge
  }: {
    label: string;
    description?: string;
    value: boolean;
    onToggle: () => void;
    icon?: React.ElementType;
    badge?: string;
  }) => (
    <motion.div 
      className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
      whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
        <div>
          <div className="text-sm font-medium flex items-center gap-2">
            {label}
            {badge && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                {badge}
              </Badge>
            )}
          </div>
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
        </div>
      </div>
      <Button 
        size="sm" 
        variant={value ? "default" : "outline"} 
        onClick={onToggle}
        className="min-w-[60px]"
      >
        {value ? "ON" : "OFF"}
      </Button>
    </motion.div>
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => history.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-sky-700" />
            <div>
              <div className="text-lg font-semibold">설정</div>
              <div className="text-xs text-muted-foreground">접근성, 개인화, 가족 계정</div>
            </div>
          </div>
        </div>

        {/* 개인화 설정 - 나만의 서브타이틀 */}
        <Card className="border shadow-md overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-dancheong-blue/5 to-dancheong-red/5">
            <CardTitle className="text-sm flex items-center gap-2">
              <Quote className="w-4 h-4 text-dancheong-blue" />
              나만의 철학 (My Philosophy)
            </CardTitle>
            <CardDescription className="text-xs">
              만파식과 함께하는 나만의 건강 여정을 표현해보세요
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {/* 현재 서브타이틀 표시 */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-sky-50 border border-slate-200/50">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  현재 서브타이틀
                </div>
                {isEditingSubtitle ? (
                  <div className="space-y-3">
                    <Input
                      value={subtitleDraft}
                      onChange={(e) => setSubtitleDraft(e.target.value)}
                      placeholder="나만의 문장을 입력하세요"
                      className="text-sm font-medium"
                      maxLength={50}
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {subtitleDraft.length}/50자
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setIsEditingSubtitle(false)}
                        >
                          취소
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={saveSubtitle}
                          className="gap-1"
                        >
                          <Check className="w-3 h-3" />
                          저장
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink leading-relaxed">
                      &quot;{safeSettings.customSubtitle}&quot;
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={startEditingSubtitle}
                      className="shrink-0 gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      수정
                    </Button>
                  </div>
                )}
              </div>

              {/* 기본값으로 초기화 버튼 */}
              {safeSettings.customSubtitle !== DEFAULT_SUBTITLE && !isEditingSubtitle && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetSubtitle}
                  className="w-full text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  기본값으로 초기화
                </Button>
              )}

              {/* 기본값 안내 */}
              <div className="text-[10px] text-muted-foreground text-center">
                기본값: &quot;{DEFAULT_SUBTITLE}&quot;
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 접근성 설정 */}
        <Card className="border shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Accessibility className="w-4 h-4" />
              접근성 (Accessibility)
            </CardTitle>
            <CardDescription className="text-xs">
              41-Persona Simulation에서 도출된 맞춤형 접근성 옵션
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <SettingRow
              label="시니어 모드"
              description="큰 폰트, 큰 버튼, 음성 안내 활성화"
              value={safeSettings.seniorMode}
              onToggle={() => setSetting("seniorMode", !settings.seniorMode)}
              icon={Accessibility}
              badge="User #35, #36"
            />
            <SettingRow
              label="키즈 모드"
              description="캐릭터 가이드, 게이미피케이션, 쉬운 용어"
              value={safeSettings.kidsMode}
              onToggle={() => setSetting("kidsMode", !settings.kidsMode)}
              icon={Baby}
              badge="User #27"
            />
            <SettingRow
              label="음성 안내"
              description="화면 내용을 음성으로 읽어줍니다"
              value={safeSettings.voiceEnabled}
              onToggle={() => setSetting("voiceEnabled", !settings.voiceEnabled)}
              icon={Volume2}
            />
            <SettingRow
              label="다크 모드"
              description="어두운 화면 테마"
              value={safeSettings.darkMode}
              onToggle={() => setSetting("darkMode", !settings.darkMode)}
            />
            
            {/* 폰트 크기 슬라이더 */}
            <div className="py-3 border-b border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">폰트 크기</div>
                <Badge variant="secondary" className="text-[10px]">
                  {Math.round(safeSettings.fontScale * 100)}%
                </Badge>
              </div>
              <Input
                type="range"
                step="0.05"
                min="0.9"
                max="1.6"
                value={safeSettings.fontScale}
                onChange={(e) => setSetting("fontScale", Number(e.target.value))}
                className="h-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>작게</span>
                <span>크게</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 가족 & 프라이버시 */}
        <Card className="border shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              가족 & 프라이버시
            </CardTitle>
            <CardDescription className="text-xs">
              가족 구성원 관리 및 데이터 공유 설정
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <SettingRow
              label="가족 계정"
              description="가족 구성원의 건강을 한 화면에서 관리"
              value={safeSettings.familyAccount ?? false}
              onToggle={() => setSetting("familyAccount", !settings.familyAccount)}
              icon={Users}
              badge="User #26"
            />
            <SettingRow
              label="프라이버시 존"
              description="특정 데이터를 가족에게 숨김 (만 14세 이상)"
              value={safeSettings.privacyZone ?? false}
              onToggle={() => setSetting("privacyZone", !settings.privacyZone)}
              icon={Lock}
              badge="User #28"
            />
            
            {/* 가족 대시보드 링크 */}
            {safeSettings.familyAccountEnabled && (
              <Button 
                variant="outline" 
                className="w-full mt-3 justify-between"
                onClick={() => window.location.href = '/family'}
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  가족 대시보드 열기
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 추가 설정 메뉴 */}
        <Card className="border shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">추가 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* 응급 연락처 */}
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => window.location.href = '/settings/emergency'}
            >
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-500" />
                응급 연락처 관리
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>

            {/* 웨어러블 연동 */}
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => window.location.href = '/settings/wearables'}
            >
              <span className="flex items-center gap-2">
                <Watch className="w-4 h-4 text-primary" />
                웨어러블 기기 연동
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Developer Portal */}
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => window.location.href = '/developer'}
            >
              <span className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-slate-600" />
                Developer Portal
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* 시니어 모드 활성화 시 추가 안내 */}
        {safeSettings.seniorMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <div>
                <div className="font-semibold text-sm">시니어 모드 활성화됨</div>
                <div className="text-xs text-muted-foreground">
                  음성 명령을 사용해보세요: &quot;측정해줘&quot;, &quot;결과 보여줘&quot;, &quot;도와줘&quot;
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 키즈 모드 활성화 시 추가 안내 */}
        {safeSettings.kidsMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🥭</span>
              <div>
                <div className="font-semibold text-sm text-amber-800">키즈 모드 활성화됨</div>
                <div className="text-xs text-amber-700">
                  망고가 건강 체크를 도와줄 거예요! 미션을 완료하면 별을 받을 수 있어요 ⭐
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 버전 정보 */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          Manpasik 2.0 | 41-Persona Simulation Applied
        </div>
      </div>
    </div>
  );
}
