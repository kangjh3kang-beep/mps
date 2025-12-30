"use client";

/**
 * ============================================================
 * MANPASIK GLOBAL CONNECT - VIDEO CALL OVERLAY
 * Translation Controls & Subtitles during Video Call
 * ============================================================
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Languages, 
  Settings, 
  Subtitles, 
  Mic2, 
  Volume2,
  VolumeX,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  MessageSquare,
  MoreVertical,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LiveTranslationSettings } from "./LiveTranslationSettings";
import { useRealTimeTranslation } from "@/lib/global-connect/use-realtime-translation";
import type { 
  SupportedLanguage, 
  TranslationMode,
  GlobalExpert 
} from "@/lib/global-connect/translation-types";

interface VideoCallOverlayProps {
  expert: GlobalExpert;
  userLanguage: SupportedLanguage;
  onEndCall: () => void;
  className?: string;
}

export function VideoCallOverlay({
  expert,
  userLanguage,
  onEndCall,
  className,
}: VideoCallOverlayProps) {
  const [isVideoOn, setIsVideoOn] = React.useState(true);
  const [isMicOn, setIsMicOn] = React.useState(true);
  const [showChat, setShowChat] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [translationMode, setTranslationMode] = React.useState<TranslationMode>('subtitles');
  const [originalVolume, setOriginalVolume] = React.useState(0.1);

  const {
    isConnected,
    isTranslating,
    currentTranscript,
    currentTranslation,
    pipelineStatus,
    setMode,
    setOriginalVolume: setVoiceVolume,
  } = useRealTimeTranslation({
    userLanguage,
    remoteLanguage: expert.nativeLanguage,
    mode: translationMode,
    originalAudioVolume: originalVolume,
  });

  const handleModeChange = (mode: TranslationMode) => {
    setTranslationMode(mode);
    setMode(mode);
  };

  const handleVolumeChange = (volume: number) => {
    setOriginalVolume(volume);
    setVoiceVolume(volume);
  };

  const getLanguageFlag = (code: SupportedLanguage) => {
    const flags: Record<string, string> = {
      'ko-KR': '🇰🇷',
      'en-US': '🇺🇸',
      'en-GB': '🇬🇧',
      'ja-JP': '🇯🇵',
      'zh-CN': '🇨🇳',
    };
    return flags[code] || '🌐';
  };

  return (
    <div className={cn("relative w-full h-full bg-slate-900", className)}>
      {/* Main Video Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Expert Video Placeholder */}
        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-5xl font-bold mb-4">
              {expert.name[0]}
            </div>
            <h2 className="text-white text-xl font-medium">{expert.name}</h2>
            <p className="text-slate-400 text-sm">{expert.title}</p>
            <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/50">
              <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
              연결됨
            </Badge>
          </div>
        </div>

        {/* Self Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-slate-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl">
          <div className="w-full h-full flex items-center justify-center">
            {isVideoOn ? (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <Video className="w-8 h-8 text-slate-500" />
              </div>
            ) : (
              <div className="text-center">
                <VideoOff className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-500 mt-1">카메라 꺼짐</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Translation Status Bar */}
      <div className="absolute top-4 left-4 right-56">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 backdrop-blur-md rounded-xl p-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Languages className="w-5 h-5 text-primary" />
            <div className="flex items-center gap-2">
              <span className="text-lg">{getLanguageFlag(expert.nativeLanguage)}</span>
              <motion.span
                className="text-primary"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                →
              </motion.span>
              <span className="text-lg">{getLanguageFlag(userLanguage)}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {translationMode === 'subtitles' && '자막 모드'}
              {translationMode === 'dubbing' && 'AI 더빙'}
              {translationMode === 'off' && '번역 꺼짐'}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {isTranslating && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                번역 중
              </Badge>
            )}
            <span className="text-xs text-slate-400">
              지연: {pipelineStatus.latencyMs}ms
            </span>
          </div>
        </motion.div>
      </div>

      {/* Subtitles Area */}
      {translationMode === 'subtitles' && (currentTranscript || currentTranslation) && (
        <div className="absolute bottom-32 left-8 right-8">
          <AnimatePresence mode="wait">
            {/* Original Speech */}
            {currentTranscript && (
              <motion.div
                key="transcript"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center mb-2"
              >
                <span className="inline-block bg-black/30 backdrop-blur-sm text-white/70 text-sm px-4 py-2 rounded-lg">
                  {getLanguageFlag(expert.nativeLanguage)} {currentTranscript}
                </span>
              </motion.div>
            )}

            {/* Translated Text */}
            {currentTranslation && (
              <motion.div
                key="translation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <span className="inline-block bg-primary/90 backdrop-blur-sm text-white text-lg px-6 py-3 rounded-lg shadow-lg">
                  {getLanguageFlag(userLanguage)} {currentTranslation}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center justify-center gap-4">
          {/* Mic Toggle */}
          <Button
            variant={isMicOn ? "secondary" : "destructive"}
            size="lg"
            className="w-14 h-14 rounded-full"
            onClick={() => setIsMicOn(!isMicOn)}
          >
            {isMicOn ? <Mic2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </Button>

          {/* Video Toggle */}
          <Button
            variant={isVideoOn ? "secondary" : "destructive"}
            size="lg"
            className="w-14 h-14 rounded-full"
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          {/* Translation Mode */}
          <Button
            variant="secondary"
            size="lg"
            className="w-14 h-14 rounded-full"
            onClick={() => {
              const modes: TranslationMode[] = ['subtitles', 'dubbing', 'off'];
              const currentIndex = modes.indexOf(translationMode);
              handleModeChange(modes[(currentIndex + 1) % modes.length]);
            }}
          >
            {translationMode === 'subtitles' && <Subtitles className="w-6 h-6" />}
            {translationMode === 'dubbing' && <Volume2 className="w-6 h-6" />}
            {translationMode === 'off' && <VolumeX className="w-6 h-6" />}
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            className="w-16 h-16 rounded-full"
            onClick={onEndCall}
          >
            <PhoneOff className="w-7 h-7" />
          </Button>

          {/* Chat Toggle */}
          <Button
            variant="secondary"
            size="lg"
            className="w-14 h-14 rounded-full"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="w-6 h-6" />
          </Button>

          {/* Settings */}
          <LiveTranslationSettings
            userLanguage={userLanguage}
            remoteLanguage={expert.nativeLanguage}
            mode={translationMode}
            originalVolume={originalVolume}
            onUserLanguageChange={() => {}}
            onRemoteLanguageChange={() => {}}
            onModeChange={handleModeChange}
            onVolumeChange={handleVolumeChange}
            isOpen={showSettings}
            onOpenChange={setShowSettings}
            trigger={
              <Button
                variant="secondary"
                size="lg"
                className="w-14 h-14 rounded-full"
              >
                <Settings className="w-6 h-6" />
              </Button>
            }
          />

          {/* Fullscreen */}
          <Button
            variant="secondary"
            size="lg"
            className="w-14 h-14 rounded-full"
          >
            <Maximize2 className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Expert Info Badge */}
      <div className="absolute bottom-24 left-6">
        <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-xl px-4 py-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
            {expert.name[0]}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{expert.name}</p>
            <p className="text-slate-400 text-xs">{expert.specialties.join(', ')}</p>
          </div>
          {expert.hasAITranslation && (
            <Badge className="bg-primary/20 text-primary border-primary/50 text-xs">
              <Languages className="w-3 h-3 mr-1" />
              AI 번역
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}






