"use client";

/**
 * ============================================================
 * MANPASIK MATE - FLOATING BUTTON
 * "Explain This Screen" Always-Visible Companion
 * ============================================================
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, X, Volume2, VolumeX, Mic, MicOff, Sparkles, 
  Settings, StopCircle, MessageSquare, MessageSquareOff,
  Pause, Play
} from "lucide-react";
import { ManpasikAvatar, AvatarExpression } from "./ManpasikAvatar";
import { useVoiceManager, EmotionalTone } from "@/lib/mate/voice-manager";
import { ScreenInterpreter, ScreenContext } from "@/lib/mate/screen-interpreter";
import { MemoryVectorDB } from "@/lib/mate/memory-vector-db";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingMateButtonProps {
  screenContext?: ScreenContext;
  healthScore?: number;
  className?: string;
}

export function FloatingMateButton({
  screenContext,
  healthScore = 75,
  className,
}: FloatingMateButtonProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [expression, setExpression] = React.useState<AvatarExpression>('neutral');
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [progress, setProgress] = React.useState(100);
  const [showSettings, setShowSettings] = React.useState(false);
  const dismissTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const AUTO_DISMISS_DURATION = 8000; // 8초 후 자동 사라짐

  // ===== 음성/문자 안내 설정 상태 =====
  const [voiceEnabled, setVoiceEnabled] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mate_voice_enabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  
  const [textEnabled, setTextEnabled] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mate_text_enabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  
  const { 
    speak: speakOriginal, 
    stopSpeaking, 
    startListening, 
    stopListening,
    isSpeaking, 
    isListening,
    transcript 
  } = useVoiceManager();

  // 음성 안내가 활성화된 경우에만 speak
  const speak = React.useCallback(async (text: string, emotion: EmotionalTone = 'neutral') => {
    if (voiceEnabled) {
      await speakOriginal(text, emotion);
    }
  }, [voiceEnabled, speakOriginal]);

  // 설정 변경 시 localStorage에 저장
  React.useEffect(() => {
    localStorage.setItem('mate_voice_enabled', String(voiceEnabled));
  }, [voiceEnabled]);

  React.useEffect(() => {
    localStorage.setItem('mate_text_enabled', String(textEnabled));
  }, [textEnabled]);

  // 문자 안내가 비활성화되면 메시지 숨기기
  React.useEffect(() => {
    if (!textEnabled && message) {
      setMessage(null);
    }
  }, [textEnabled, message]);

  // 모든 안내 정지 함수
  const handleStopAllAnnouncements = () => {
    stopSpeaking();
    setMessage(null);
    setProgress(100);
    if (dismissTimerRef.current) {
      clearInterval(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setExpression('neutral');
  };

  // Auto-dismiss message after duration (when not speaking/paused)
  React.useEffect(() => {
    if (message && !isSpeaking && !isPaused && !isExpanded) {
      const startTime = Date.now();
      setProgress(100);
      
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = AUTO_DISMISS_DURATION - elapsed;
        if (remaining <= 0) {
          setMessage(null);
          setProgress(100);
          clearInterval(progressInterval);
        } else {
          setProgress((remaining / AUTO_DISMISS_DURATION) * 100);
        }
      }, 50);
      
      dismissTimerRef.current = progressInterval;
      
      return () => {
        if (dismissTimerRef.current) {
          clearInterval(dismissTimerRef.current);
        }
      };
    }
  }, [message, isSpeaking, isPaused, isExpanded]);

  // Pause timer when speaking
  React.useEffect(() => {
    if (isSpeaking && dismissTimerRef.current) {
      clearInterval(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, [isSpeaking]);

  const handleDismissMessage = () => {
    setMessage(null);
    setProgress(100);
    if (dismissTimerRef.current) {
      clearInterval(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  // Auto-determine expression from health score
  React.useEffect(() => {
    if (healthScore > 90) setExpression('excited');
    else if (healthScore > 75) setExpression('happy');
    else if (healthScore > 60) setExpression('neutral');
    else if (healthScore > 40) setExpression('worried');
    else setExpression('thirsty');
  }, [healthScore]);

  // Morning briefing on first load
  React.useEffect(() => {
    const today = new Date().toDateString();
    const lastBriefing = localStorage.getItem('mate_last_briefing');
    
    if (lastBriefing !== today && screenContext) {
      // Show briefing after a short delay
      const timer = setTimeout(() => {
        handleMorningBriefing();
        localStorage.setItem('mate_last_briefing', today);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [screenContext]);

  // Handle voice command
  React.useEffect(() => {
    if (transcript) {
      // Extract and store memory from conversation
      MemoryVectorDB?.extractAndStore(transcript);
      
      // Generate contextual recall
      const recall = MemoryVectorDB?.generateRecallPhrase(transcript);
      if (recall) {
        setMessage(recall);
        speak(recall, 'calm');
      }
    }
  }, [transcript, speak]);

  const handleMorningBriefing = async () => {
    if (!screenContext) return;
    
    setExpression('happy');
    const briefing = ScreenInterpreter.generateMorningBriefing(screenContext);
    if (textEnabled) {
      setMessage(briefing.text);
    }
    await speak(briefing.text, briefing.emotion);
    setExpression('neutral');
  };

  const handleExplainScreen = async () => {
    if (!screenContext) {
      if (textEnabled) {
        setMessage("이 화면에 대해 설명해드릴게요.");
      }
      await speak("이 화면에 대해 설명해드릴게요.", 'neutral');
      return;
    }

    setExpression('thinking');
    const explanation = ScreenInterpreter.generateScreenExplanation(screenContext);
    if (textEnabled) {
      setMessage(explanation.text);
    }
    
    // Highlight elements if any
    explanation.highlights?.forEach(h => {
      const element = document.querySelector(h.selector);
      if (element) {
        element.classList.add('mate-highlight');
        setTimeout(() => element.classList.remove('mate-highlight'), 5000);
      }
    });

    await speak(explanation.text, explanation.emotion);
    setExpression(explanation.emotion === 'happy' ? 'happy' : 'neutral');
  };

  const handleVoiceCommand = () => {
    if (isListening) {
      stopListening();
    } else {
      setExpression('thinking');
      startListening();
    }
  };

  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
  };

  return (
    <>
      {/* CSS for highlight effect */}
      <style jsx global>{`
        .mate-highlight {
          animation: mate-pulse 2s ease-in-out infinite;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.5);
          border-radius: 8px;
        }
        
        @keyframes mate-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(14, 165, 233, 0.2); }
        }
      `}</style>

      {/* Floating Container */}
      <motion.div
        className={cn(
          "fixed bottom-24 right-4 z-[60]",
          "flex flex-col items-end gap-3",
          className
        )}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Speech Bubble with Auto-Dismiss */}
        <AnimatePresence>
          {(message || isExpanded) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="max-w-xs max-h-[60vh] bg-white/98 dark:bg-slate-800/98 backdrop-blur-xl rounded-2xl rounded-br-sm shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Progress Bar for Auto-Dismiss */}
              {message && !isExpanded && !isSpeaking && (
                <div className="h-1 bg-slate-200 dark:bg-slate-700">
                  <motion.div
                    className="h-full bg-gradient-to-r from-sky-400 to-blue-500"
                    initial={{ width: "100%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.05, ease: "linear" }}
                  />
                </div>
              )}
              
              <div className="p-4 overflow-y-auto flex-1">
                {message && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <p className="flex-1 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        {message}
                      </p>
                      {/* Close Button */}
                      <button
                        onClick={handleDismissMessage}
                        className="shrink-0 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="닫기"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                    
                    {/* 안내 중 정지 버튼 (음성 재생 중이거나 메시지 표시 중) */}
                    {(isSpeaking || message) && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleStopAllAnnouncements}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                        >
                          <StopCircle className="w-3 h-3" />
                          안내 정지
                        </button>
                        
                        {isSpeaking && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            음성 재생 중...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Paused indicator */}
                {isPaused && message && !isExpanded && (
                  <p className="text-[10px] text-center text-muted-foreground mt-2">
                    ⏸️ 마우스를 올려두면 메시지가 유지됩니다
                  </p>
                )}
              
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                  {/* 기능 버튼 */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExplainScreen}
                      className="text-xs"
                      disabled={!voiceEnabled && !textEnabled}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      이 화면 설명
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={isListening ? "destructive" : "outline"}
                      onClick={handleVoiceCommand}
                      className="text-xs"
                      disabled={!voiceEnabled}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3 h-3 mr-1" />
                          듣는 중...
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3 mr-1" />
                          음성 명령
                        </>
                      )}
                    </Button>
                    
                    {/* 모든 안내 정지 버튼 */}
                    {(isSpeaking || message) && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleStopAllAnnouncements}
                        className="text-xs"
                      >
                        <StopCircle className="w-3 h-3 mr-1" />
                        안내 정지
                      </Button>
                    )}
                  </div>

                  {/* 설정 토글 버튼 */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      <Settings className="w-3 h-3" />
                      안내 설정
                    </button>
                    
                    {/* 빠른 토글 버튼들 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          voiceEnabled 
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400" 
                            : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                        )}
                        title={voiceEnabled ? "음성 안내 끄기" : "음성 안내 켜기"}
                      >
                        {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => setTextEnabled(!textEnabled)}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          textEnabled 
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400" 
                            : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                        )}
                        title={textEnabled ? "문자 안내 끄기" : "문자 안내 켜기"}
                      >
                        {textEnabled ? <MessageSquare className="w-4 h-4" /> : <MessageSquareOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 설정 상세 패널 */}
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">안내 방식 설정</p>
                          
                          {/* 음성 안내 토글 */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Volume2 className="w-4 h-4 text-slate-500" />
                              <div>
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">음성 안내</p>
                                <p className="text-[10px] text-slate-500">화면 설명을 음성으로 읽어드려요</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setVoiceEnabled(!voiceEnabled)}
                              className={cn(
                                "relative w-10 h-6 rounded-full transition-colors",
                                voiceEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                              )}
                            >
                              <div
                                className={cn(
                                  "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                                  voiceEnabled ? "right-1" : "left-1"
                                )}
                              />
                            </button>
                          </div>

                          {/* 문자 안내 토글 */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-slate-500" />
                              <div>
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">문자 안내</p>
                                <p className="text-[10px] text-slate-500">화면 설명을 텍스트로 표시해요</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setTextEnabled(!textEnabled)}
                              className={cn(
                                "relative w-10 h-6 rounded-full transition-colors",
                                textEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                              )}
                            >
                              <div
                                className={cn(
                                  "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                                  textEnabled ? "right-1" : "left-1"
                                )}
                              />
                            </button>
                          </div>

                          {/* 경고 메시지 */}
                          {!voiceEnabled && !textEnabled && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                              ⚠️ 모든 안내가 비활성화되어 있습니다. 최소 하나는 활성화하세요.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Transcript display */}
              {isListening && transcript && (
                <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300">
                  {transcript}
                </div>
              )}
              </div>{/* End of p-4 div */}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar Button */}
        <div className="relative">
          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && !isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap"
              >
                <div className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg">
                  안녕! 도움이 필요하면 탭해줘 👋
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Button */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {/* Background glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-lg"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Avatar */}
            <div 
              className="relative bg-white rounded-full p-1 shadow-xl cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ManpasikAvatar
                expression={expression}
                healthScore={healthScore}
                size="md"
                isSpeaking={isSpeaking}
              />
              
              {/* Close/Expand indicator */}
              <motion.div
                className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
                animate={{ rotate: isExpanded ? 45 : 0 }}
              >
                {isExpanded ? (
                  <X className="w-3 h-3 text-white" />
                ) : (
                  <MessageCircle className="w-3 h-3 text-white" />
                )}
              </motion.div>

              {/* Speaking indicator */}
              {isSpeaking && (
                <motion.div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 bg-primary rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        duration: 0.4,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </motion.div>
              )}

              {/* Listening indicator */}
              {isListening && (
                <motion.div
                  className="absolute inset-0 border-2 border-red-500 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}



