"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  Loader2,
  Mic,
  MicOff,
  Send,
  ThumbsDown,
  ThumbsUp,
  User,
  Volume2,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type HealthContext, type Product, getCartManager } from "@/lib/mall";
import { ChatRecommendation } from "@/components/mall/RecommendationWidget";
import type { HealthGoal } from "@/lib/profile";
import { simplifySeniorResponse, generateVoiceResponse } from "@/lib/action-agent";
import {
  type PersonaId,
  type MultiPersonaContext,
  PERSONAS,
  generatePersonaResponse,
  getPrimaryPersona
} from "@/lib/persona-manager";
import { CouncilChamber, PersonaIndicator } from "@/components/dashboard/CouncilChamber";

/**
 * 메시지 역할:
 * - user: 사용자 입력
 * - assistant: AI Dr. Coach 응답
 * - system: 시스템 알림 (Part 5 Section 3.3 Rule-Based Trigger)
 */
export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  ts: number;
  feedback?: "positive" | "negative"; // Part 5 Section 7.2
  /** If true, this message was from voice input */
  fromVoice?: boolean;
  /** Which persona sent this message (for assistant messages) */
  personaId?: PersonaId;
};

/**
 * 채팅 컨텍스트 (Part 5 Section 4.2)
 */
export type ChatContext = {
  last3: number[];
  last7: number[];
  currentConcentration: number;
  currentHealthScore: number;
  goals?: HealthGoal[];
};

/**
 * Extended context for multi-persona system
 */
export type ExtendedChatContext = ChatContext & Partial<MultiPersonaContext>;

/**
 * Context-Aware Response Logic (Part 5 Section 4.2)
 * 사용자 질문과 현재 센서 데이터를 기반으로 응답 생성
 */
export function generateContextAwareResponse(
  question: string,
  context: ChatContext,
  seniorMode = false
): string {
  const q = question.trim().toLowerCase();
  const { currentConcentration, currentHealthScore, last3, last7, goals = [] } = context;

  // 평균 계산 유틸
  const mean = (xs: number[]) =>
    xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const avg3 = mean(last3);
  const avg7 = mean(last7);
  const deltaPct = avg7 === 0 ? 0 : ((avg3 - avg7) / avg7) * 100;

  let response: string;

  // 1. "왜 점수가 낮아?" / "Why is my score low?" 관련 질문
  const isScoreQuestion =
    q.includes("점수") ||
    q.includes("score") ||
    q.includes("낮아") ||
    q.includes("low") ||
    q.includes("왜 이렇게");

  if (isScoreQuestion) {
    if (currentConcentration > 2.0) {
      response = tuneByGoals(
        seniorMode
          ? `피로 지수가 높아요. 좀 쉬세요.`
          : `최근 센서 데이터에 따르면 젖산 수치가 ${currentConcentration.toFixed(1)} mmol/L로 높게 측정되었습니다. 고강도 운동 후 또는 피로 누적 시 이런 패턴이 나타날 수 있어요. 충분한 휴식과 수분 섭취를 권장합니다.`,
        goals,
        { currentConcentration, currentHealthScore }
      );
    } else if (currentHealthScore < 60) {
      response = tuneByGoals(
        seniorMode
          ? `건강 점수가 ${currentHealthScore}점으로 낮아요. 오늘은 쉬세요.`
          : `현재 건강 점수가 ${currentHealthScore}점으로 정상 범위 아래입니다. 최근 측정된 농도(${currentConcentration.toFixed(1)} mmol/L)와 변동성을 고려할 때, 오늘은 가벼운 활동 위주로 조절해보세요.`,
        goals,
        { currentConcentration, currentHealthScore }
      );
    } else {
      response = tuneByGoals(
        seniorMode
          ? `상태가 좋아요! 건강 점수 ${currentHealthScore}점이에요.`
          : `현재 바이탈 수치는 안정적입니다. 건강 점수 ${currentHealthScore}점, 젖산 ${currentConcentration.toFixed(1)} mmol/L로 양호한 상태예요.`,
        goals,
        { currentConcentration, currentHealthScore }
      );
    }
    return seniorMode ? simplifySeniorResponse(response) : response;
  }

  // 2. 피로 관련 질문
  const isFatigueQuestion =
    q.includes("피곤") ||
    q.includes("피로") ||
    q.includes("지침") ||
    q.includes("fatigue") ||
    q.includes("tired");

  if (isFatigueQuestion) {
    const direction = deltaPct >= 0 ? "높습니다" : "낮습니다";
    const absPct = Math.abs(deltaPct);
    const pctText = `${Math.round(absPct)}%`;

    let advice: string;
    if (currentConcentration > 2.0) {
      advice = seniorMode
        ? "피로가 쌓였어요. 물 마시고 쉬세요."
        : `현재 젖산 수치(${currentConcentration.toFixed(1)} mmol/L)가 높아 피로감을 느끼실 수 있어요. 회복(수면/수분/저강도 활동) 비중을 늘리고 고강도는 24–48시간 줄여보세요.`;
    } else if (deltaPct >= 10) {
      advice = seniorMode
        ? "피로 지수가 올라가고 있어요. 물 마시고 쉬세요."
        : "최근 젖산이 상승 추세입니다. 수면과 수분 섭취를 늘리고, 고강도 운동은 잠시 쉬어가세요.";
    } else {
      advice = seniorMode
        ? "수치는 괜찮아요. 잠은 잘 주무셨나요?"
        : "수치는 비교적 안정적이에요. 수면의 질, 스트레스, 수분/탄수 타이밍을 함께 점검해보세요.";
    }

    response = tuneByGoals(
      seniorMode
        ? advice
        : `최근 3일간 젖산 수치가 7일 평균 대비 ${pctText} ${direction}. ${advice}`,
      goals,
      { currentConcentration, currentHealthScore }
    );
    return seniorMode ? simplifySeniorResponse(response) : response;
  }

  // 3. 상태 확인 질문
  const isStatusQuestion =
    q.includes("상태") ||
    q.includes("어때") ||
    q.includes("status") ||
    q.includes("how am i");

  if (isStatusQuestion) {
    if (currentHealthScore >= 80) {
      response = tuneByGoals(
        seniorMode
          ? `상태가 아주 좋아요! ${currentHealthScore}점이에요.`
          : `현재 상태가 매우 양호합니다! 건강 점수 ${currentHealthScore}점, 젖산 ${currentConcentration.toFixed(1)} mmol/L로 최적 상태예요. 오늘 계획한 활동을 진행해도 좋습니다.`,
        goals,
        { currentConcentration, currentHealthScore }
      );
    } else if (currentHealthScore >= 60) {
      response = tuneByGoals(
        seniorMode
          ? `상태가 보통이에요. ${currentHealthScore}점. 무리하지 마세요.`
          : `현재 상태는 보통입니다. 건강 점수 ${currentHealthScore}점으로, 가벼운 활동은 괜찮지만 고강도 운동은 피하는 게 좋겠어요.`,
        goals,
        { currentConcentration, currentHealthScore }
      );
    } else {
      response = tuneByGoals(
        seniorMode
          ? `상태가 안 좋아요. ${currentHealthScore}점. 쉬세요.`
          : `현재 상태가 좋지 않습니다. 건강 점수가 ${currentHealthScore}점으로 낮아요. 휴식이 필요합니다.`,
        goals,
        { currentConcentration, currentHealthScore }
      );
    }
    return seniorMode ? simplifySeniorResponse(response) : response;
  }

  // 4. 빈 입력
  if (q.length === 0) {
    return seniorMode
      ? "무엇이 궁금하세요?"
      : "궁금한 점을 입력해 주세요. 예: '왜 점수가 낮아?', '요즘 왜 피곤하지?'";
  }

  // 5. 기본 응답
  response = tuneByGoals(
    seniorMode
      ? `건강 점수 ${currentHealthScore}점이에요. 오늘도 힘내세요!`
      : `현재 건강 점수는 ${currentHealthScore}점, 젖산 농도는 ${currentConcentration.toFixed(1)} mmol/L입니다. 오늘 컨디션에 맞춰 운동 강도와 휴식 균형을 조절해보세요.`,
    goals,
    { currentConcentration, currentHealthScore }
  );
  return seniorMode ? simplifySeniorResponse(response) : response;
}

function tuneByGoals(
  base: string,
  goals: HealthGoal[],
  ctx: { currentConcentration: number; currentHealthScore: number }
): string {
  if (!goals.length) return base;

  const parts: string[] = [base];

  // 혈당 관리 목표: 식후 걷기/규칙성/강도 조절
  if (goals.includes("blood_sugar_control")) {
    parts.push("목표가 '혈당 관리'라면, 식후 10–15분 가벼운 걷기와 규칙적인 식사/수면 리듬을 우선으로 해보세요.");
  }

  // 근육 증가 목표: 회복/단백질/과훈련 방지
  if (goals.includes("muscle_gain")) {
    if (ctx.currentConcentration > 2.0 || ctx.currentHealthScore < 60) {
      parts.push("목표가 '근육 증가'여도 오늘은 회복(수면/수분/가벼운 활동) 우선이 안전합니다. 내일 컨디션 회복 후 강도를 올리세요.");
    } else {
      parts.push("목표가 '근육 증가'라면, 오늘은 큰 근육 위주로 무게를 천천히 올리고(폼 유지), 단백질/수분을 충분히 챙기세요.");
    }
  }

  // 스트레스 관리 목표: 호흡/카페인/수면 위생
  if (goals.includes("stress_management")) {
    parts.push("목표가 '스트레스 관리'라면, 3분 복식호흡(4초 들숨/6초 날숨)과 카페인/야식 줄이기, 수면 시간 고정을 추천합니다.");
  }

  return parts.join(" ");
}

/**
 * 시스템 알림 메시지 생성 (Part 5 Section 3.3 Rule-Based Trigger)
 */
export function generateSystemAlert(healthScore: number): string | null {
  if (healthScore < 60) {
    return "⚠️ Warning: 비정상 수치가 감지되었습니다. 10분간 휴식을 권장합니다.";
  }
  return null;
}

/* ============================================
 * Voice Input/Output Hooks
 * ============================================ */

function useSpeechRecognition() {
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Browser does not support speech recognition");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "ko-KR"; // Korean by default

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const startListening = React.useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    setError(null);
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
    }
  }, []);

  const stopListening = React.useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    isSupported: typeof window !== "undefined" && (
      !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
    )
  };
}

function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const speak = React.useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const cancel = React.useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, cancel, isSpeaking };
}

/* ============================================
 * Typing Indicator Component
 * ============================================ */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="typing-indicator"
    >
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </motion.div>
  );
}

/* ============================================
 * Chat Bubble Component (iMessage Style)
 * ============================================ */
interface ChatBubbleProps {
  message: ChatMessage;
  messagePersona?: typeof PERSONAS[keyof typeof PERSONAS];
  locale: "ko" | "en";
  seniorMode: boolean;
  feedbackLoading: string | null;
  onFeedback: (messageId: string, type: "positive" | "negative") => void;
}

function ChatBubble({ 
  message, 
  messagePersona, 
  locale, 
  seniorMode,
  feedbackLoading,
  onFeedback
}: ChatBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isAssistant = message.role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex flex-col",
        isUser ? "items-end" : "items-start"
      )}
    >
      {/* Persona badge for assistant messages */}
      {isAssistant && messagePersona && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-1.5 flex items-center gap-1.5"
        >
          <span className="text-sm">{messagePersona.emoji}</span>
          <span className={cn("text-xs font-medium", messagePersona.color)}>
            {locale === "ko" ? messagePersona.nameKo : messagePersona.name}
          </span>
        </motion.div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[85%] px-4 py-3 shadow-nebula-sm",
          seniorMode ? "text-base leading-relaxed" : "text-sm leading-relaxed",
          // User bubble - gradient blue (iMessage style)
          isUser && [
            "rounded-2xl rounded-br-md",
            "bg-gradient-to-r from-[#0ea5e9] to-[#2563eb]",
            "text-white"
          ],
          // AI bubble - light gray with persona accent
          isAssistant && !messagePersona && [
            "rounded-2xl rounded-bl-md",
            "bg-slate-100 dark:bg-slate-800",
            "text-slate-900 dark:text-slate-100"
          ],
          isAssistant && messagePersona && [
            "rounded-2xl rounded-bl-md",
            messagePersona.bgColor,
            messagePersona.borderColor,
            "border",
            "text-slate-900 dark:text-slate-100"
          ],
          // System alert - rose
          isSystem && [
            "rounded-2xl mx-auto text-center",
            "bg-rose-50 dark:bg-rose-900/30",
            "text-rose-800 dark:text-rose-200",
            "border border-rose-200 dark:border-rose-800"
          ]
        )}
      >
        {/* System alert icon */}
        {isSystem && (
          <div className="mb-1 flex items-center justify-center gap-1 text-xs font-medium opacity-80">
            <AlertTriangle className="h-3 w-3" />
            <span>System Alert</span>
          </div>
        )}
        
        {message.text}
        
        {/* Voice indicator */}
        {message.fromVoice && (
          <span className="ml-1 inline-flex items-center text-xs opacity-60">
            <Volume2 className="h-3 w-3" />
          </span>
        )}
      </div>

      {/* Feedback buttons for AI messages */}
      {isAssistant && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-1.5 flex items-center gap-1"
        >
          {message.feedback ? (
            <span className="text-xs text-muted-foreground">
              {message.feedback === "positive" ? "👍 도움이 됐어요" : "👎 아쉬워요"}
            </span>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                onClick={() => onFeedback(message.id, "positive")}
                disabled={feedbackLoading === message.id}
              >
                {feedbackLoading === message.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ThumbsUp className="mr-1 h-3 w-3" />
                )}
                {seniorMode ? "좋아요" : "도움됨"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                onClick={() => onFeedback(message.id, "negative")}
                disabled={feedbackLoading === message.id}
              >
                {feedbackLoading === message.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ThumbsDown className="mr-1 h-3 w-3" />
                )}
                {seniorMode ? "별로예요" : "아쉬움"}
              </Button>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * AI Coach Chat Component - Manpasik Nebula Edition
 * iMessage-like design with typing indicators and smooth animations
 */
export function AICoachChat({
  messages,
  onSend,
  onFeedback,
  context,
  extendedContext,
  coachingPersonality = "balanced",
  mallHealthContext,
  onCartUpdate,
  showRecommendations = true,
  seniorMode = false,
  showCouncilChamber = false,
  currentPersona: controlledPersona,
  onPersonaChange,
  locale = "ko"
}: {
  messages: ChatMessage[];
  onSend: (text: string, fromVoice?: boolean, personaId?: PersonaId) => void;
  onFeedback?: (messageId: string, feedbackType: "positive" | "negative") => void;
  context: ChatContext;
  /** Extended context for multi-persona auto-selection */
  extendedContext?: Partial<MultiPersonaContext>;
  coachingPersonality?: "gentle" | "balanced" | "serious";
  mallHealthContext?: HealthContext;
  onCartUpdate?: () => void;
  showRecommendations?: boolean;
  seniorMode?: boolean;
  /** Show the Council Chamber persona selector */
  showCouncilChamber?: boolean;
  /** Controlled persona (from parent) */
  currentPersona?: PersonaId;
  /** Callback when persona changes */
  onPersonaChange?: (id: PersonaId) => void;
  /** Locale for persona labels */
  locale?: "ko" | "en";
}) {
  const [text, setText] = React.useState("");
  const [feedbackLoading, setFeedbackLoading] = React.useState<string | null>(null);
  const [councilOpen, setCouncilOpen] = React.useState(false);
  const [internalPersona, setInternalPersona] = React.useState<PersonaId>("doctor");
  const [isTyping, setIsTyping] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement | null>(null);

  // Use controlled or internal persona
  const activePersona = controlledPersona ?? internalPersona;
  const setActivePersona = (id: PersonaId) => {
    setInternalPersona(id);
    onPersonaChange?.(id);
  };

  // Build full multi-persona context
  const multiContext: MultiPersonaContext = React.useMemo(() => ({
    ...context,
    ...extendedContext
  }), [context, extendedContext]);

  // Voice input/output
  const { isListening, transcript, startListening, stopListening, isSupported } =
    useSpeechRecognition();
  const { speak, isSpeaking } = useSpeechSynthesis();

  // Handle voice transcript
  React.useEffect(() => {
    if (transcript) {
      setText(transcript);
      // Auto-send after voice input with auto-selected persona
      const autoPersona = getPrimaryPersona(multiContext, transcript);
      onSend(transcript, true, autoPersona);
      setText("");
    }
  }, [transcript, onSend, multiContext]);

  // Speak the latest AI response if it was triggered by voice
  React.useEffect(() => {
    const latestAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (latestAssistant?.fromVoice) {
      const voiceText = generateVoiceResponse(latestAssistant.text, seniorMode);
      speak(voiceText);
    }
  }, [messages, speak, seniorMode]);

  // Simulate typing indicator when AI is responding
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user") {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Handle adding product to cart
  const handleAddToCart = React.useCallback(
    (product: Product) => {
      const cartManager = getCartManager();
      cartManager.addItem(product, 1);
      onCartUpdate?.();
    },
    [onCartUpdate]
  );

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isTyping]);

  function submit() {
    const t = text.trim();
    if (!t) return;
    // Auto-select persona based on user input if not manually selected
    const autoPersona = getPrimaryPersona(multiContext, t);
    onSend(t, false, autoPersona);
    setText("");
  }

  async function handleFeedback(messageId: string, feedbackType: "positive" | "negative") {
    if (feedbackLoading) return;

    setFeedbackLoading(messageId);

    try {
      // 부모 컴포넌트에 알림
      onFeedback?.(messageId, feedbackType);

      // API 호출
      const message = messages.find((m) => m.id === messageId);
      const prevMessage = messages.find(
        (m, i) => messages[i + 1]?.id === messageId && m.role === "user"
      );

      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          feedbackType,
          context: {
            question: prevMessage?.text ?? "",
            response: message?.text ?? "",
            healthScore: context.currentHealthScore,
            concentration: context.currentConcentration
          }
        })
      });

      console.log(`[Chat] Feedback sent: ${feedbackType} for message ${messageId}`);
    } catch (err) {
      console.error("[Chat] Feedback error:", err);
    } finally {
      setFeedbackLoading(null);
    }
  }

  /**
   * 코칭 성격에 따른 배지
   */
  function getPersonalityBadge() {
    switch (coachingPersonality) {
      case "gentle":
        return (
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
            Gentle
          </span>
        );
      case "serious":
        return (
          <span className="rounded-full bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300">
            Serious
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
            Balanced
          </span>
        );
    }
  }

  const isKo = locale === "ko";

  return (
    <motion.div 
      className="flex h-full flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Compact Persona Selector (always shown) */}
      <div className="mb-3">
        <CouncilChamber
          currentPersona={activePersona}
          onSelectPersona={setActivePersona}
          context={multiContext}
          compact={!councilOpen}
          locale={locale}
        />
        {!councilOpen && showCouncilChamber && (
          <button
            onClick={() => setCouncilOpen(true)}
            className="mt-1 text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            {isKo ? "전체 회의실 보기" : "View full council"}
          </button>
        )}
      </div>

      {/* Full Council Chamber (expandable) */}
      <AnimatePresence>
        {councilOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <CouncilChamber
              currentPersona={activePersona}
              onSelectPersona={(id) => {
                setActivePersona(id);
                setCouncilOpen(false);
              }}
              context={multiContext}
              compact={false}
              locale={locale}
            />
            <button
              onClick={() => setCouncilOpen(false)}
              className="mt-1 text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              {isKo ? "접기" : "Collapse"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Messages Area */}
      <ScrollArea 
        className={cn(
          "rounded-2xl border border-slate-200 dark:border-slate-700",
          "bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm",
          "custom-scrollbar",
          councilOpen ? "h-[30vh]" : "h-[40vh]"
        )}
      >
        <div className="space-y-4 p-4">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-12 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm">
                {seniorMode
                  ? "무엇이든 물어보세요!"
                  : "예: \"요즘 왜 이렇게 피곤하지?\" / \"왜 점수가 낮아?\""}
              </p>
            </motion.div>
          ) : null}

          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const messagePersona = m.personaId ? PERSONAS[m.personaId] : undefined;
              return (
                <ChatBubble
                  key={m.id}
                  message={m}
                  messagePersona={messagePersona}
                  locale={locale}
                  seniorMode={seniorMode}
                  feedbackLoading={feedbackLoading}
                  onFeedback={handleFeedback}
                />
              );
            })}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && <TypingIndicator />}
          </AnimatePresence>

          <div ref={endRef} />
        </div>
      </ScrollArea>

      {/* Input Area with Voice Button */}
      <motion.div 
        className="mt-4 flex items-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative flex-1">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={seniorMode ? "여기에 질문을 입력하세요..." : "AI Dr. Coach에게 질문하기…"}
            aria-label="질문 입력"
            className={cn(
              "pr-10 rounded-xl border-slate-200 dark:border-slate-700",
              "bg-white dark:bg-slate-800",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "transition-all duration-200",
              seniorMode && "text-base py-3"
            )}
          />
        </div>

        {/* Microphone Button */}
        {isSupported && (
          <Button
            onClick={isListening ? stopListening : startListening}
            size={seniorMode ? "icon-lg" : "icon"}
            variant={isListening ? "destructive" : "glass"}
            aria-label={isListening ? "음성 입력 중지" : "음성으로 질문하기"}
            className={cn(
              "relative shrink-0",
              isListening && "animate-pulse"
            )}
          >
            {isListening ? (
              <MicOff className={cn("h-4 w-4", seniorMode && "h-5 w-5")} />
            ) : (
              <Mic className={cn("h-4 w-4", seniorMode && "h-5 w-5")} />
            )}
            {isListening && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            )}
          </Button>
        )}

        <Button
          onClick={submit}
          size={seniorMode ? "icon-lg" : "icon"}
          aria-label="전송"
          className="shrink-0"
        >
          <Send className={cn("h-4 w-4", seniorMode && "h-5 w-5")} />
        </Button>
      </motion.div>

      {/* Voice Status Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="mt-2 flex items-center justify-center gap-2 text-sm text-rose-600"
          >
            <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            {seniorMode ? "듣고 있어요... 말씀하세요" : "음성 인식 중..."}
          </motion.div>
        )}

        {isSpeaking && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="mt-2 flex items-center justify-center gap-2 text-sm text-sky-600"
          >
            <Volume2 className="h-4 w-4 animate-pulse" />
            {seniorMode ? "말하고 있어요..." : "음성 출력 중..."}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI-Powered Product Recommendations (Mall Integration) */}
      {showRecommendations && mallHealthContext && context.currentHealthScore < 75 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ChatRecommendation
            healthContext={mallHealthContext}
            onAddToCart={handleAddToCart}
            onViewMall={() => (window.location.href = "/store/products")}
          />
        </motion.div>
      )}

      {/* Context & Coaching Status */}
      <motion.div 
        className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <PersonaIndicator
              personaId={activePersona}
              onClick={() => setCouncilOpen(!councilOpen)}
              locale={locale}
            />
            {getPersonalityBadge()}
            {seniorMode && (
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                시니어
              </span>
            )}
          </div>
          <span
            className={cn(
              "font-semibold",
              context.currentHealthScore >= 80
                ? "text-emerald-600 dark:text-emerald-400"
                : context.currentHealthScore >= 60
                  ? "text-sky-600 dark:text-sky-400"
                  : "text-rose-600 dark:text-rose-400"
            )}
          >
            {seniorMode
              ? `점수: ${context.currentHealthScore}`
              : `Score: ${context.currentHealthScore} | ${context.currentConcentration.toFixed(1)} mmol/L`}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
