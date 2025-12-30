"use client";

/**
 * ============================================================
 * KIDS MODE PROVIDER
 * Gamified Health Experience for Children (6-12)
 * ============================================================
 * 
 * Generated from 41-Persona Simulation
 * Addressing: User #27 (초등학생)
 * Issue: "재미없음", "어려운 용어"
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// CHARACTER SYSTEM
// ============================================

export interface Character {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

export const CHARACTERS: Character[] = [
  {
    id: "mango",
    name: "망고",
    emoji: "🥭",
    description: "건강 지킴이 망고! 매일 건강 체크를 도와줄게!",
    color: "#FFAB00"
  },
  {
    id: "berry",
    name: "베리",
    emoji: "🫐",
    description: "똑똑한 베리가 건강 비밀을 알려줄게!",
    color: "#7C3AED"
  },
  {
    id: "kiwi",
    name: "키위",
    emoji: "🥝",
    description: "씩씩한 키위와 함께 건강 미션에 도전하자!",
    color: "#10B981"
  }
];

// ============================================
// ACHIEVEMENT SYSTEM
// ============================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_check",
    name: "첫 건강 체크!",
    description: "첫 번째 측정을 완료했어요",
    icon: "🎉",
    unlocked: false,
    progress: 0,
    target: 1
  },
  {
    id: "streak_3",
    name: "3일 연속 히어로",
    description: "3일 연속 측정했어요",
    icon: "🔥",
    unlocked: false,
    progress: 0,
    target: 3
  },
  {
    id: "streak_7",
    name: "일주일 챔피언",
    description: "7일 연속 측정했어요",
    icon: "🏆",
    unlocked: false,
    progress: 0,
    target: 7
  },
  {
    id: "healthy_score",
    name: "건강 마스터",
    description: "건강 점수 90점 이상 달성",
    icon: "⭐",
    unlocked: false,
    progress: 0,
    target: 90
  },
  {
    id: "explorer",
    name: "탐험가",
    description: "모든 메뉴를 둘러봤어요",
    icon: "🧭",
    unlocked: false,
    progress: 0,
    target: 5
  }
];

// ============================================
// SIMPLE TERM TRANSLATOR
// ============================================

const TERM_TRANSLATIONS: Record<string, { simple: string; emoji: string }> = {
  "젖산": { simple: "피로 물질", emoji: "😓" },
  "포도당": { simple: "에너지", emoji: "⚡" },
  "lactate": { simple: "피로 물질", emoji: "😓" },
  "glucose": { simple: "에너지", emoji: "⚡" },
  "건강 점수": { simple: "건강 별점", emoji: "⭐" },
  "측정": { simple: "건강 체크", emoji: "🔍" },
  "바이오마커": { simple: "몸 신호", emoji: "📡" },
  "농도": { simple: "양", emoji: "💧" },
  "분석": { simple: "살펴보기", emoji: "🔎" },
  "결과": { simple: "결과 카드", emoji: "🎴" },
  "추천": { simple: "친구 추천", emoji: "👍" },
  "경고": { simple: "조심!", emoji: "⚠️" },
  "정상": { simple: "좋아요!", emoji: "✅" },
  "위험": { simple: "도움 필요!", emoji: "🆘" }
};

export function translateForKids(text: string): string {
  let result = text;
  for (const [term, { simple, emoji }] of Object.entries(TERM_TRANSLATIONS)) {
    result = result.replace(new RegExp(term, 'gi'), `${emoji} ${simple}`);
  }
  return result;
}

// ============================================
// CONTEXT
// ============================================

interface KidsModeContextType {
  isActive: boolean;
  character: Character | null;
  setCharacter: (char: Character) => void;
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;
  updateProgress: (id: string, value: number) => void;
  points: number;
  addPoints: (amount: number) => void;
  translateText: (text: string) => string;
}

const KidsModeContext = React.createContext<KidsModeContextType | null>(null);

export function useKidsMode() {
  const ctx = React.useContext(KidsModeContext);
  if (!ctx) throw new Error("useKidsMode must be used within KidsModeProvider");
  return ctx;
}

// ============================================
// CELEBRATION MODAL
// ============================================

function CelebrationModal({ 
  achievement, 
  onClose 
}: { 
  achievement: Achievement; 
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 15 }}
        className="bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 rounded-3xl p-8 text-center shadow-2xl max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="text-8xl mb-4"
        >
          {achievement.icon}
        </motion.div>
        
        <h2 className="text-2xl font-bold text-white mb-2">
          🎊 축하해! 🎊
        </h2>
        
        <h3 className="text-xl font-semibold text-white/90 mb-2">
          {achievement.name}
        </h3>
        
        <p className="text-white/80 mb-6">
          {achievement.description}
        </p>
        
        <div className="flex justify-center gap-2 mb-4">
          {[...Array(5)].map((_, i) => (
            <motion.span
              key={i}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * i }}
              className="text-3xl"
            >
              ⭐
            </motion.span>
          ))}
        </div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="bg-white text-amber-600 font-bold py-3 px-8 rounded-full text-lg shadow-lg"
        >
          좋아요! 👍
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// CHARACTER BUBBLE
// ============================================

export function CharacterBubble({ 
  message, 
  character 
}: { 
  message: string; 
  character: Character;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-end gap-3 mb-4"
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-5xl"
      >
        {character.emoji}
      </motion.div>
      
      <div 
        className="relative px-4 py-3 rounded-2xl rounded-bl-none max-w-[280px]"
        style={{ backgroundColor: character.color + '20' }}
      >
        <div 
          className="absolute left-0 bottom-0 w-3 h-3 -translate-x-1"
          style={{ 
            backgroundColor: character.color + '20',
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
          }}
        />
        <p className="text-gray-800 font-medium">
          <span className="font-bold" style={{ color: character.color }}>
            {character.name}:
          </span>{' '}
          {message}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================
// PROVIDER
// ============================================

export function KidsModeProvider({ 
  children,
  isActive = false
}: { 
  children: React.ReactNode;
  isActive?: boolean;
}) {
  const [character, setCharacter] = React.useState<Character | null>(
    CHARACTERS[0]
  );
  const [achievements, setAchievements] = React.useState<Achievement[]>(ACHIEVEMENTS);
  const [points, setPoints] = React.useState(0);
  const [celebration, setCelebration] = React.useState<Achievement | null>(null);

  const unlockAchievement = React.useCallback((id: string) => {
    setAchievements(prev => {
      const updated = prev.map(a => 
        a.id === id ? { ...a, unlocked: true, progress: a.target } : a
      );
      const unlocked = updated.find(a => a.id === id);
      if (unlocked && !prev.find(a => a.id === id)?.unlocked) {
        setCelebration(unlocked);
        setPoints(p => p + 100);
      }
      return updated;
    });
  }, []);

  const updateProgress = React.useCallback((id: string, value: number) => {
    setAchievements(prev => prev.map(a => {
      if (a.id !== id) return a;
      const newProgress = Math.min(a.target, a.progress + value);
      if (newProgress >= a.target && !a.unlocked) {
        setTimeout(() => unlockAchievement(id), 500);
      }
      return { ...a, progress: newProgress };
    }));
  }, [unlockAchievement]);

  const addPoints = React.useCallback((amount: number) => {
    setPoints(p => p + amount);
  }, []);

  const translateText = React.useCallback((text: string) => {
    return isActive ? translateForKids(text) : text;
  }, [isActive]);

  const value: KidsModeContextType = {
    isActive,
    character,
    setCharacter,
    achievements,
    unlockAchievement,
    updateProgress,
    points,
    addPoints,
    translateText
  };

  return (
    <KidsModeContext.Provider value={value}>
      {/* 키즈 모드 스타일 */}
      {isActive && (
        <style jsx global>{`
          body {
            background: linear-gradient(180deg, #FEF3C7 0%, #DBEAFE 100%) !important;
          }
          
          .card, [class*="Card"] {
            border-radius: 24px !important;
            border: 3px solid #F59E0B !important;
          }
          
          button {
            border-radius: 9999px !important;
            font-weight: 700 !important;
          }
          
          h1, h2, h3 {
            color: #7C3AED !important;
          }
        `}</style>
      )}

      {children}

      <AnimatePresence>
        {celebration && (
          <CelebrationModal 
            achievement={celebration} 
            onClose={() => setCelebration(null)} 
          />
        )}
      </AnimatePresence>
    </KidsModeContext.Provider>
  );
}

