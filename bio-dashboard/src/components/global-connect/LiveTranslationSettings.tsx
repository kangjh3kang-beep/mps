"use client";

/**
 * ============================================================
 * MANPASIK GLOBAL CONNECT - LIVE TRANSLATION SETTINGS
 * Language Selection Modal for Video Calls
 * ============================================================
 */

import * as React from "react";
import { motion } from "framer-motion";
import { 
  Globe, 
  Volume2, 
  VolumeX,
  Subtitles,
  Mic2,
  Settings2,
  Check,
  ChevronRight,
  Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  SUPPORTED_LANGUAGES, 
  SupportedLanguage, 
  TranslationMode,
  LanguageInfo
} from "@/lib/global-connect/translation-types";

interface LiveTranslationSettingsProps {
  userLanguage: SupportedLanguage;
  remoteLanguage: SupportedLanguage;
  mode: TranslationMode;
  originalVolume: number;
  onUserLanguageChange: (lang: SupportedLanguage) => void;
  onRemoteLanguageChange: (lang: SupportedLanguage) => void;
  onModeChange: (mode: TranslationMode) => void;
  onVolumeChange: (volume: number) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function LiveTranslationSettings({
  userLanguage,
  remoteLanguage,
  mode,
  originalVolume,
  onUserLanguageChange,
  onRemoteLanguageChange,
  onModeChange,
  onVolumeChange,
  isOpen,
  onOpenChange,
  trigger,
}: LiveTranslationSettingsProps) {
  const [activeSection, setActiveSection] = React.useState<'language' | 'mode' | null>(null);

  const getModeInfo = (m: TranslationMode) => {
    switch (m) {
      case 'subtitles':
        return {
          icon: Subtitles,
          title: '자막 모드',
          description: '원어 음성 + 번역 자막',
        };
      case 'dubbing':
        return {
          icon: Mic2,
          title: '더빙 모드',
          description: 'AI 음성으로 번역 재생',
        };
      case 'off':
        return {
          icon: VolumeX,
          title: '번역 끄기',
          description: '원어 그대로 재생',
        };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Globe className="w-4 h-4 mr-2" />
            번역 설정
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            실시간 번역 설정
          </DialogTitle>
          <DialogDescription>
            화상 통화 중 AI가 실시간으로 번역해드립니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Language Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">언어 설정</Label>
            
            {/* My Language */}
            <div 
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => setActiveSection(activeSection === 'language' ? null : 'language')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                  {SUPPORTED_LANGUAGES.find(l => l.code === userLanguage)?.flag || '🌐'}
                </div>
                <div>
                  <p className="text-sm font-medium">내가 듣는 언어</p>
                  <p className="text-xs text-muted-foreground">
                    {SUPPORTED_LANGUAGES.find(l => l.code === userLanguage)?.nativeName}
                  </p>
                </div>
              </div>
              <ChevronRight className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                activeSection === 'language' && "rotate-90"
              )} />
            </div>

            {/* Language Selector Dropdown */}
            {activeSection === 'language' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onUserLanguageChange(lang.code);
                      setActiveSection(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-left transition-colors",
                      userLanguage === lang.code 
                        ? "bg-primary text-white" 
                        : "hover:bg-slate-100"
                    )}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <div>
                      <p className="text-xs font-medium">{lang.nativeName}</p>
                      <p className="text-[10px] opacity-70">{lang.name}</p>
                    </div>
                    {userLanguage === lang.code && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Translation Direction Indicator */}
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="text-center">
                <div className="text-2xl">
                  {SUPPORTED_LANGUAGES.find(l => l.code === remoteLanguage)?.flag}
                </div>
                <p className="text-[10px] text-muted-foreground">상대방</p>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  →
                </motion.div>
                <Badge variant="secondary" className="text-[9px]">AI 번역</Badge>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  →
                </motion.div>
              </div>
              <div className="text-center">
                <div className="text-2xl">
                  {SUPPORTED_LANGUAGES.find(l => l.code === userLanguage)?.flag}
                </div>
                <p className="text-[10px] text-muted-foreground">나</p>
              </div>
            </div>
          </div>

          {/* Translation Mode */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">번역 모드</Label>
            
            <div className="grid gap-2">
              {(['subtitles', 'dubbing', 'off'] as TranslationMode[]).map((m) => {
                const info = getModeInfo(m);
                const Icon = info.icon;
                const isActive = mode === m;

                return (
                  <button
                    key={m}
                    onClick={() => onModeChange(m)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      isActive 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      isActive ? "bg-primary text-white" : "bg-slate-100"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{info.title}</p>
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                    </div>
                    {isActive && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Original Audio Volume (for Dubbing mode) */}
          {mode === 'dubbing' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <Label className="text-sm font-medium flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                원어 음성 볼륨
              </Label>
              <div className="flex items-center gap-4">
                <VolumeX className="w-4 h-4 text-muted-foreground" />
                <Slider
                  value={[originalVolume * 100]}
                  onValueChange={([v]) => onVolumeChange(v / 100)}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm w-10 text-right">{Math.round(originalVolume * 100)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                AI 더빙 음성과 함께 원어 음성을 낮은 볼륨으로 들을 수 있습니다
              </p>
            </motion.div>
          )}

          {/* Advanced Settings Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">의료 용어 자동 주석</span>
            </div>
            <Switch defaultChecked />
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">
              AI 번역 엔진 준비됨
            </span>
          </div>
          <Badge variant="outline" className="text-[10px]">
            지연: ~0.5초
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}






