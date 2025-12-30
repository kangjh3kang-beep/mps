"use client";

/**
 * ============================================================
 * MANPASIK GLOBAL CONNECT - GLOBAL EXPERT CARD
 * Expert/Doctor Card with AI Translation Badge
 * ============================================================
 */

import * as React from "react";
import { motion } from "framer-motion";
import { 
  Star, 
  Globe, 
  Languages, 
  Clock, 
  Video,
  MessageSquare,
  Calendar,
  Verified,
  TrendingUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GlobalExpert, SupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/global-connect/translation-types";

interface GlobalExpertCardProps {
  expert: GlobalExpert;
  userLanguage: SupportedLanguage;
  onVideoCall?: () => void;
  onChat?: () => void;
  onBook?: () => void;
  className?: string;
}

export function GlobalExpertCard({
  expert,
  userLanguage,
  onVideoCall,
  onChat,
  onBook,
  className,
}: GlobalExpertCardProps) {
  const getLanguageFlag = (code: SupportedLanguage) => {
    const flags: Record<string, string> = {
      'ko-KR': '🇰🇷',
      'en-US': '🇺🇸',
      'en-GB': '🇬🇧',
      'ja-JP': '🇯🇵',
      'zh-CN': '🇨🇳',
      'zh-TW': '🇹🇼',
      'es-ES': '🇪🇸',
      'fr-FR': '🇫🇷',
      'de-DE': '🇩🇪',
      'pt-BR': '🇧🇷',
      'vi-VN': '🇻🇳',
      'th-TH': '🇹🇭',
      'id-ID': '🇮🇩',
      'ar-SA': '🇸🇦',
      'hi-IN': '🇮🇳',
      'ru-RU': '🇷🇺',
    };
    return flags[code] || '🌐';
  };

  const needsTranslation = expert.nativeLanguage !== userLanguage;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={cn(
        "overflow-hidden border-2 hover:border-primary/50 transition-all",
        expert.isOnline && "ring-2 ring-green-500/30",
        className
      )}>
        <CardContent className="p-0">
          {/* Header with Avatar */}
          <div className="relative p-4 bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Online Status */}
            {expert.isOnline && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-green-500 text-white text-[10px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
                  온라인
                </Badge>
              </div>
            )}

            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {expert.name[0]}
                </div>
                {/* Native Language Flag */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center text-sm">
                  {getLanguageFlag(expert.nativeLanguage)}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{expert.name}</h3>
                  <Verified className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{expert.title}</p>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-medium">{expert.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({expert.reviewCount}개 리뷰)
                  </span>
                </div>
              </div>
            </div>

            {/* Specialties */}
            <div className="flex flex-wrap gap-1 mt-3">
              {expert.specialties.slice(0, 3).map((specialty) => (
                <Badge key={specialty} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {expert.specialties.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{expert.specialties.length - 3}
                </Badge>
              )}
            </div>
          </div>

          {/* Translation Notice */}
          {needsTranslation && expert.hasAITranslation && (
            <div className="px-4 py-2 bg-primary/5 border-t border-b border-primary/10">
              <div className="flex items-center gap-2 text-xs">
                <Languages className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">
                  <span className="font-medium text-primary">{expert.name}</span>님은{' '}
                  {getLanguageFlag(expert.nativeLanguage)}를 사용하지만,
                </span>
              </div>
              <p className="text-xs text-primary font-medium mt-1 ml-6">
                만파식 AI가 {getLanguageFlag(userLanguage)} 실시간 번역을 제공합니다
              </p>
            </div>
          )}

          {/* Supported Languages */}
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Globe className="w-3 h-3" />
              지원 언어
            </div>
            <div className="flex gap-1">
              {expert.supportedLanguages.map((lang) => (
                <span 
                  key={lang} 
                  className={cn(
                    "text-lg",
                    lang === userLanguage && "ring-2 ring-primary rounded"
                  )}
                  title={lang}
                >
                  {getLanguageFlag(lang)}
                </span>
              ))}
              {expert.hasAITranslation && (
                <Badge className="ml-2 bg-gradient-to-r from-primary to-secondary text-white text-[9px]">
                  + AI 번역 지원
                </Badge>
              )}
            </div>
          </div>

          {/* Price & Actions */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">상담료</p>
                <p className="text-lg font-bold">
                  {expert.currency === 'KRW' 
                    ? `₩${expert.hourlyRate.toLocaleString()}`
                    : `$${expert.hourlyRate}`}
                  <span className="text-xs text-muted-foreground font-normal">/시간</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {expert.timezone}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onChat}
                className="flex-col h-auto py-2"
              >
                <MessageSquare className="w-4 h-4 mb-1" />
                <span className="text-xs">채팅</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onVideoCall}
                disabled={!expert.isOnline}
                className="flex-col h-auto py-2 bg-gradient-to-r from-primary to-blue-600"
              >
                <Video className="w-4 h-4 mb-1" />
                <span className="text-xs">화상통화</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onBook}
                className="flex-col h-auto py-2"
              >
                <Calendar className="w-4 h-4 mb-1" />
                <span className="text-xs">예약</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}






