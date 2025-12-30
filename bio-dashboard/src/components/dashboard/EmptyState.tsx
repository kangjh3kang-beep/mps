'use client';

/**
 * Empty State Component
 * Displayed when user has no data (0 measurements, etc.)
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  Plus,
  ArrowRight,
  Sparkles,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

interface EmptyStateProps {
  type: 'measurements' | 'history' | 'reports' | 'notifications' | 'generic';
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const emptyStateConfig = {
  measurements: {
    icon: Activity,
    title: '아직 측정 기록이 없어요',
    description: '첫 번째 건강 측정을 시작해보세요. AI가 당신의 건강 패턴을 분석해드립니다.',
    actionLabel: '첫 측정 시작하기',
    actionHref: '/analyze',
    tips: [
      '카트리지를 리더기에 삽입하세요',
      '앱에서 측정 시작 버튼을 누르세요',
      '30초 후 결과를 확인하세요',
    ],
  },
  history: {
    icon: BookOpen,
    title: '측정 히스토리가 없어요',
    description: '측정을 시작하면 여기에 모든 기록이 저장됩니다.',
    actionLabel: '측정하러 가기',
    actionHref: '/analyze',
  },
  reports: {
    icon: Sparkles,
    title: '분석 리포트가 없어요',
    description: '최소 3회 이상 측정하면 AI가 맞춤형 건강 리포트를 생성합니다.',
    actionLabel: '측정 시작하기',
    actionHref: '/analyze',
  },
  notifications: {
    icon: HelpCircle,
    title: '알림이 없어요',
    description: '건강 알림, 리마인더, 시스템 공지가 여기에 표시됩니다.',
    actionLabel: '알림 설정하기',
    actionHref: '/settings',
  },
  generic: {
    icon: HelpCircle,
    title: '데이터가 없어요',
    description: '아직 표시할 내용이 없습니다.',
    actionLabel: '홈으로 가기',
    actionHref: '/',
  },
};

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Animated Icon */}
      <motion.div
        className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Icon className="w-12 h-12 text-muted-foreground" />
      </motion.div>

      {/* Title */}
      <h3 className="text-xl font-semibold mb-2">
        {title || config.title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground max-w-sm mb-8">
        {description || config.description}
      </p>

      {/* Tips (for measurements empty state) */}
      {type === 'measurements' && config.tips && (
        <div className="mb-8 p-4 bg-muted rounded-xl max-w-sm">
          <p className="text-sm font-medium mb-3">시작하는 방법:</p>
          <ol className="text-sm text-muted-foreground text-left space-y-2">
            {config.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Action Button */}
      {(actionHref || onAction) && (
        <Link
          href={actionHref || config.actionHref || '/'}
          onClick={onAction}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {actionLabel || config.actionLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}

      {/* Help Link */}
      <Link
        href="/school"
        className="mt-6 text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
      >
        <HelpCircle className="w-4 h-4" />
        도움이 필요하신가요?
      </Link>
    </motion.div>
  );
}

export default EmptyState;


