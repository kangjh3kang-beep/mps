"use client";

/**
 * ============================================================
 * MANPASIK GLOBAL CONNECT - TRANSLATED CHAT COMPONENT
 * Auto-Translation Toggle & Dual-Language Display
 * ============================================================
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Languages, 
  Globe, 
  Send, 
  Mic, 
  MicOff,
  Eye,
  EyeOff,
  Info,
  Verified,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { 
  SupportedLanguage, 
  TranslatedMessage, 
  LanguageInfo,
  SUPPORTED_LANGUAGES 
} from "@/lib/global-connect/translation-types";

interface TranslatedChatProps {
  messages: TranslatedMessage[];
  userLanguage: SupportedLanguage;
  remoteLanguage: SupportedLanguage;
  remoteName: string;
  remoteAvatar?: string;
  onSendMessage: (message: string) => void;
  onVoiceInput?: () => void;
  isVoiceActive?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function TranslatedChat({
  messages,
  userLanguage,
  remoteLanguage,
  remoteName,
  remoteAvatar,
  onSendMessage,
  onVoiceInput,
  isVoiceActive = false,
  isLoading = false,
  className,
}: TranslatedChatProps) {
  const [input, setInput] = React.useState("");
  const [autoTranslate, setAutoTranslate] = React.useState(true);
  const [showOriginalFor, setShowOriginalFor] = React.useState<Set<string>>(new Set());
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const toggleOriginal = (messageId: string) => {
    setShowOriginalFor(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const getLanguageInfo = (code: SupportedLanguage): Partial<LanguageInfo> => {
    const languages: Record<string, Partial<LanguageInfo>> = {
      'ko-KR': { flag: '🇰🇷', nativeName: '한국어' },
      'en-US': { flag: '🇺🇸', nativeName: 'English' },
      'en-GB': { flag: '🇬🇧', nativeName: 'English' },
      'ja-JP': { flag: '🇯🇵', nativeName: '日本語' },
      'zh-CN': { flag: '🇨🇳', nativeName: '中文' },
      'es-ES': { flag: '🇪🇸', nativeName: 'Español' },
      'fr-FR': { flag: '🇫🇷', nativeName: 'Français' },
      'de-DE': { flag: '🇩🇪', nativeName: 'Deutsch' },
    };
    return languages[code] || { flag: '🌐', nativeName: code };
  };

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            {remoteName}과의 대화
          </CardTitle>
          
          {/* Auto-Translate Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={autoTranslate ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoTranslate(!autoTranslate)}
              className="text-xs"
            >
              <Languages className="w-3 h-3 mr-1" />
              {autoTranslate ? "번역 ON" : "번역 OFF"}
            </Button>
          </div>
        </div>

        {/* Language Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <span>{getLanguageInfo(userLanguage).flag} 나</span>
          <span>↔</span>
          <span>{getLanguageInfo(remoteLanguage).flag} {remoteName}</span>
          {autoTranslate && (
            <Badge variant="secondary" className="ml-2 text-[10px]">
              AI 실시간 번역
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isFromRemote = msg.senderName === remoteName;
            const showOriginal = showOriginalFor.has(msg.id);
            const displayText = autoTranslate && isFromRemote 
              ? (showOriginal ? msg.originalText : msg.translatedText)
              : msg.originalText;

            return (
              <motion.div
                key={msg.id}
                className={cn(
                  "flex",
                  isFromRemote ? "justify-start" : "justify-end"
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={cn(
                  "max-w-[80%] relative group"
                )}>
                  {/* Sender Avatar & Name */}
                  {isFromRemote && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                        {remoteName[0]}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {remoteName}
                      </span>
                      {autoTranslate && (
                        <Badge variant="outline" className="text-[9px] px-1">
                          {getLanguageInfo(msg.originalLanguage).flag} → {getLanguageInfo(userLanguage).flag}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "p-3 rounded-2xl text-sm",
                      isFromRemote
                        ? "bg-slate-100 text-slate-900 rounded-tl-sm"
                        : "bg-gradient-to-r from-primary to-blue-600 text-white rounded-br-sm"
                    )}
                  >
                    <p>{displayText}</p>

                    {/* Medical Notes */}
                    {msg.medicalNotes && msg.medicalNotes.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/20">
                        {msg.medicalNotes.map((note, i) => (
                          <div key={i} className="flex items-start gap-1 text-xs opacity-80">
                            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Verification Badge */}
                    {msg.isVerified && (
                      <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                        <Verified className="w-3 h-3" />
                        <span>의료 용어 검증됨</span>
                      </div>
                    )}
                  </div>

                  {/* Toggle Original/Translated */}
                  {autoTranslate && isFromRemote && (
                    <button
                      onClick={() => toggleOriginal(msg.id)}
                      className="absolute -bottom-5 left-0 text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {showOriginal ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          번역 보기
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          원문 보기
                        </>
                      )}
                    </button>
                  )}

                  {/* Timestamp */}
                  <div className={cn(
                    "text-[10px] text-muted-foreground mt-1",
                    isFromRemote ? "text-left" : "text-right"
                  )}>
                    {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              className="flex justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                번역 중...
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-slate-50">
          <div className="flex items-center gap-2">
            {/* Voice Input */}
            {onVoiceInput && (
              <Button
                variant={isVoiceActive ? "destructive" : "outline"}
                size="icon"
                onClick={onVoiceInput}
                className="flex-shrink-0"
              >
                {isVoiceActive ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            )}

            {/* Text Input */}
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`${getLanguageInfo(userLanguage).nativeName}로 입력하세요...`}
                className="pr-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              {autoTranslate && (
                <Badge 
                  variant="secondary" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px]"
                >
                  {getLanguageInfo(remoteLanguage).flag} 자동 번역
                </Badge>
              )}
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Translation Note */}
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            {autoTranslate 
              ? `메시지가 자동으로 ${getLanguageInfo(remoteLanguage).nativeName}로 번역됩니다`
              : "번역 기능이 꺼져 있습니다"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}






