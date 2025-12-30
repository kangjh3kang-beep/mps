/**
 * ============================================================
 * INNOVATION #3: AI STRESS COACH FOR STUDENTS
 * AI 스트레스 코치 - 학생용 시험 스트레스 관리
 * Proposed by: Users 27-30 (초등학생~대학생)
 * ============================================================
 */

// ============================================
// TYPES & INTERFACES
// ============================================

export type StudentGrade = 
  | 'elementary'  // 초등학생
  | 'middle'      // 중학생
  | 'high'        // 고등학생
  | 'university'; // 대학생

export type StressLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface StudentProfile {
  id: string;
  name: string;
  grade: StudentGrade;
  age: number;
  examSchedule: ExamSchedule[];
  stressHistory: StressRecord[];
  preferredRelaxation: RelaxationType[];
  parentNotificationEnabled: boolean;
  privacyLevel: 'full' | 'limited' | 'emergency_only';
}

export interface ExamSchedule {
  id: string;
  name: string;
  subject: string;
  date: Date;
  importance: 'low' | 'medium' | 'high' | 'critical';
  preparationStatus: number; // 0-100
}

export interface StressRecord {
  timestamp: Date;
  level: StressLevel;
  cortisol: number;
  heartRate: number;
  hrv: number;
  sleepQuality: number;
  trigger?: string;
  intervention?: string;
  outcome?: 'improved' | 'unchanged' | 'worsened';
}

export type RelaxationType = 
  | 'breathing'       // 호흡 운동
  | 'meditation'      // 명상
  | 'music'          // 음악 감상
  | 'exercise'       // 가벼운 운동
  | 'nature_sounds'  // 자연 소리
  | 'asmr'           // ASMR
  | 'stretching'     // 스트레칭
  | 'journaling'     // 일기 쓰기
  | 'gaming'         // 짧은 게임
  | 'social';        // 친구와 대화

export interface StressIntervention {
  id: string;
  type: RelaxationType;
  title: string;
  description: string;
  duration: number; // minutes
  effectiveness: number; // 0-100
  ageAppropriate: StudentGrade[];
  contentUrl?: string;
  steps?: string[];
}

export interface StressAnalysis {
  currentLevel: StressLevel;
  score: number; // 0-100 (higher = more stressed)
  physicalIndicators: {
    cortisol: { value: number; status: string };
    heartRate: { value: number; status: string };
    hrv: { value: number; status: string };
    sleepDebt: { hours: number; impact: string };
  };
  mentalIndicators: {
    anxietyScore: number;
    focusScore: number;
    moodScore: number;
  };
  triggers: string[];
  recommendations: StressIntervention[];
  urgentAlert?: string;
}

// ============================================
// STRESS INTERVENTIONS DATABASE
// ============================================

export const STRESS_INTERVENTIONS: StressIntervention[] = [
  {
    id: 'breathing-478',
    type: 'breathing',
    title: '4-7-8 호흡법',
    description: '불안을 빠르게 진정시키는 호흡 기법',
    duration: 3,
    effectiveness: 85,
    ageAppropriate: ['elementary', 'middle', 'high', 'university'],
    steps: [
      '편안한 자세로 앉으세요',
      '4초 동안 코로 숨을 들이쉽니다',
      '7초 동안 숨을 참습니다',
      '8초 동안 입으로 천천히 내쉽니다',
      '이 과정을 4회 반복합니다',
    ],
  },
  {
    id: 'box-breathing',
    type: 'breathing',
    title: '박스 호흡법',
    description: '집중력을 높이고 긴장을 풀어주는 호흡법',
    duration: 5,
    effectiveness: 80,
    ageAppropriate: ['middle', 'high', 'university'],
    steps: [
      '4초 동안 숨을 들이쉽니다',
      '4초 동안 숨을 참습니다',
      '4초 동안 숨을 내쉽니다',
      '4초 동안 숨을 참습니다',
      '5분간 반복합니다',
    ],
  },
  {
    id: 'quick-meditation',
    type: 'meditation',
    title: '5분 마음챙김 명상',
    description: '짧은 시간에 마음을 가라앉히는 명상',
    duration: 5,
    effectiveness: 75,
    ageAppropriate: ['middle', 'high', 'university'],
    contentUrl: '/audio/meditation-5min.mp3',
  },
  {
    id: 'study-music',
    type: 'music',
    title: '집중력 향상 음악',
    description: '공부할 때 집중력을 높여주는 Lo-Fi 음악',
    duration: 30,
    effectiveness: 70,
    ageAppropriate: ['middle', 'high', 'university'],
    contentUrl: '/audio/lofi-study.mp3',
  },
  {
    id: 'desk-stretching',
    type: 'stretching',
    title: '책상 스트레칭',
    description: '앉은 자세에서 할 수 있는 간단한 스트레칭',
    duration: 5,
    effectiveness: 72,
    ageAppropriate: ['elementary', 'middle', 'high', 'university'],
    steps: [
      '목을 좌우로 천천히 돌립니다 (각 10초)',
      '어깨를 위로 올렸다 떨어뜨립니다 (5회)',
      '손목을 돌립니다 (각 방향 10회)',
      '허리를 좌우로 비틀어줍니다 (각 10초)',
      '일어서서 기지개를 켭니다',
    ],
  },
  {
    id: 'nature-sounds',
    type: 'nature_sounds',
    title: '숲속 소리',
    description: '마음을 편안하게 하는 자연의 소리',
    duration: 15,
    effectiveness: 68,
    ageAppropriate: ['elementary', 'middle', 'high', 'university'],
    contentUrl: '/audio/forest-sounds.mp3',
  },
  {
    id: 'quick-game',
    type: 'gaming',
    title: '2분 퍼즐 게임',
    description: '짧은 휴식으로 머리를 환기하는 간단한 게임',
    duration: 2,
    effectiveness: 60,
    ageAppropriate: ['elementary', 'middle'],
    contentUrl: '/games/puzzle-break',
  },
  {
    id: 'gratitude-journal',
    type: 'journaling',
    title: '감사 일기',
    description: '오늘 감사한 3가지를 적어보는 활동',
    duration: 5,
    effectiveness: 78,
    ageAppropriate: ['high', 'university'],
    steps: [
      '오늘 있었던 좋은 일 3가지를 떠올려보세요',
      '각각에 대해 왜 감사한지 적어보세요',
      '이 감정을 잠시 느껴보세요',
    ],
  },
];

// ============================================
// AI STRESS COACH CLASS
// ============================================

export class AIStressCoach {
  private studentProfile: StudentProfile | null = null;
  private interventionHistory: Map<string, { count: number; avgEffectiveness: number }> = new Map();

  /**
   * Initialize coach with student profile
   */
  initialize(profile: StudentProfile): void {
    this.studentProfile = profile;
  }

  /**
   * Analyze current stress level from bio-signals
   */
  analyzeStress(
    cortisol: number,
    heartRate: number,
    hrv: number,
    sleepHours: number,
    recentExams?: ExamSchedule[]
  ): StressAnalysis {
    // Calculate stress score
    const { level, score } = this.calculateStressScore(cortisol, heartRate, hrv, sleepHours);
    
    // Analyze physical indicators
    const physicalIndicators = {
      cortisol: {
        value: cortisol,
        status: cortisol < 15 ? '정상' : cortisol < 25 ? '약간 높음' : '높음',
      },
      heartRate: {
        value: heartRate,
        status: heartRate < 80 ? '정상' : heartRate < 100 ? '약간 높음' : '높음',
      },
      hrv: {
        value: hrv,
        status: hrv > 50 ? '좋음' : hrv > 30 ? '보통' : '낮음 (스트레스 신호)',
      },
      sleepDebt: {
        hours: Math.max(0, 8 - sleepHours),
        impact: sleepHours >= 7 ? '없음' : sleepHours >= 5 ? '경미함' : '심각함',
      },
    };

    // Calculate mental indicators (simulated from bio-signals)
    const mentalIndicators = {
      anxietyScore: Math.min(100, (cortisol / 30) * 100),
      focusScore: Math.max(0, 100 - ((100 - hrv) * 1.5)),
      moodScore: Math.max(0, 100 - score * 0.8),
    };

    // Identify triggers
    const triggers = this.identifyTriggers(recentExams, sleepHours, cortisol);

    // Get personalized recommendations
    const recommendations = this.getRecommendations(level, triggers);

    // Check for urgent alert
    const urgentAlert = this.checkUrgentAlert(level, cortisol, sleepHours);

    return {
      currentLevel: level,
      score,
      physicalIndicators,
      mentalIndicators,
      triggers,
      recommendations,
      urgentAlert,
    };
  }

  /**
   * Start an intervention session
   */
  startIntervention(interventionId: string): {
    intervention: StressIntervention;
    personalizedMessage: string;
    timer: number;
  } | null {
    const intervention = STRESS_INTERVENTIONS.find(i => i.id === interventionId);
    if (!intervention) return null;

    const grade = this.studentProfile?.grade || 'high';
    const personalizedMessage = this.getPersonalizedMessage(intervention, grade);

    return {
      intervention,
      personalizedMessage,
      timer: intervention.duration * 60, // seconds
    };
  }

  /**
   * Record intervention outcome
   */
  recordOutcome(
    interventionId: string,
    preStressScore: number,
    postStressScore: number
  ): { effectiveness: number; feedback: string } {
    const improvement = preStressScore - postStressScore;
    const effectiveness = Math.min(100, Math.max(0, improvement * 2 + 50));

    // Update history
    const history = this.interventionHistory.get(interventionId) || { count: 0, avgEffectiveness: 0 };
    const newAvg = (history.avgEffectiveness * history.count + effectiveness) / (history.count + 1);
    this.interventionHistory.set(interventionId, {
      count: history.count + 1,
      avgEffectiveness: newAvg,
    });

    // Generate feedback
    let feedback: string;
    if (effectiveness >= 70) {
      feedback = '훌륭해요! 이 방법이 잘 맞는 것 같아요. 다음에도 활용해보세요.';
    } else if (effectiveness >= 40) {
      feedback = '조금 나아졌네요. 꾸준히 연습하면 더 효과가 좋아질 거예요.';
    } else {
      feedback = '이 방법은 잘 맞지 않는 것 같아요. 다른 방법을 시도해볼까요?';
    }

    return { effectiveness, feedback };
  }

  /**
   * Get exam preparation tips
   */
  getExamPrepTips(exam: ExamSchedule, daysUntil: number): string[] {
    const tips: string[] = [];
    const grade = this.studentProfile?.grade || 'high';

    if (daysUntil <= 1) {
      // D-Day or D-1
      tips.push('📚 새로운 내용보다는 복습에 집중하세요');
      tips.push('😴 충분한 수면이 기억력에 가장 중요해요 (최소 7시간)');
      tips.push('🍌 시험 전 바나나나 견과류로 가볍게 에너지를 충전하세요');
      tips.push('🧘 시험 직전 4-7-8 호흡법으로 긴장을 풀어보세요');
    } else if (daysUntil <= 7) {
      // 1주일 전
      tips.push('📝 핵심 개념 정리노트를 만들어보세요');
      tips.push('⏰ 하루 50분 공부 + 10분 휴식 패턴을 유지하세요');
      tips.push('🏃 매일 30분 가벼운 운동이 집중력을 높여줘요');
      tips.push('📱 공부 시간에는 스마트폰을 다른 방에 두세요');
    } else {
      // 1주일 이상
      tips.push('📅 일일 학습 계획을 세우고 체크리스트를 만드세요');
      tips.push('🎯 약한 과목에 더 많은 시간을 투자하세요');
      tips.push('👥 스터디 그룹으로 서로 가르쳐보세요 (가장 좋은 학습법!)');
      tips.push('🌙 일정한 수면 시간을 유지하세요');
    }

    // Grade-specific tips
    if (grade === 'elementary') {
      tips.push('🎮 열심히 공부하면 게임 시간을 보상으로 받을 수 있어요!');
    } else if (grade === 'university') {
      tips.push('☕ 카페인은 오후 2시 이후로는 피하세요 (수면 방해)');
    }

    return tips;
  }

  /**
   * Generate weekly stress report
   */
  generateWeeklyReport(records: StressRecord[]): {
    averageStressLevel: number;
    trend: 'improving' | 'stable' | 'worsening';
    peakStressTimes: string[];
    effectiveInterventions: string[];
    recommendations: string[];
  } {
    if (records.length === 0) {
      return {
        averageStressLevel: 0,
        trend: 'stable',
        peakStressTimes: [],
        effectiveInterventions: [],
        recommendations: ['이번 주 측정 기록이 없어요. 매일 한 번씩 스트레스 체크를 해보세요!'],
      };
    }

    // Calculate average
    const stressScores = records.map(r => this.levelToScore(r.level));
    const averageStressLevel = stressScores.reduce((a, b) => a + b, 0) / stressScores.length;

    // Determine trend
    const firstHalf = stressScores.slice(0, Math.floor(stressScores.length / 2));
    const secondHalf = stressScores.slice(Math.floor(stressScores.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    let trend: 'improving' | 'stable' | 'worsening';
    if (secondAvg < firstAvg - 10) trend = 'improving';
    else if (secondAvg > firstAvg + 10) trend = 'worsening';
    else trend = 'stable';

    // Find peak stress times
    const peakStressTimes = records
      .filter(r => r.level === 'high' || r.level === 'critical')
      .map(r => {
        const date = new Date(r.timestamp);
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}시`;
      });

    // Find effective interventions
    const effectiveInterventions = records
      .filter(r => r.intervention && r.outcome === 'improved')
      .map(r => r.intervention!)
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    // Generate recommendations
    const recommendations: string[] = [];
    if (trend === 'worsening') {
      recommendations.push('⚠️ 스트레스가 증가하고 있어요. 휴식 시간을 더 확보해보세요.');
    }
    if (averageStressLevel > 60) {
      recommendations.push('🧘 매일 아침 5분 명상으로 하루를 시작해보세요.');
    }
    if (peakStressTimes.length > 3) {
      recommendations.push('📊 스트레스가 자주 높아지네요. 선생님이나 부모님과 상담해보는 것도 좋아요.');
    }
    if (effectiveInterventions.length > 0) {
      recommendations.push(`✅ ${effectiveInterventions[0]}이(가) 효과적이었어요. 계속 활용해보세요!`);
    }

    return {
      averageStressLevel,
      trend,
      peakStressTimes,
      effectiveInterventions,
      recommendations,
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private calculateStressScore(
    cortisol: number,
    heartRate: number,
    hrv: number,
    sleepHours: number
  ): { level: StressLevel; score: number } {
    let score = 0;

    // Cortisol contribution (0-40)
    score += Math.min(40, (cortisol / 30) * 40);

    // Heart rate contribution (0-25)
    score += Math.min(25, Math.max(0, (heartRate - 60) / 40 * 25));

    // HRV contribution (0-20, inverse - lower is worse)
    score += Math.min(20, Math.max(0, (60 - hrv) / 60 * 20));

    // Sleep debt contribution (0-15)
    const sleepDebt = Math.max(0, 8 - sleepHours);
    score += Math.min(15, sleepDebt * 5);

    score = Math.min(100, Math.max(0, score));

    let level: StressLevel;
    if (score < 25) level = 'low';
    else if (score < 50) level = 'moderate';
    else if (score < 75) level = 'high';
    else level = 'critical';

    return { level, score };
  }

  private identifyTriggers(
    recentExams?: ExamSchedule[],
    sleepHours?: number,
    cortisol?: number
  ): string[] {
    const triggers: string[] = [];

    if (recentExams && recentExams.length > 0) {
      const upcomingExam = recentExams.find(e => {
        const daysUntil = Math.ceil((new Date(e.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 3 && daysUntil >= 0;
      });
      if (upcomingExam) {
        triggers.push(`다가오는 시험: ${upcomingExam.name}`);
      }
    }

    if (sleepHours && sleepHours < 6) {
      triggers.push('수면 부족');
    }

    if (cortisol && cortisol > 25) {
      triggers.push('높은 코르티솔 수치 (신체적 스트레스 반응)');
    }

    if (triggers.length === 0) {
      triggers.push('특별한 트리거 없음');
    }

    return triggers;
  }

  private getRecommendations(level: StressLevel, triggers: string[]): StressIntervention[] {
    const grade = this.studentProfile?.grade || 'high';
    
    // Filter by grade
    let available = STRESS_INTERVENTIONS.filter(i => i.ageAppropriate.includes(grade));

    // Sort by effectiveness and personal history
    available = available.sort((a, b) => {
      const aHistory = this.interventionHistory.get(a.id);
      const bHistory = this.interventionHistory.get(b.id);
      
      const aScore = aHistory ? aHistory.avgEffectiveness : a.effectiveness;
      const bScore = bHistory ? bHistory.avgEffectiveness : b.effectiveness;
      
      return bScore - aScore;
    });

    // Take top recommendations based on stress level
    const count = level === 'critical' ? 4 : level === 'high' ? 3 : 2;
    return available.slice(0, count);
  }

  private checkUrgentAlert(level: StressLevel, cortisol: number, sleepHours: number): string | undefined {
    if (level === 'critical' && cortisol > 30) {
      return '⚠️ 스트레스 수치가 매우 높아요. 지금 바로 휴식을 취하고, 필요하면 선생님이나 부모님께 도움을 요청하세요.';
    }
    
    if (sleepHours < 4) {
      return '😴 수면이 심각하게 부족해요. 오늘은 일찍 자는 것을 최우선으로 해주세요.';
    }

    return undefined;
  }

  private getPersonalizedMessage(intervention: StressIntervention, grade: StudentGrade): string {
    const messages: Record<StudentGrade, string> = {
      elementary: `자, ${intervention.title}을(를) 시작해볼까? 선생님이 도와줄게! 😊`,
      middle: `${intervention.title}을(를) 해볼 시간이야. ${intervention.duration}분만 투자해봐!`,
      high: `${intervention.title}로 잠시 리프레시하자. 공부 효율이 더 올라갈 거야.`,
      university: `${intervention.title}을(를) 추천드려요. ${intervention.duration}분 후 더 집중할 수 있을 거예요.`,
    };
    return messages[grade];
  }

  private levelToScore(level: StressLevel): number {
    const scores: Record<StressLevel, number> = {
      low: 20,
      moderate: 45,
      high: 70,
      critical: 90,
    };
    return scores[level];
  }
}

// Singleton instance
export const aiStressCoach = new AIStressCoach();




