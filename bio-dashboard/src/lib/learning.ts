/**
 * Bio-Growth Engine - Learning & Adaptation Module
 * 
 * Part 5 Section 5.2: Federated Learning Simulation
 * Part 5 Section 7.2: Coaching Quality & Adaptive Coaching
 */

/* ============================================
 * 1. Feedback System (Reinforcement Learning Signal)
 * ============================================
 */

export type FeedbackType = "positive" | "negative";

export interface FeedbackEntry {
  id: string;
  messageId: string;
  feedbackType: FeedbackType;
  timestamp: number;
  context?: {
    question: string;
    response: string;
    healthScore: number;
    concentration: number;
  };
}

/**
 * In-Memory Feedback Store
 * 실제로는 DB나 API로 전송
 */
class FeedbackStore {
  private feedbacks: FeedbackEntry[] = [];
  private listeners: ((feedback: FeedbackEntry) => void)[] = [];

  add(feedback: FeedbackEntry): void {
    this.feedbacks.push(feedback);
    console.log(`[Learning] Feedback received: ${feedback.feedbackType} for message ${feedback.messageId}`);
    console.log(`[Learning] Weight updated based on feedback: ${feedback.feedbackType === "positive" ? "+0.1" : "-0.1"}`);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(feedback));
  }

  getRecent(count = 10): FeedbackEntry[] {
    return this.feedbacks.slice(-count);
  }

  getPositiveRate(): number {
    if (this.feedbacks.length === 0) return 0.5;
    const positive = this.feedbacks.filter(f => f.feedbackType === "positive").length;
    return positive / this.feedbacks.length;
  }

  /**
   * 특정 유형의 응답에 대한 피드백 패턴 분석
   */
  analyzePattern(keyword: string): { positive: number; negative: number; total: number } {
    const relevant = this.feedbacks.filter(f => 
      f.context?.response.toLowerCase().includes(keyword.toLowerCase())
    );
    const positive = relevant.filter(f => f.feedbackType === "positive").length;
    const negative = relevant.filter(f => f.feedbackType === "negative").length;
    return { positive, negative, total: relevant.length };
  }

  onFeedback(listener: (feedback: FeedbackEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  get length(): number {
    return this.feedbacks.length;
  }
}

export const feedbackStore = new FeedbackStore();

/* ============================================
 * 2. Federated Learning Simulation
 * ============================================
 * Part 5 Section 5.2: 로컬에서 모델 학습, 가중치만 전송
 */

export interface LocalModelWeights {
  healthScoreOffset: number;
  concentrationSensitivity: number;
  variabilityWeight: number;
  lastUpdated: number;
}

/**
 * 기본 모델 가중치
 */
const DEFAULT_WEIGHTS: LocalModelWeights = {
  healthScoreOffset: 0,
  concentrationSensitivity: 1.0,
  variabilityWeight: 1.0,
  lastUpdated: Date.now()
};

/**
 * Federated Learning Manager
 */
class FederatedLearningManager {
  private weights: LocalModelWeights = { ...DEFAULT_WEIGHTS };
  private trainingHistory: { timestamp: number; delta: Partial<LocalModelWeights> }[] = [];
  private isTraining = false;

  /**
   * 로컬 모델 학습 (시뮬레이션)
   * 최근 측정 데이터를 기반으로 가중치 조정
   */
  async trainLocal(measurements: { concentration: number; healthScore: number }[]): Promise<{
    success: boolean;
    newWeights: LocalModelWeights;
    log: string[];
  }> {
    if (this.isTraining) {
      return { success: false, newWeights: this.weights, log: ["Training already in progress"] };
    }

    if (measurements.length < 3) {
      return { success: false, newWeights: this.weights, log: ["Not enough data for training (min 3)"] };
    }

    this.isTraining = true;
    const log: string[] = [];

    try {
      log.push(`[FL] Starting local model training with ${measurements.length} samples...`);

      // 1. 데이터 분석
      const concentrations = measurements.map(m => m.concentration);
      const healthScores = measurements.map(m => m.healthScore);
      
      const avgConc = concentrations.reduce((a, b) => a + b, 0) / concentrations.length;
      const avgScore = healthScores.reduce((a, b) => a + b, 0) / healthScores.length;
      
      const variance = concentrations.reduce((acc, c) => acc + Math.pow(c - avgConc, 2), 0) / concentrations.length;
      const std = Math.sqrt(variance);

      log.push(`[FL] Data analysis: avg_conc=${avgConc.toFixed(2)}, avg_score=${avgScore.toFixed(0)}, std=${std.toFixed(3)}`);

      // 2. 가중치 업데이트 (시뮬레이션)
      // 실제로는 gradient descent 등의 알고리즘 사용
      const delta: Partial<LocalModelWeights> = {
        healthScoreOffset: (avgScore > 70 ? 0.5 : -0.5) * Math.random() * 0.1,
        concentrationSensitivity: 1.0 + (std > 0.3 ? -0.05 : 0.05),
        variabilityWeight: 1.0 + (std > 0.5 ? 0.1 : -0.05)
      };

      this.weights = {
        healthScoreOffset: this.weights.healthScoreOffset + (delta.healthScoreOffset ?? 0),
        concentrationSensitivity: Math.max(0.5, Math.min(1.5, this.weights.concentrationSensitivity + (delta.concentrationSensitivity ?? 0) - 1)),
        variabilityWeight: Math.max(0.5, Math.min(1.5, this.weights.variabilityWeight + (delta.variabilityWeight ?? 0) - 1)),
        lastUpdated: Date.now()
      };

      this.trainingHistory.push({ timestamp: Date.now(), delta });

      log.push(`[FL] Weights updated: offset=${this.weights.healthScoreOffset.toFixed(3)}, sensitivity=${this.weights.concentrationSensitivity.toFixed(3)}`);
      log.push(`[FL] Local model updated. Sending weights to cloud...`);
      log.push(`[FL] ✓ No raw data sent, only model weights (privacy preserved)`);

      // 시뮬레이션: 클라우드 동기화 지연
      await new Promise(resolve => setTimeout(resolve, 100));

      log.push(`[FL] Cloud sync complete. Global model aggregation scheduled.`);

      return { success: true, newWeights: this.weights, log };
    } finally {
      this.isTraining = false;
    }
  }

  getWeights(): LocalModelWeights {
    return { ...this.weights };
  }

  getTrainingHistory(): typeof this.trainingHistory {
    return [...this.trainingHistory];
  }

  /**
   * 조정된 건강 점수 계산
   */
  computeAdjustedHealthScore(baseScore: number, concentration: number, std: number): number {
    const adjusted = baseScore 
      + this.weights.healthScoreOffset 
      - (concentration * (this.weights.concentrationSensitivity - 1) * 5)
      - (std * this.weights.variabilityWeight * 2);
    
    return Math.max(0, Math.min(100, Math.round(adjusted)));
  }
}

export const federatedLearning = new FederatedLearningManager();

/* ============================================
 * 3. Adaptive Coaching System
 * ============================================
 * Part 5 Section 7.2: Dynamic Personality & Strategy
 */

export type CoachingPersonality = "gentle" | "balanced" | "serious";

export interface CoachingState {
  personality: CoachingPersonality;
  ignoredAdviceCount: number;
  lastAdviceType: string | null;
  lastAdviceTimestamp: number | null;
  userEngagementScore: number; // 0-100
  strategyHistory: { timestamp: number; personality: CoachingPersonality; reason: string }[];
}

/**
 * Adaptive Coaching Manager
 */
class AdaptiveCoachingManager {
  private state: CoachingState = {
    personality: "balanced",
    ignoredAdviceCount: 0,
    lastAdviceType: null,
    lastAdviceTimestamp: null,
    userEngagementScore: 50,
    strategyHistory: []
  };

  private readonly IGNORED_THRESHOLD = 3; // 3회 무시 시 전략 변경

  /**
   * 조언 제공 기록
   */
  recordAdvice(adviceType: string): void {
    this.state.lastAdviceType = adviceType;
    this.state.lastAdviceTimestamp = Date.now();
    console.log(`[Coaching] Advice recorded: ${adviceType}`);
  }

  /**
   * 사용자 반응 기록
   */
  recordUserResponse(responded: boolean, feedbackType?: FeedbackType): void {
    if (!responded || feedbackType === "negative") {
      this.state.ignoredAdviceCount++;
      this.state.userEngagementScore = Math.max(0, this.state.userEngagementScore - 10);
      console.log(`[Coaching] Advice ignored. Count: ${this.state.ignoredAdviceCount}`);
    } else {
      this.state.ignoredAdviceCount = Math.max(0, this.state.ignoredAdviceCount - 1);
      this.state.userEngagementScore = Math.min(100, this.state.userEngagementScore + 5);
    }

    this.updatePersonality();
  }

  /**
   * 피드백 기반 전략 업데이트
   */
  private updatePersonality(): void {
    const previousPersonality = this.state.personality;
    
    if (this.state.ignoredAdviceCount >= this.IGNORED_THRESHOLD) {
      // 조언을 계속 무시하면 심각한 톤으로 변경
      this.state.personality = "serious";
    } else if (this.state.userEngagementScore > 70) {
      this.state.personality = "gentle";
    } else if (this.state.userEngagementScore < 30) {
      this.state.personality = "serious";
    } else {
      this.state.personality = "balanced";
    }

    if (previousPersonality !== this.state.personality) {
      const reason = `Ignored count: ${this.state.ignoredAdviceCount}, Engagement: ${this.state.userEngagementScore}`;
      this.state.strategyHistory.push({
        timestamp: Date.now(),
        personality: this.state.personality,
        reason
      });
      console.log(`[Coaching] Strategy changed: ${previousPersonality} → ${this.state.personality} (${reason})`);
    }
  }

  /**
   * 현재 성격에 맞는 응답 생성
   */
  enhanceResponse(baseResponse: string, adviceType: string): string {
    this.recordAdvice(adviceType);

    switch (this.state.personality) {
      case "gentle":
        return this.applyGentleStyle(baseResponse);
      case "serious":
        return this.applySeriousStyle(baseResponse);
      default:
        return baseResponse;
    }
  }

  private applyGentleStyle(response: string): string {
    // 부드러운 톤 추가
    const prefixes = [
      "참고로, ",
      "가볍게 제안드리자면, ",
      "여유가 되실 때, "
    ];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return prefix + response.charAt(0).toLowerCase() + response.slice(1);
  }

  private applySeriousStyle(response: string): string {
    // 심각한 톤으로 변경
    const isRestAdvice = response.includes("휴식") || response.includes("쉬") || response.includes("rest");
    
    if (isRestAdvice) {
      return `⚠️ 중요: ${response}\n\n이전에 드린 조언들이 계속 무시되고 있어 우려됩니다. 건강을 위해 꼭 휴식을 취해주세요.`;
    }
    
    return `📢 주의: ${response}`;
  }

  getState(): CoachingState {
    return { ...this.state };
  }

  getPersonality(): CoachingPersonality {
    return this.state.personality;
  }

  /**
   * 조언 무시 횟수 리셋 (사용자가 조언을 따랐을 때)
   */
  resetIgnoredCount(): void {
    this.state.ignoredAdviceCount = 0;
    this.updatePersonality();
  }
}

export const adaptiveCoaching = new AdaptiveCoachingManager();

/* ============================================
 * 4. Learning Engine Integration
 * ============================================
 */

export interface LearningEngineStatus {
  feedbackCount: number;
  positiveRate: number;
  modelWeights: LocalModelWeights;
  coachingPersonality: CoachingPersonality;
  userEngagement: number;
}

export function getLearningEngineStatus(): LearningEngineStatus {
  return {
    feedbackCount: feedbackStore.length,
    positiveRate: feedbackStore.getPositiveRate(),
    modelWeights: federatedLearning.getWeights(),
    coachingPersonality: adaptiveCoaching.getPersonality(),
    userEngagement: adaptiveCoaching.getState().userEngagementScore
  };
}






