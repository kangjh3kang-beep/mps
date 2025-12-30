/**
 * Health-to-Earn (H2E) Gamification System
 * Motivate users with points, streaks, and tier rewards
 */

/* ============================================
 * Types & Constants
 * ============================================ */

export type ActionType =
  | "daily_measurement"
  | "weekly_goal_met"
  | "data_share_doctor"
  | "first_measurement"
  | "streak_bonus"
  | "tier_upgrade"
  | "referral"
  | "survey_complete"
  | "appointment_complete"
  | "prescription_filled"
  | "product_review"
  | "mall_purchase" // Negative (spending)
  | "manual_adjustment";

export interface PointAction {
  type: ActionType;
  points: number;
  description: string;
  descriptionKo: string;
  /** Multiplier applied (e.g., 1.5x for streak bonus) */
  multiplier?: number;
  /** Cooldown in milliseconds (0 = no cooldown) */
  cooldownMs: number;
  /** Max times per day (0 = unlimited) */
  maxPerDay: number;
}

export const POINT_ACTIONS: Record<ActionType, PointAction> = {
  daily_measurement: {
    type: "daily_measurement",
    points: 10,
    description: "Daily Measurement",
    descriptionKo: "일일 측정",
    cooldownMs: 60 * 60 * 1000, // 1 hour minimum between measurements
    maxPerDay: 5
  },
  weekly_goal_met: {
    type: "weekly_goal_met",
    points: 100,
    description: "Weekly Goal Achieved",
    descriptionKo: "주간 목표 달성",
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // Once per week
    maxPerDay: 1
  },
  data_share_doctor: {
    type: "data_share_doctor",
    points: 50,
    description: "Shared Health Data with Doctor",
    descriptionKo: "의사와 건강 데이터 공유",
    cooldownMs: 0,
    maxPerDay: 3
  },
  first_measurement: {
    type: "first_measurement",
    points: 50,
    description: "First Measurement Bonus",
    descriptionKo: "첫 측정 보너스",
    cooldownMs: 0,
    maxPerDay: 1
  },
  streak_bonus: {
    type: "streak_bonus",
    points: 0, // Calculated dynamically
    description: "Streak Bonus",
    descriptionKo: "연속 측정 보너스",
    cooldownMs: 0,
    maxPerDay: 1
  },
  tier_upgrade: {
    type: "tier_upgrade",
    points: 200,
    description: "Tier Upgrade Bonus",
    descriptionKo: "등급 승급 보너스",
    cooldownMs: 0,
    maxPerDay: 1
  },
  referral: {
    type: "referral",
    points: 500,
    description: "Friend Referral",
    descriptionKo: "친구 추천",
    cooldownMs: 0,
    maxPerDay: 10
  },
  survey_complete: {
    type: "survey_complete",
    points: 25,
    description: "Survey Completed",
    descriptionKo: "설문 완료",
    cooldownMs: 0,
    maxPerDay: 5
  },
  appointment_complete: {
    type: "appointment_complete",
    points: 75,
    description: "Telemedicine Appointment Completed",
    descriptionKo: "원격진료 완료",
    cooldownMs: 0,
    maxPerDay: 2
  },
  prescription_filled: {
    type: "prescription_filled",
    points: 30,
    description: "Prescription Picked Up",
    descriptionKo: "처방전 수령",
    cooldownMs: 0,
    maxPerDay: 3
  },
  product_review: {
    type: "product_review",
    points: 20,
    description: "Product Review",
    descriptionKo: "상품 리뷰 작성",
    cooldownMs: 0,
    maxPerDay: 5
  },
  mall_purchase: {
    type: "mall_purchase",
    points: 0, // Variable (negative)
    description: "Mall Purchase",
    descriptionKo: "몰 구매",
    cooldownMs: 0,
    maxPerDay: 0
  },
  manual_adjustment: {
    type: "manual_adjustment",
    points: 0,
    description: "Manual Adjustment",
    descriptionKo: "수동 조정",
    cooldownMs: 0,
    maxPerDay: 0
  }
};

/* ============================================
 * Tier System
 * ============================================ */

export type TierId = "bronze" | "silver" | "gold" | "diamond";

export interface Tier {
  id: TierId;
  name: string;
  nameKo: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  /** Minimum lifetime points to reach this tier */
  minPoints: number;
  /** Streak multiplier for this tier */
  streakMultiplier: number;
  /** Mall discount percentage */
  mallDiscountPct: number;
  /** Exclusive perks */
  perks: string[];
  perksKo: string[];
}

export const TIERS: Record<TierId, Tier> = {
  bronze: {
    id: "bronze",
    name: "Bronze",
    nameKo: "브론즈",
    emoji: "🥉",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    minPoints: 0,
    streakMultiplier: 1.0,
    mallDiscountPct: 0,
    perks: ["Basic AI Coaching"],
    perksKo: ["기본 AI 코칭"]
  },
  silver: {
    id: "silver",
    name: "Silver",
    nameKo: "실버",
    emoji: "🥈",
    color: "text-slate-500",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-300",
    minPoints: 500,
    streakMultiplier: 1.2,
    mallDiscountPct: 5,
    perks: ["5% Mall Discount", "Priority Support"],
    perksKo: ["몰 5% 할인", "우선 지원"]
  },
  gold: {
    id: "gold",
    name: "Gold",
    nameKo: "골드",
    emoji: "🥇",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-300",
    minPoints: 2000,
    streakMultiplier: 1.5,
    mallDiscountPct: 10,
    perks: ["10% Mall Discount", "Premium AI Reports", "Early Access"],
    perksKo: ["몰 10% 할인", "프리미엄 AI 리포트", "얼리 액세스"]
  },
  diamond: {
    id: "diamond",
    name: "Diamond",
    nameKo: "다이아몬드",
    emoji: "💎",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-300",
    minPoints: 10000,
    streakMultiplier: 2.0,
    mallDiscountPct: 20,
    perks: ["20% Mall Discount", "Free Monthly Cartridge", "VIP Telemedicine", "Exclusive Products"],
    perksKo: ["몰 20% 할인", "월 무료 카트리지", "VIP 원격진료", "독점 상품"]
  }
};

export function getTierForPoints(lifetimePoints: number): Tier {
  if (lifetimePoints >= TIERS.diamond.minPoints) return TIERS.diamond;
  if (lifetimePoints >= TIERS.gold.minPoints) return TIERS.gold;
  if (lifetimePoints >= TIERS.silver.minPoints) return TIERS.silver;
  return TIERS.bronze;
}

export function getNextTier(currentTier: TierId): Tier | null {
  switch (currentTier) {
    case "bronze": return TIERS.silver;
    case "silver": return TIERS.gold;
    case "gold": return TIERS.diamond;
    case "diamond": return null;
  }
}

export function getProgressToNextTier(lifetimePoints: number): {
  currentTier: Tier;
  nextTier: Tier | null;
  pointsToNext: number;
  progressPct: number;
} {
  const currentTier = getTierForPoints(lifetimePoints);
  const nextTier = getNextTier(currentTier.id);

  if (!nextTier) {
    return { currentTier, nextTier: null, pointsToNext: 0, progressPct: 100 };
  }

  const pointsInCurrentTier = lifetimePoints - currentTier.minPoints;
  const tierRange = nextTier.minPoints - currentTier.minPoints;
  const progressPct = Math.min(100, Math.round((pointsInCurrentTier / tierRange) * 100));
  const pointsToNext = nextTier.minPoints - lifetimePoints;

  return { currentTier, nextTier, pointsToNext, progressPct };
}

/* ============================================
 * Streak System
 * ============================================ */

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // YYYY-MM-DD
  streakMultiplier: number;
  bonusPoints: number;
  isActive: boolean;
}

/**
 * Calculate streak info based on activity history
 */
export function calculateStreak(
  activityDates: string[], // Array of YYYY-MM-DD strings
  tierId: TierId
): StreakInfo {
  if (activityDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: "",
      streakMultiplier: 1.0,
      bonusPoints: 0,
      isActive: false
    };
  }

  // Sort dates descending
  const sortedDates = [...new Set(activityDates)].sort((a, b) => b.localeCompare(a));
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Check if streak is active (activity today or yesterday)
  const lastDate = sortedDates[0];
  const isActive = lastDate === today || lastDate === yesterday;

  // Calculate current streak
  let currentStreak = 0;
  if (isActive) {
    currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = currentStreak;
  let tempStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // Calculate streak multiplier
  const tierMultiplier = TIERS[tierId].streakMultiplier;
  let baseMultiplier = 1.0;
  if (currentStreak >= 30) baseMultiplier = 2.0;
  else if (currentStreak >= 14) baseMultiplier = 1.75;
  else if (currentStreak >= 7) baseMultiplier = 1.5;
  else if (currentStreak >= 3) baseMultiplier = 1.25;

  const streakMultiplier = Math.min(3.0, baseMultiplier * tierMultiplier);

  // Streak bonus points
  let bonusPoints = 0;
  if (currentStreak === 7) bonusPoints = 50;
  else if (currentStreak === 14) bonusPoints = 100;
  else if (currentStreak === 30) bonusPoints = 250;
  else if (currentStreak === 100) bonusPoints = 1000;

  return {
    currentStreak,
    longestStreak,
    lastActivityDate: lastDate,
    streakMultiplier,
    bonusPoints,
    isActive
  };
}

/* ============================================
 * Point Ledger Types
 * ============================================ */

export interface PointTransaction {
  id: string;
  usedId: string;
  actionType: ActionType;
  points: number;
  multiplier: number;
  finalPoints: number;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string; // ISO timestamp
}

export interface UserPoints {
  userId: string;
  currentBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  tierId: TierId;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  transactions: PointTransaction[];
}

/* ============================================
 * Point Calculation
 * ============================================ */

export interface EarnPointsParams {
  actionType: ActionType;
  userId: string;
  currentPoints: UserPoints;
  metadata?: Record<string, unknown>;
  /** Override base points (for variable amounts like mall_purchase) */
  pointsOverride?: number;
}

export interface EarnPointsResult {
  success: boolean;
  transaction: PointTransaction | null;
  newBalance: number;
  error?: string;
  streakUpdated?: boolean;
  tierUpgraded?: boolean;
  newTier?: TierId;
}

/**
 * Calculate points to earn for an action
 */
export function calculateEarnedPoints(params: EarnPointsParams): EarnPointsResult {
  const { actionType, userId, currentPoints, metadata, pointsOverride } = params;
  const action = POINT_ACTIONS[actionType];

  // Check cooldown
  const now = Date.now();
  const today = new Date().toISOString().split("T")[0];

  // Count today's actions of this type
  const todayActions = currentPoints.transactions.filter(
    t => t.actionType === actionType && t.createdAt.startsWith(today)
  );

  if (action.maxPerDay > 0 && todayActions.length >= action.maxPerDay) {
    return {
      success: false,
      transaction: null,
      newBalance: currentPoints.currentBalance,
      error: `Maximum ${action.maxPerDay} ${actionType} actions per day`
    };
  }

  // Check cooldown
  if (action.cooldownMs > 0 && todayActions.length > 0) {
    const lastAction = todayActions[todayActions.length - 1];
    const lastActionTime = new Date(lastAction.createdAt).getTime();
    if (now - lastActionTime < action.cooldownMs) {
      const remainingMs = action.cooldownMs - (now - lastActionTime);
      const remainingMin = Math.ceil(remainingMs / 60000);
      return {
        success: false,
        transaction: null,
        newBalance: currentPoints.currentBalance,
        error: `Please wait ${remainingMin} minutes before next ${actionType}`
      };
    }
  }

  // Calculate points
  const basePoints = pointsOverride ?? action.points;
  const tier = TIERS[currentPoints.tierId];
  
  // Apply streak multiplier for measurement actions
  let multiplier = 1.0;
  if (actionType === "daily_measurement" || actionType === "weekly_goal_met") {
    const streakInfo = calculateStreak(
      currentPoints.transactions
        .filter(t => t.actionType === "daily_measurement")
        .map(t => t.createdAt.split("T")[0]),
      currentPoints.tierId
    );
    multiplier = streakInfo.streakMultiplier;
  }

  const finalPoints = Math.round(basePoints * multiplier);

  // Create transaction
  const transaction: PointTransaction = {
    id: `txn_${now}_${Math.random().toString(36).slice(2, 8)}`,
    usedId: userId,
    actionType,
    points: basePoints,
    multiplier,
    finalPoints,
    description: action.description,
    metadata,
    createdAt: new Date().toISOString()
  };

  // Calculate new balance
  const newBalance = currentPoints.currentBalance + finalPoints;
  const newLifetimeEarned = currentPoints.lifetimeEarned + (finalPoints > 0 ? finalPoints : 0);

  // Check tier upgrade
  const oldTier = getTierForPoints(currentPoints.lifetimeEarned);
  const newTier = getTierForPoints(newLifetimeEarned);
  const tierUpgraded = newTier.id !== oldTier.id;

  return {
    success: true,
    transaction,
    newBalance,
    streakUpdated: actionType === "daily_measurement",
    tierUpgraded,
    newTier: tierUpgraded ? newTier.id : undefined
  };
}

/**
 * Spend points (for Mall purchases)
 */
export function spendPoints(
  userId: string,
  amount: number,
  currentBalance: number,
  description: string,
  metadata?: Record<string, unknown>
): { success: boolean; transaction: PointTransaction | null; newBalance: number; error?: string } {
  if (amount <= 0) {
    return { success: false, transaction: null, newBalance: currentBalance, error: "Invalid amount" };
  }

  if (currentBalance < amount) {
    return { success: false, transaction: null, newBalance: currentBalance, error: "Insufficient points" };
  }

  const transaction: PointTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    usedId: userId,
    actionType: "mall_purchase",
    points: -amount,
    multiplier: 1,
    finalPoints: -amount,
    description,
    metadata,
    createdAt: new Date().toISOString()
  };

  return {
    success: true,
    transaction,
    newBalance: currentBalance - amount
  };
}

/* ============================================
 * Redemption Items
 * ============================================ */

export interface RedemptionItem {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  pointsCost: number;
  category: "cartridge" | "supplement" | "report" | "service" | "discount";
  imageUrl?: string;
  /** Minimum tier required */
  minTier?: TierId;
  /** If discount, percentage value */
  discountPct?: number;
  /** Stock (null = unlimited) */
  stock: number | null;
}

export const REDEMPTION_CATALOG: RedemptionItem[] = [
  {
    id: "redeem_cartridge_basic",
    name: "Basic Cartridge (5-pack)",
    nameKo: "기본 카트리지 (5개입)",
    description: "Standard measurement cartridge pack",
    descriptionKo: "표준 측정 카트리지 팩",
    pointsCost: 500,
    category: "cartridge",
    stock: null
  },
  {
    id: "redeem_cartridge_premium",
    name: "Premium Multi-Analyte Cartridge",
    nameKo: "프리미엄 멀티 분석 카트리지",
    description: "Measures Glucose, Lactate, and Ketone",
    descriptionKo: "혈당, 젖산, 케톤 동시 측정",
    pointsCost: 1500,
    category: "cartridge",
    minTier: "silver",
    stock: null
  },
  {
    id: "redeem_vitamin_pack",
    name: "Monthly Vitamin Pack",
    nameKo: "월간 비타민 팩",
    description: "Curated vitamins based on your health data",
    descriptionKo: "건강 데이터 기반 맞춤 비타민",
    pointsCost: 800,
    category: "supplement",
    stock: null
  },
  {
    id: "redeem_omega3",
    name: "Omega-3 Fish Oil (30 days)",
    nameKo: "오메가-3 피시오일 (30일분)",
    description: "High quality fish oil supplement",
    descriptionKo: "고품질 피시오일 보충제",
    pointsCost: 600,
    category: "supplement",
    stock: null
  },
  {
    id: "redeem_ai_report_basic",
    name: "AI Health Report",
    nameKo: "AI 건강 리포트",
    description: "Detailed analysis of your last 30 days",
    descriptionKo: "최근 30일 상세 분석 리포트",
    pointsCost: 300,
    category: "report",
    stock: null
  },
  {
    id: "redeem_ai_report_premium",
    name: "Premium AI Deep Analysis",
    nameKo: "프리미엄 AI 심층 분석",
    description: "6-month trend analysis with predictions",
    descriptionKo: "6개월 트렌드 분석 및 예측",
    pointsCost: 1000,
    category: "report",
    minTier: "gold",
    stock: null
  },
  {
    id: "redeem_telemedicine",
    name: "Free Telemedicine Session",
    nameKo: "무료 원격진료",
    description: "30-minute consultation with a doctor",
    descriptionKo: "30분 의사 상담",
    pointsCost: 2000,
    category: "service",
    minTier: "silver",
    stock: null
  },
  {
    id: "redeem_discount_10",
    name: "10% Mall Discount Coupon",
    nameKo: "몰 10% 할인 쿠폰",
    description: "One-time 10% off on next purchase",
    descriptionKo: "다음 구매 1회 10% 할인",
    pointsCost: 200,
    category: "discount",
    discountPct: 10,
    stock: null
  },
  {
    id: "redeem_discount_25",
    name: "25% Mall Discount Coupon",
    nameKo: "몰 25% 할인 쿠폰",
    description: "One-time 25% off on next purchase",
    descriptionKo: "다음 구매 1회 25% 할인",
    pointsCost: 750,
    category: "discount",
    discountPct: 25,
    minTier: "gold",
    stock: null
  }
];

/**
 * Get available redemption items for a user's tier
 */
export function getAvailableRedemptions(tierId: TierId, balance: number): RedemptionItem[] {
  const tierOrder: TierId[] = ["bronze", "silver", "gold", "diamond"];
  const userTierIndex = tierOrder.indexOf(tierId);

  return REDEMPTION_CATALOG.filter(item => {
    // Check tier requirement
    if (item.minTier) {
      const requiredTierIndex = tierOrder.indexOf(item.minTier);
      if (userTierIndex < requiredTierIndex) return false;
    }
    // Check stock
    if (item.stock !== null && item.stock <= 0) return false;
    return true;
  });
}

/**
 * Check if user can afford an item
 */
export function canAfford(balance: number, item: RedemptionItem): boolean {
  return balance >= item.pointsCost;
}






