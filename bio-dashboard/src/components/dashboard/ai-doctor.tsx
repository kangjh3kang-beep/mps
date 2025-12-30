"use client";

import React, { useState } from "react";
import { Bot, Mic, Send, Sparkles, Volume2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AI Doctor Chat Interface
 * 
 * AI 의사 채팅 인터페이스 - 가독성 & 직관성 강화 버전
 */
export function AiDoctor() {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);

  const suggestions = [
    { emoji: "💬", text: "오늘 컨디션 체크" },
    { emoji: "😴", text: "수면 분석" },
    { emoji: "🏃", text: "운동 추천" },
  ];

  return (
    <div className="hanji-card rounded-2xl p-5 lg:p-6 h-full flex flex-col animate-ink-spread" style={{ animationDelay: "0.2s" }}>
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dancheong-red to-dancheong-red/70 flex items-center justify-center shadow-lg animate-gentle-float">
            <Bot className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          {/* 온라인 표시 */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-dancheong-green rounded-full border-2 border-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            AI 헬스 코치
            <Sparkles className="w-4 h-4 text-dancheong-yellow" />
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 bg-dancheong-green rounded-full animate-pulse" />
            실시간 응답 가능
          </p>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 min-h-[140px] mb-5">
        {/* AI 메시지 버블 */}
        <div className="relative bg-gradient-to-br from-hanji-warm to-hanji rounded-2xl rounded-tl-sm p-4 mb-4 shadow-sm">
          {/* 말풍선 꼬리 */}
          <div className="absolute -left-2 top-4 w-4 h-4 bg-hanji-warm rotate-45" />
          
          <p className="text-base text-foreground leading-relaxed relative z-10">
            안녕하세요! 오늘 건강 상태가 <span className="font-semibold text-dancheong-green">매우 좋아요</span>! 
            <br />
            <span className="text-dancheong-blue font-medium">수면 7.5시간</span> 달성하셨네요. 😊
          </p>
          
          {/* 음성 듣기 버튼 */}
          <button className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Volume2 className="w-3.5 h-3.5" />
            <span>음성으로 듣기</span>
          </button>
        </div>

        {/* 빠른 질문 버튼들 */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium mb-2">빠른 질문</p>
          <div className="flex flex-col gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setMessage(suggestion.text)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl",
                  "bg-ink/5 hover:bg-ink/10 border border-transparent hover:border-ink/10",
                  "text-sm text-foreground font-medium",
                  "transition-all duration-200 group"
                )}
              >
                <span className="text-lg">{suggestion.emoji}</span>
                <span className="flex-1 text-left">{suggestion.text}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="flex items-center gap-3 p-3 bg-hanji-warm rounded-xl border border-ink/10 shadow-inner">
        <button
          onClick={() => setIsListening(!isListening)}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
            isListening
              ? "bg-dancheong-red text-white shadow-lg scale-110"
              : "bg-white text-ink-light hover:bg-ink/5 border border-ink/10"
          )}
        >
          <Mic className={cn("w-5 h-5", isListening && "animate-pulse")} />
        </button>
        <input
          type="text"
          placeholder="메시지를 입력하세요..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none"
        />
        <button
          disabled={!message.trim()}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
            message.trim()
              ? "bg-ink text-white hover:bg-ink-light shadow-md"
              : "bg-ink/20 text-ink/40 cursor-not-allowed"
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default AiDoctor;
