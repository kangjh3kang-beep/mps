"use client";

/**
 * ============================================================
 * MANPASIK MATE - PERSONALITY SETUP
 * "What kind of friend do you need?"
 * ============================================================
 */

import * as React from "react";
import { motion } from "framer-motion";
import { Swords, Heart, BarChart3, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ManpasikAvatar } from "./ManpasikAvatar";
import { cn } from "@/lib/utils";
import type { PersonalityType } from "@/lib/mate/screen-interpreter";

interface PersonalityOption {
  type: PersonalityType;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  expression: "happy" | "neutral" | "worried";
  sampleDialog: string;
}

const personalities: PersonalityOption[] = [
  {
    type: 'sergeant',
    title: '교관',
    subtitle: 'The Sergeant',
    description: '엄격하지만 당신을 성장시켜줄 친구',
    icon: Swords,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200 hover:border-red-400',
    expression: 'neutral',
    sampleDialog: '"일어나! 스쿼트 30개 하고 와! 설탕은 꿈도 꾸지 마!"',
  },
  {
    type: 'caregiver',
    title: '따뜻한 친구',
    subtitle: 'The Caregiver',
    description: '공감하고 위로해주는 다정한 동반자',
    icon: Heart,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 border-rose-200 hover:border-rose-400',
    expression: 'happy',
    sampleDialog: '"괜찮아요? 오늘은 좀 쉬어도 돼요. 제가 옆에 있을게요."',
  },
  {
    type: 'analyst',
    title: '분석가',
    subtitle: 'The Analyst',
    description: '데이터 기반으로 냉철하게 조언하는 전문가',
    icon: BarChart3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    expression: 'neutral',
    sampleDialog: '"질병 확률 32%. 개입 권장. 최적 전략을 계산 중입니다."',
  },
];

interface PersonalitySetupProps {
  currentPersonality?: PersonalityType;
  onSelect: (type: PersonalityType) => void;
  onComplete?: () => void;
}

export function PersonalitySetup({
  currentPersonality,
  onSelect,
  onComplete,
}: PersonalitySetupProps) {
  const [selected, setSelected] = React.useState<PersonalityType | null>(
    currentPersonality ?? null
  );
  const [hoveredType, setHoveredType] = React.useState<PersonalityType | null>(null);

  const handleSelect = (type: PersonalityType) => {
    setSelected(type);
    onSelect(type);
  };

  const handleComplete = () => {
    if (selected) {
      onComplete?.();
    }
  };

  const displayedType = hoveredType ?? selected;

  return (
    <Card className="max-w-2xl mx-auto border-2">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">
          어떤 친구가 필요하세요?
        </CardTitle>
        <CardDescription className="text-base">
          만파식 메이트의 성격을 선택해주세요
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Avatar Preview */}
        <div className="flex justify-center">
          <motion.div
            key={displayedType}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <ManpasikAvatar
              expression={
                displayedType 
                  ? personalities.find(p => p.type === displayedType)?.expression 
                  : 'neutral'
              }
              size="xl"
            />
          </motion.div>
        </div>

        {/* Sample Dialog */}
        {displayedType && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground italic">
              {personalities.find(p => p.type === displayedType)?.sampleDialog}
            </p>
          </motion.div>
        )}

        {/* Personality Options */}
        <div className="grid gap-3">
          {personalities.map((p) => {
            const Icon = p.icon;
            const isSelected = selected === p.type;

            return (
              <motion.div
                key={p.type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={() => setHoveredType(p.type)}
                onMouseLeave={() => setHoveredType(null)}
              >
                <button
                  onClick={() => handleSelect(p.type)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    p.bgColor,
                    isSelected && "ring-2 ring-offset-2 ring-primary"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                      "p-3 rounded-xl bg-white shadow-sm",
                      p.color
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{p.title}</h3>
                        <span className="text-xs text-muted-foreground">
                          {p.subtitle}
                        </span>
                        {isSelected && (
                          <Check className="w-5 h-5 text-primary ml-auto" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {p.description}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Complete Button */}
        <Button
          onClick={handleComplete}
          disabled={!selected}
          className="w-full"
          size="lg"
        >
          {selected ? '이 친구와 시작하기' : '성격을 선택해주세요'}
        </Button>

        {/* Note */}
        <p className="text-xs text-center text-muted-foreground">
          나중에 설정에서 언제든 변경할 수 있어요
        </p>
      </CardContent>
    </Card>
  );
}






