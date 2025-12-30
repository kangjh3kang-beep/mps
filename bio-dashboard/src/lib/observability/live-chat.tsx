"use client";

/**
 * Live Chat Widget (Channel.io Style)
 * 
 * Floating button for logged-in users to contact support.
 * Auto-injects user context for better support experience.
 */

import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LiveChatProps {
  userId?: string;
  userEmail?: string;
  userName?: string;
  lastHealthScore?: number;
}

export function LiveChat({ userId, userEmail, userName, lastHealthScore }: LiveChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; time: string }>>([
    {
      text: "안녕하세요! 만파식 고객지원입니다. 무엇을 도와드릴까요? 🌿",
      isUser: false,
      time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Only show for logged-in users
  if (!userId) {
    return null;
  }

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage = {
      text: message,
      isUser: true,
      time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    // Auto-response (in production, this would go to actual support system)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: "메시지가 접수되었습니다. 담당자가 곧 연락드릴 예정입니다. 평균 응답 시간: 5분",
          isUser: false,
          time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1000);

    // In production: Send to Channel.io or backend
    console.log("[Support] Message sent:", {
      userId,
      userEmail,
      userName,
      lastHealthScore,
      message: message,
    });
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
            aria-label="고객지원 채팅 열기"
          >
            <MessageCircle className="w-6 h-6 text-white" />
            {/* Notification dot */}
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? "auto" : "450px"
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">만파식 고객지원</h3>
                  <p className="text-white/80 text-xs">평균 응답 시간: 5분</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
                  aria-label={isMinimized ? "채팅창 확장" : "채팅창 최소화"}
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
                  aria-label="채팅창 닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* User Context Banner */}
            {!isMinimized && (
              <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <span className="font-medium">{userName || userEmail}</span>
                {lastHealthScore !== undefined && (
                  <span className="ml-2">
                    · 최근 건강점수: <span className="text-emerald-600 font-semibold">{lastHealthScore}</span>
                  </span>
                )}
              </div>
            )}

            {/* Messages */}
            {!isMinimized && (
              <div className="h-[280px] overflow-y-auto p-4 space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                        msg.isUser
                          ? "bg-emerald-500 text-white rounded-br-md"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.isUser ? "text-white/70" : "text-slate-400"}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            {!isMinimized && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 rounded-full flex items-center justify-center transition"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default LiveChat;

