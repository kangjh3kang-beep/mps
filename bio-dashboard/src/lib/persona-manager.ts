/**
 * Multi-Persona Consilium System
 * 5 AI Personas that provide specialized advice based on health data context
 */

import type { ChatContext } from "@/components/dashboard/AICoachChat";
import type { HealthGoal } from "@/lib/profile";

/* ============================================
 * Persona Definitions
 * ============================================ */

export type PersonaId = "doctor" | "trainer" | "nutritionist" | "counselor" | "secretary";

export interface Persona {
  id: PersonaId;
  name: string;
  nameKo: string;
  emoji: string;
  color: string; // Tailwind color class
  bgColor: string;
  borderColor: string;
  specialty: string;
  specialtyKo: string;
  greeting: string;
  greetingKo: string;
  /** Data types this persona analyzes */
  analyzes: string[];
  /** Keywords that trigger this persona */
  keywords: string[];
}

export const PERSONAS: Record<PersonaId, Persona> = {
  doctor: {
    id: "doctor",
    name: "Dr. AI",
    nameKo: "Dr. AI",
    emoji: "🩺",
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    specialty: "Diagnosis & Medication",
    specialtyKo: "진단 및 처방",
    greeting: "Hello! I'm Dr. AI. I analyze your sensor data for clinical insights.",
    greetingKo: "안녕하세요! Dr. AI입니다. 센서 데이터를 분석하여 임상적 인사이트를 제공합니다.",
    analyzes: ["CV", "EIS", "Bioimpedance", "Anomaly"],
    keywords: ["진단", "처방", "병원", "약", "증상", "질병", "diagnosis", "medication", "hospital", "symptom", "disease", "doctor"]
  },
  trainer: {
    id: "trainer",
    name: "AI Trainer",
    nameKo: "AI 트레이너",
    emoji: "💪",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    specialty: "Fitness & Recovery",
    specialtyKo: "운동 및 회복",
    greeting: "Hey! I'm your AI Trainer. Let's optimize your workout based on your lactate levels!",
    greetingKo: "안녕하세요! AI 트레이너입니다. 젖산 수치를 분석하여 최적의 운동 계획을 세워드릴게요!",
    analyzes: ["Lactate", "Muscle Recovery", "Heart Rate", "VO2"],
    keywords: ["운동", "트레이닝", "피로", "회복", "근육", "웨이트", "러닝", "exercise", "workout", "fatigue", "recovery", "muscle", "training", "leg day", "rest day"]
  },
  nutritionist: {
    id: "nutritionist",
    name: "AI Nutritionist",
    nameKo: "AI 영양사",
    emoji: "🥗",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    specialty: "Diet & Metabolism",
    specialtyKo: "식단 및 대사",
    greeting: "Hi there! I'm your AI Nutritionist. Let me help you eat smarter based on your glucose levels.",
    greetingKo: "안녕하세요! AI 영양사입니다. 혈당 수치를 바탕으로 똑똑한 식단을 추천해드릴게요.",
    analyzes: ["Glucose", "Ketone", "HbA1c", "Cholesterol"],
    keywords: ["음식", "식단", "혈당", "당", "탄수화물", "단백질", "지방", "칼로리", "다이어트", "food", "diet", "glucose", "sugar", "carb", "protein", "calorie", "meal", "eat", "nutrition"]
  },
  counselor: {
    id: "counselor",
    name: "AI Counselor",
    nameKo: "AI 상담사",
    emoji: "🧘",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    specialty: "Mental Wellness",
    specialtyKo: "정신 건강",
    greeting: "Hello. I'm your AI Counselor. Let's take a moment to check in with your mental wellbeing.",
    greetingKo: "안녕하세요. AI 상담사입니다. 잠시 멈추고 마음 건강을 살펴볼까요?",
    analyzes: ["Cortisol", "HRV", "Sleep", "Stress"],
    keywords: ["스트레스", "불안", "우울", "수면", "명상", "마음", "정신", "stress", "anxiety", "depression", "sleep", "meditation", "mental", "relax", "calm", "breathe"]
  },
  secretary: {
    id: "secretary",
    name: "AI Secretary",
    nameKo: "AI 비서",
    emoji: "📋",
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    specialty: "Scheduling & Reminders",
    specialtyKo: "일정 및 알림",
    greeting: "Hello! I'm your AI Secretary. I'll help you manage appointments and medication reminders.",
    greetingKo: "안녕하세요! AI 비서입니다. 병원 예약과 약 복용 알림을 관리해드릴게요.",
    analyzes: ["Appointments", "Medications", "Calendar"],
    keywords: ["예약", "일정", "알림", "약", "복용", "시간", "언제", "appointment", "schedule", "reminder", "pill", "medication", "when", "book", "calendar"]
  }
};

/* ============================================
 * Extended Context for Multi-Persona
 * ============================================ */

export interface MultiPersonaContext extends ChatContext {
  // Glucose (from sensor or mock)
  glucoseLevel?: number; // mg/dL
  // Ketone (mock)
  ketoneLevel?: number; // mmol/L
  // Cortisol (mock stress indicator)
  cortisolLevel?: number; // μg/dL (normal: 6-23)
  // Heart Rate Variability (mock)
  hrvMs?: number; // milliseconds
  // Sleep score (mock)
  sleepScore?: number; // 0-100
  // Upcoming appointments count
  upcomingAppointments?: number;
  // Pending medication reminders
  pendingMedReminders?: number;
}

/* ============================================
 * Auto-Assignment Logic
 * ============================================ */

export interface PersonaRecommendation {
  persona: PersonaId;
  reason: string;
  reasonKo: string;
  priority: number; // Higher = more urgent
}

/**
 * Analyze the current health context and recommend which persona should speak.
 * Returns recommendations sorted by priority (highest first).
 */
export function getPersonaRecommendations(ctx: MultiPersonaContext): PersonaRecommendation[] {
  const recommendations: PersonaRecommendation[] = [];

  // Lactate high → Trainer
  if (ctx.currentConcentration > 2.5) {
    recommendations.push({
      persona: "trainer",
      reason: `Lactate is elevated (${ctx.currentConcentration.toFixed(1)} mmol/L). Recovery advice needed.`,
      reasonKo: `젖산 수치가 높습니다 (${ctx.currentConcentration.toFixed(1)} mmol/L). 회복 조언이 필요해요.`,
      priority: ctx.currentConcentration > 4 ? 90 : 70
    });
  }

  // Glucose high → Nutritionist
  if (ctx.glucoseLevel !== undefined && ctx.glucoseLevel > 140) {
    recommendations.push({
      persona: "nutritionist",
      reason: `Glucose spike detected (${ctx.glucoseLevel} mg/dL). Diet adjustment suggested.`,
      reasonKo: `혈당 스파이크 감지 (${ctx.glucoseLevel} mg/dL). 식단 조절을 권장합니다.`,
      priority: ctx.glucoseLevel > 180 ? 95 : 75
    });
  }

  // Low health score → Doctor
  if (ctx.currentHealthScore < 50) {
    recommendations.push({
      persona: "doctor",
      reason: `Health score is critically low (${ctx.currentHealthScore}). Medical attention may be needed.`,
      reasonKo: `건강 점수가 매우 낮습니다 (${ctx.currentHealthScore}). 의료 상담이 필요할 수 있어요.`,
      priority: 100
    });
  } else if (ctx.currentHealthScore < 70) {
    recommendations.push({
      persona: "doctor",
      reason: `Health score is below normal (${ctx.currentHealthScore}). Let me analyze your data.`,
      reasonKo: `건강 점수가 정상 이하입니다 (${ctx.currentHealthScore}). 데이터를 분석해볼게요.`,
      priority: 60
    });
  }

  // High cortisol or low sleep → Counselor
  if (ctx.cortisolLevel !== undefined && ctx.cortisolLevel > 23) {
    recommendations.push({
      persona: "counselor",
      reason: `Stress markers are elevated (Cortisol: ${ctx.cortisolLevel} μg/dL). Let's work on relaxation.`,
      reasonKo: `스트레스 지표가 높습니다 (코르티솔: ${ctx.cortisolLevel} μg/dL). 이완 방법을 알려드릴게요.`,
      priority: 80
    });
  }
  if (ctx.sleepScore !== undefined && ctx.sleepScore < 50) {
    recommendations.push({
      persona: "counselor",
      reason: `Sleep quality is poor (Score: ${ctx.sleepScore}). Mental wellness check recommended.`,
      reasonKo: `수면 품질이 낮습니다 (점수: ${ctx.sleepScore}). 정신 건강 체크를 권장해요.`,
      priority: 65
    });
  }

  // Pending appointments or meds → Secretary
  if (ctx.upcomingAppointments !== undefined && ctx.upcomingAppointments > 0) {
    recommendations.push({
      persona: "secretary",
      reason: `You have ${ctx.upcomingAppointments} upcoming appointment(s). Need a reminder?`,
      reasonKo: `예정된 진료가 ${ctx.upcomingAppointments}건 있어요. 알림이 필요하신가요?`,
      priority: 40
    });
  }
  if (ctx.pendingMedReminders !== undefined && ctx.pendingMedReminders > 0) {
    recommendations.push({
      persona: "secretary",
      reason: `${ctx.pendingMedReminders} medication reminder(s) pending.`,
      reasonKo: `${ctx.pendingMedReminders}건의 약 복용 알림이 있어요.`,
      priority: 50
    });
  }

  // Sort by priority (descending)
  recommendations.sort((a, b) => b.priority - a.priority);

  return recommendations;
}

/**
 * Select the best persona based on user input keywords.
 */
export function selectPersonaByKeywords(text: string): PersonaId | null {
  const t = text.toLowerCase();

  for (const persona of Object.values(PERSONAS)) {
    for (const keyword of persona.keywords) {
      if (t.includes(keyword.toLowerCase())) {
        return persona.id;
      }
    }
  }

  return null;
}

/**
 * Get the primary recommended persona (or default to doctor).
 */
export function getPrimaryPersona(ctx: MultiPersonaContext, userInput?: string): PersonaId {
  // First, check if user explicitly mentions a topic
  if (userInput) {
    const keywordMatch = selectPersonaByKeywords(userInput);
    if (keywordMatch) return keywordMatch;
  }

  // Otherwise, auto-assign based on data
  const recommendations = getPersonaRecommendations(ctx);
  if (recommendations.length > 0) {
    return recommendations[0].persona;
  }

  // Default to doctor
  return "doctor";
}

/* ============================================
 * Persona-Specific Response Generation
 * ============================================ */

export interface PersonaResponse {
  persona: Persona;
  text: string;
  suggestion?: string;
}

/**
 * Generate a persona-specific response based on context and question.
 */
export function generatePersonaResponse(
  personaId: PersonaId,
  question: string,
  ctx: MultiPersonaContext,
  locale: "ko" | "en" = "ko"
): PersonaResponse {
  const persona = PERSONAS[personaId];
  const q = question.toLowerCase();
  const isKo = locale === "ko";

  let text: string;
  let suggestion: string | undefined;

  switch (personaId) {
    case "doctor":
      text = generateDoctorResponse(q, ctx, isKo);
      break;
    case "trainer":
      text = generateTrainerResponse(q, ctx, isKo);
      break;
    case "nutritionist":
      text = generateNutritionistResponse(q, ctx, isKo);
      break;
    case "counselor":
      text = generateCounselorResponse(q, ctx, isKo);
      break;
    case "secretary":
      text = generateSecretaryResponse(q, ctx, isKo);
      break;
    default:
      text = isKo ? "무엇을 도와드릴까요?" : "How can I help you?";
  }

  return { persona, text, suggestion };
}

function generateDoctorResponse(q: string, ctx: MultiPersonaContext, isKo: boolean): string {
  const { currentHealthScore, currentConcentration } = ctx;

  if (currentHealthScore < 50) {
    return isKo
      ? `🩺 건강 점수가 ${currentHealthScore}점으로 낮습니다. 최근 측정된 바이오마커를 분석한 결과, 이상 패턴이 감지되었어요. 증상이 지속되면 병원 방문을 권장합니다. 지금 바로 원격 진료를 예약해 드릴까요?`
      : `🩺 Your health score is low (${currentHealthScore}). Based on recent biomarker analysis, I've detected abnormal patterns. If symptoms persist, I recommend a hospital visit. Would you like me to book a telemedicine appointment?`;
  }

  if (currentConcentration > 3) {
    return isKo
      ? `🩺 센서 데이터 분석 결과, 젖산 수치가 ${currentConcentration.toFixed(1)} mmol/L로 높게 나타났습니다. CV/EIS 패턴을 확인한 결과, 대사 스트레스 징후가 보여요. 충분한 휴식과 수분 섭취를 권장합니다.`
      : `🩺 Sensor analysis shows elevated lactate (${currentConcentration.toFixed(1)} mmol/L). CV/EIS patterns indicate metabolic stress. Rest and hydration are recommended.`;
  }

  return isKo
    ? `🩺 현재 건강 점수는 ${currentHealthScore}점으로 양호합니다. 센서 데이터에서 특이사항은 발견되지 않았어요. 궁금한 증상이 있으시면 말씀해 주세요.`
    : `🩺 Your health score is ${currentHealthScore}, which is good. No anomalies detected in sensor data. Let me know if you have any symptoms to discuss.`;
}

function generateTrainerResponse(q: string, ctx: MultiPersonaContext, isKo: boolean): string {
  const { currentConcentration, currentHealthScore } = ctx;

  // Check for workout-related questions
  const isWorkoutQuestion = q.includes("운동") || q.includes("workout") || q.includes("leg") || q.includes("다리");

  if (currentConcentration > 4) {
    return isKo
      ? `💪 젖산 수치가 ${currentConcentration.toFixed(1)} mmol/L로 매우 높아요! 오늘은 무조건 Rest Day입니다. 가벼운 스트레칭이나 산책 정도만 권장해요. 무리하면 오버트레이닝 위험이 있어요.`
      : `💪 Lactate is very high (${currentConcentration.toFixed(1)} mmol/L)! Today is definitely a Rest Day. Only light stretching or walking recommended. Pushing harder risks overtraining.`;
  }

  if (currentConcentration > 2.5) {
    return isKo
      ? `💪 젖산 수치가 ${currentConcentration.toFixed(1)} mmol/L로 다소 높습니다. 오늘은 가벼운 유산소나 상체 위주로 진행하고, 하체 고강도는 내일로 미루는 게 좋겠어요.`
      : `💪 Lactate is elevated (${currentConcentration.toFixed(1)} mmol/L). I suggest light cardio or upper body today. Save the intense leg workout for tomorrow.`;
  }

  if (isWorkoutQuestion) {
    return isKo
      ? `💪 젖산 수치 ${currentConcentration.toFixed(1)} mmol/L, 회복 상태 양호! Leg Day OK입니다. 스쿼트, 런지, 레그프레스 등 고강도 하체 운동을 진행해도 좋아요. 세트 사이 휴식은 2-3분으로!`
      : `💪 Lactate at ${currentConcentration.toFixed(1)} mmol/L, recovery looks good! Leg Day is OK. Go ahead with squats, lunges, leg press. Rest 2-3 minutes between sets!`;
  }

  return isKo
    ? `💪 현재 젖산 ${currentConcentration.toFixed(1)} mmol/L, 건강 점수 ${currentHealthScore}점입니다. 오늘 운동 계획이 어떻게 되세요? 운동 종류에 따른 맞춤 조언을 드릴게요!`
    : `💪 Current lactate: ${currentConcentration.toFixed(1)} mmol/L, health score: ${currentHealthScore}. What's your workout plan today? I can give tailored advice!`;
}

function generateNutritionistResponse(q: string, ctx: MultiPersonaContext, isKo: boolean): string {
  const glucose = ctx.glucoseLevel ?? 100;
  const ketone = ctx.ketoneLevel ?? 0.1;

  if (glucose > 180) {
    return isKo
      ? `🥗 혈당이 ${glucose} mg/dL로 매우 높아요! 다음 식사는 저GI 식품 위주로 구성하세요. 브로콜리, 시금치 같은 섬유질이 풍부한 채소와 닭가슴살, 계란 등 단백질을 추천합니다. 탄수화물은 현미밥 반 공기 이하로 줄여보세요.`
      : `🥗 Your glucose is very high (${glucose} mg/dL)! For your next meal, focus on low-GI foods. I recommend fiber-rich veggies like broccoli and spinach, plus lean protein like chicken breast or eggs. Keep carbs to half a bowl of brown rice or less.`;
  }

  if (glucose > 140) {
    return isKo
      ? `🥗 혈당 스파이크가 감지되었어요 (${glucose} mg/dL). 저녁에는 섬유질이 풍부한 채소를 먼저 드시고, 탄수화물은 식사 마지막에 드세요. 식후 10분 가벼운 산책도 혈당 조절에 도움이 됩니다!`
      : `🥗 Glucose spike detected (${glucose} mg/dL). For dinner, eat fiber-rich veggies first, then save carbs for last. A 10-minute walk after eating also helps regulate blood sugar!`;
  }

  if (ketone > 1.5) {
    return isKo
      ? `🥗 케톤 수치가 ${ketone.toFixed(1)} mmol/L로 높아요. 키토시스 상태인 것 같습니다. 수분과 전해질(소금, 칼륨) 섭취를 충분히 하시고, 두통이나 어지러움이 있으면 약간의 탄수화물을 섭취하세요.`
      : `🥗 Ketone level is high (${ketone.toFixed(1)} mmol/L). You seem to be in ketosis. Stay hydrated and maintain electrolytes (salt, potassium). If you feel headaches or dizziness, have some carbs.`;
  }

  return isKo
    ? `🥗 현재 혈당 ${glucose} mg/dL로 정상 범위입니다. 균형 잡힌 식단을 유지하세요. 식사에 대해 궁금한 점이 있으시면 물어봐 주세요!`
    : `🥗 Your glucose is ${glucose} mg/dL, which is in the normal range. Keep up your balanced diet. Ask me anything about nutrition!`;
}

function generateCounselorResponse(q: string, ctx: MultiPersonaContext, isKo: boolean): string {
  const cortisol = ctx.cortisolLevel ?? 15;
  const sleepScore = ctx.sleepScore ?? 75;
  const hrv = ctx.hrvMs ?? 50;

  if (cortisol > 23 || sleepScore < 50) {
    return isKo
      ? `🧘 스트레스 지표가 높게 나타났어요. 잠시 멈추고 함께 호흡해볼까요?

**4-7-8 호흡법:**
1. 코로 4초 동안 천천히 들이쉬세요
2. 7초 동안 숨을 참으세요
3. 입으로 8초 동안 천천히 내쉬세요
4. 3회 반복해보세요

마음이 조금 편안해지셨나요?`
      : `🧘 Your stress markers are elevated. Let's pause and breathe together.

**4-7-8 Breathing:**
1. Inhale through your nose for 4 seconds
2. Hold for 7 seconds
3. Exhale through your mouth for 8 seconds
4. Repeat 3 times

Feeling a bit calmer?`;
  }

  if (hrv < 30) {
    return isKo
      ? `🧘 심박변이도(HRV)가 낮아 자율신경계가 긴장 상태일 수 있어요. 오늘 저녁에는 스마트폰 사용을 줄이고, 따뜻한 차 한 잔과 함께 10분 명상을 추천드려요. 'Calm' 또는 '마보' 앱의 가이드 명상도 좋아요.`
      : `🧘 Your HRV is low, suggesting your nervous system may be stressed. Tonight, try reducing phone usage. I recommend a warm cup of tea and 10 minutes of meditation. Guided meditation apps like Calm or Headspace can help.`;
  }

  return isKo
    ? `🧘 오늘 마음 상태는 어떠신가요? 스트레스, 수면, 감정에 대해 이야기 나눠보고 싶으시면 편하게 말씀해 주세요. 작은 고민도 괜찮아요.`
    : `🧘 How are you feeling today? If you'd like to talk about stress, sleep, or emotions, I'm here to listen. Even small worries are okay to share.`;
}

function generateSecretaryResponse(q: string, ctx: MultiPersonaContext, isKo: boolean): string {
  const appointments = ctx.upcomingAppointments ?? 0;
  const meds = ctx.pendingMedReminders ?? 0;

  if (appointments > 0 && meds > 0) {
    return isKo
      ? `📋 알림 사항이 있어요!\n\n📅 예정된 진료: ${appointments}건\n💊 복용 예정 약: ${meds}건\n\n자세한 일정을 확인하시거나, 진료 예약을 관리해 드릴까요?`
      : `📋 You have reminders!\n\n📅 Upcoming appointments: ${appointments}\n💊 Pending medications: ${meds}\n\nWould you like to review the schedule or manage bookings?`;
  }

  if (appointments > 0) {
    return isKo
      ? `📋 예정된 진료가 ${appointments}건 있어요. 일정을 확인하시거나 변경이 필요하시면 말씀해 주세요.`
      : `📋 You have ${appointments} upcoming appointment(s). Let me know if you need to review or reschedule.`;
  }

  if (meds > 0) {
    return isKo
      ? `📋 복용 예정 약이 ${meds}건 있어요. 알림을 설정해 드리거나 약계부를 확인하시겠어요?`
      : `📋 You have ${meds} pending medication reminder(s). Want me to set up reminders or check your medication ledger?`;
  }

  return isKo
    ? `📋 안녕하세요! 병원 예약, 약 복용 알림, 일정 관리를 도와드릴게요. 무엇이 필요하신가요?`
    : `📋 Hello! I can help with hospital bookings, medication reminders, and schedule management. What do you need?`;
}

/* ============================================
 * Persona Manager Class
 * ============================================ */

export class PersonaManager {
  private currentPersona: PersonaId = "doctor";
  private listeners: Set<(persona: PersonaId) => void> = new Set();

  getCurrentPersona(): PersonaId {
    return this.currentPersona;
  }

  getPersona(id: PersonaId): Persona {
    return PERSONAS[id];
  }

  getAllPersonas(): Persona[] {
    return Object.values(PERSONAS);
  }

  setPersona(id: PersonaId): void {
    if (this.currentPersona !== id) {
      this.currentPersona = id;
      this.notify();
    }
  }

  autoSelect(ctx: MultiPersonaContext, userInput?: string): PersonaId {
    const selected = getPrimaryPersona(ctx, userInput);
    this.setPersona(selected);
    return selected;
  }

  subscribe(listener: (persona: PersonaId) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentPersona);
    }
  }
}

// Singleton instance
let personaManagerInstance: PersonaManager | null = null;

export function getPersonaManager(): PersonaManager {
  if (!personaManagerInstance) {
    personaManagerInstance = new PersonaManager();
  }
  return personaManagerInstance;
}






