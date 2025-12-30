/**
 * Predictive Health Engine
 * Time-series forecasting for health predictions
 */

/* ============================================
 * Types
 * ============================================ */

export interface HealthDataPoint {
  ts: number;
  glucoseMgDl?: number;
  lactate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  temperatureC?: number;
  heartRate?: number;
  weight?: number;
  hba1cPct?: number;
}

export interface FatigueEntry {
  ts: number;
  score: number; // 1-10 scale
  notes?: string;
}

export interface LocalFluData {
  region: string;
  weeklyIncidenceRate: number; // per 100k population
  trend: "rising" | "stable" | "falling";
  alertLevel: "low" | "medium" | "high";
}

/* ============================================
 * Short-Term Prediction: Immunity Forecast
 * ============================================ */

export interface ImmunityForecast {
  riskLevel: "sunny" | "cloudy" | "rainy" | "stormy";
  riskScore: number; // 0-100
  confidence: number; // 0-1
  factors: ImmunityFactor[];
  recommendation: string;
  recommendationKo: string;
  /** Forecast timestamp (when this prediction applies) */
  forecastFor: number;
}

export interface ImmunityFactor {
  name: string;
  nameKo: string;
  value: number;
  status: "good" | "warning" | "danger";
  weight: number;
  contribution: number; // How much this factor contributes to risk
}

/**
 * Analyze recent health data to predict immunity/illness risk
 */
export function predictImmunityForecast(params: {
  recentTemperatures: number[]; // Last 3-7 days, Celsius
  fatigueScores: number[]; // Last 3-7 days, 1-10 scale
  sleepScores: number[]; // Last 3-7 days, 0-100
  localFlu: LocalFluData | null;
  recentLactate?: number[];
  currentWeight?: number;
  targetWeight?: number;
}): ImmunityForecast {
  const {
    recentTemperatures,
    fatigueScores,
    sleepScores,
    localFlu,
    recentLactate = []
  } = params;

  const factors: ImmunityFactor[] = [];
  let totalRisk = 0;
  let totalWeight = 0;

  // Factor 1: Temperature Variation
  if (recentTemperatures.length >= 2) {
    const avgTemp = mean(recentTemperatures);
    const tempVariation = stdDev(recentTemperatures);
    const hasLowGradeFeaver = recentTemperatures.some(t => t >= 37.3);
    
    let tempRisk = 0;
    if (hasLowGradeFeaver) tempRisk = 70;
    else if (tempVariation > 0.5) tempRisk = 40;
    else if (avgTemp < 36.0) tempRisk = 30;
    else tempRisk = 10;

    const weight = 0.25;
    factors.push({
      name: "Temperature",
      nameKo: "체온",
      value: avgTemp,
      status: tempRisk > 50 ? "danger" : tempRisk > 30 ? "warning" : "good",
      weight,
      contribution: tempRisk * weight
    });
    totalRisk += tempRisk * weight;
    totalWeight += weight;
  }

  // Factor 2: Fatigue Level
  if (fatigueScores.length >= 2) {
    const avgFatigue = mean(fatigueScores);
    const fatigueTrend = linearTrend(fatigueScores);
    
    let fatigueRisk = avgFatigue * 10; // 1-10 → 10-100
    if (fatigueTrend > 0.5) fatigueRisk += 15; // Increasing fatigue

    const weight = 0.25;
    factors.push({
      name: "Fatigue",
      nameKo: "피로도",
      value: avgFatigue,
      status: fatigueRisk > 60 ? "danger" : fatigueRisk > 40 ? "warning" : "good",
      weight,
      contribution: fatigueRisk * weight
    });
    totalRisk += fatigueRisk * weight;
    totalWeight += weight;
  }

  // Factor 3: Sleep Quality
  if (sleepScores.length >= 2) {
    const avgSleep = mean(sleepScores);
    const sleepRisk = Math.max(0, 100 - avgSleep); // Lower sleep = higher risk

    const weight = 0.2;
    factors.push({
      name: "Sleep Quality",
      nameKo: "수면 품질",
      value: avgSleep,
      status: avgSleep < 50 ? "danger" : avgSleep < 70 ? "warning" : "good",
      weight,
      contribution: sleepRisk * weight
    });
    totalRisk += sleepRisk * weight;
    totalWeight += weight;
  }

  // Factor 4: Local Flu Trends
  if (localFlu) {
    let fluRisk = 0;
    if (localFlu.alertLevel === "high") fluRisk = 80;
    else if (localFlu.alertLevel === "medium") fluRisk = 50;
    else fluRisk = 20;

    if (localFlu.trend === "rising") fluRisk += 15;
    else if (localFlu.trend === "falling") fluRisk -= 10;

    const weight = 0.2;
    factors.push({
      name: "Local Flu Activity",
      nameKo: "지역 독감 현황",
      value: localFlu.weeklyIncidenceRate,
      status: fluRisk > 60 ? "danger" : fluRisk > 40 ? "warning" : "good",
      weight,
      contribution: fluRisk * weight
    });
    totalRisk += fluRisk * weight;
    totalWeight += weight;
  }

  // Factor 5: Recent Lactate (metabolic stress)
  if (recentLactate.length >= 2) {
    const avgLactate = mean(recentLactate);
    let lactateRisk = 0;
    if (avgLactate > 4) lactateRisk = 60;
    else if (avgLactate > 2.5) lactateRisk = 35;
    else lactateRisk = 10;

    const weight = 0.1;
    factors.push({
      name: "Metabolic Stress",
      nameKo: "대사 스트레스",
      value: avgLactate,
      status: lactateRisk > 50 ? "danger" : lactateRisk > 30 ? "warning" : "good",
      weight,
      contribution: lactateRisk * weight
    });
    totalRisk += lactateRisk * weight;
    totalWeight += weight;
  }

  // Normalize risk score
  const riskScore = totalWeight > 0 ? Math.min(100, Math.round(totalRisk / totalWeight * (1 / 0.25))) : 30;

  // Determine risk level
  let riskLevel: ImmunityForecast["riskLevel"];
  if (riskScore >= 75) riskLevel = "stormy";
  else if (riskScore >= 50) riskLevel = "rainy";
  else if (riskScore >= 30) riskLevel = "cloudy";
  else riskLevel = "sunny";

  // Generate recommendation
  const { recommendation, recommendationKo } = generateImmunityRecommendation(riskLevel, factors);

  return {
    riskLevel,
    riskScore,
    confidence: Math.min(0.95, 0.5 + factors.length * 0.1),
    factors,
    recommendation,
    recommendationKo,
    forecastFor: Date.now() + 24 * 60 * 60 * 1000 // Next 24 hours
  };
}

function generateImmunityRecommendation(
  level: ImmunityForecast["riskLevel"],
  factors: ImmunityFactor[]
): { recommendation: string; recommendationKo: string } {
  const highRiskFactors = factors.filter(f => f.status === "danger");
  
  switch (level) {
    case "stormy":
      return {
        recommendation: "High risk of getting sick. Rest today, take Vitamin C & Zinc, and avoid crowded places.",
        recommendationKo: "면역력 위험 높음. 오늘은 푹 쉬시고, 비타민C와 아연을 섭취하세요. 사람 많은 곳은 피해주세요."
      };
    case "rainy":
      return {
        recommendation: "Immunity Forecast: Rainy (Risk High). Take Vitamin C today and get extra sleep tonight.",
        recommendationKo: "면역력 예보: 비 (위험 높음). 오늘 비타민C를 드시고, 오늘 밤 충분히 주무세요."
      };
    case "cloudy":
      return {
        recommendation: "Moderate immunity risk. Stay hydrated, eat nutritious meals, and monitor how you feel.",
        recommendationKo: "면역력 보통. 수분 섭취를 충분히 하시고, 영양가 있는 식사를 하세요."
      };
    default:
      return {
        recommendation: "Immunity looking good! Keep up your healthy habits.",
        recommendationKo: "면역력 좋음! 건강한 습관을 유지하세요."
      };
  }
}

/* ============================================
 * Long-Term Prediction: Chronic Disease Risk
 * ============================================ */

export interface ChronicDiseaseRisk {
  disease: string;
  diseaseKo: string;
  currentValue: number;
  unit: string;
  thresholdValue: number; // Value at which disease is diagnosed
  thresholdLabel: string;
  predictedValue: number;
  predictedDate: number; // Timestamp when threshold may be reached
  monthsToThreshold: number | null; // null if trend is improving
  riskLevel: "low" | "moderate" | "high" | "critical";
  trend: "improving" | "stable" | "worsening";
  trendSlope: number; // Change per month
  confidence: number;
  recommendation: string;
  recommendationKo: string;
}

export interface ChronicRiskAnalysis {
  diabetesRisk: ChronicDiseaseRisk | null;
  hypertensionRisk: ChronicDiseaseRisk | null;
  overallRiskScore: number; // 0-100
  primaryConcern: string;
  primaryConcernKo: string;
}

/**
 * Analyze monthly health data to predict chronic disease risk
 * Uses simple linear regression for trend analysis
 */
export function predictChronicDiseaseRisk(params: {
  monthlyGlucose: { month: string; avgMgDl: number }[];
  monthlyBP: { month: string; avgSystolic: number; avgDiastolic: number }[];
  currentHbA1c?: number;
  currentWeight?: number;
  age?: number;
  familyHistory?: { diabetes: boolean; hypertension: boolean };
}): ChronicRiskAnalysis {
  const { monthlyGlucose, monthlyBP, currentHbA1c, currentWeight, age, familyHistory } = params;

  let diabetesRisk: ChronicDiseaseRisk | null = null;
  let hypertensionRisk: ChronicDiseaseRisk | null = null;

  // Diabetes Risk (Glucose → HbA1c prediction)
  if (monthlyGlucose.length >= 3) {
    const glucoseValues = monthlyGlucose.map(m => m.avgMgDl);
    const trend = linearTrend(glucoseValues);
    const currentGlucose = glucoseValues[glucoseValues.length - 1];
    
    // Estimate HbA1c from average glucose: HbA1c = (avgGlucose + 46.7) / 28.7
    const estimatedHbA1c = currentHbA1c ?? (currentGlucose + 46.7) / 28.7;
    
    // Predict future glucose based on trend
    const monthlyIncrease = trend * (glucoseValues[glucoseValues.length - 1] - glucoseValues[0]) / Math.max(1, glucoseValues.length - 1);
    
    // Pre-diabetes threshold: HbA1c = 5.7%, Diabetes: 6.5%
    const preDiabetesHbA1c = 5.7;
    const diabetesHbA1c = 6.5;
    
    // Calculate months to threshold
    let monthsToThreshold: number | null = null;
    let predictedHbA1c = estimatedHbA1c;
    
    if (trend > 0 && estimatedHbA1c < diabetesHbA1c) {
      // Predict HbA1c increase based on glucose trend
      const hbA1cMonthlyIncrease = monthlyIncrease / 28.7;
      if (hbA1cMonthlyIncrease > 0) {
        monthsToThreshold = Math.ceil((diabetesHbA1c - estimatedHbA1c) / hbA1cMonthlyIncrease);
        predictedHbA1c = estimatedHbA1c + hbA1cMonthlyIncrease * 12; // 12 month prediction
      }
    }

    // Risk level
    let riskLevel: ChronicDiseaseRisk["riskLevel"];
    if (estimatedHbA1c >= 6.5) riskLevel = "critical";
    else if (estimatedHbA1c >= 5.7) riskLevel = "high";
    else if (trend > 0.02 || estimatedHbA1c >= 5.4) riskLevel = "moderate";
    else riskLevel = "low";

    // Family history adjustment
    if (familyHistory?.diabetes && riskLevel !== "critical") {
      riskLevel = riskLevel === "low" ? "moderate" : riskLevel === "moderate" ? "high" : riskLevel;
    }

    diabetesRisk = {
      disease: "Type 2 Diabetes",
      diseaseKo: "제2형 당뇨병",
      currentValue: estimatedHbA1c,
      unit: "%",
      thresholdValue: diabetesHbA1c,
      thresholdLabel: "Diabetes (HbA1c ≥ 6.5%)",
      predictedValue: predictedHbA1c,
      predictedDate: Date.now() + (monthsToThreshold ?? 12) * 30 * 24 * 60 * 60 * 1000,
      monthsToThreshold: monthsToThreshold && monthsToThreshold > 0 ? monthsToThreshold : null,
      riskLevel,
      trend: trend > 0.02 ? "worsening" : trend < -0.02 ? "improving" : "stable",
      trendSlope: trend,
      confidence: Math.min(0.85, 0.5 + monthlyGlucose.length * 0.05),
      recommendation: generateDiabetesRecommendation(riskLevel, monthsToThreshold),
      recommendationKo: generateDiabetesRecommendationKo(riskLevel, monthsToThreshold)
    };
  }

  // Hypertension Risk
  if (monthlyBP.length >= 3) {
    const systolicValues = monthlyBP.map(m => m.avgSystolic);
    const trend = linearTrend(systolicValues);
    const currentSystolic = systolicValues[systolicValues.length - 1];
    
    // Hypertension threshold: Systolic ≥ 130 mmHg (Stage 1)
    const hypertensionThreshold = 130;
    
    let monthsToThreshold: number | null = null;
    if (trend > 0 && currentSystolic < hypertensionThreshold) {
      const monthlyIncrease = trend * (systolicValues[systolicValues.length - 1] - systolicValues[0]) / Math.max(1, systolicValues.length - 1);
      if (monthlyIncrease > 0) {
        monthsToThreshold = Math.ceil((hypertensionThreshold - currentSystolic) / monthlyIncrease);
      }
    }

    let riskLevel: ChronicDiseaseRisk["riskLevel"];
    if (currentSystolic >= 140) riskLevel = "critical";
    else if (currentSystolic >= 130) riskLevel = "high";
    else if (currentSystolic >= 120 || trend > 0.03) riskLevel = "moderate";
    else riskLevel = "low";

    if (familyHistory?.hypertension && riskLevel !== "critical") {
      riskLevel = riskLevel === "low" ? "moderate" : riskLevel === "moderate" ? "high" : riskLevel;
    }

    hypertensionRisk = {
      disease: "Hypertension",
      diseaseKo: "고혈압",
      currentValue: currentSystolic,
      unit: "mmHg",
      thresholdValue: hypertensionThreshold,
      thresholdLabel: "Stage 1 Hypertension (≥ 130 mmHg)",
      predictedValue: currentSystolic + trend * 12 * 2, // 12 month prediction
      predictedDate: Date.now() + (monthsToThreshold ?? 12) * 30 * 24 * 60 * 60 * 1000,
      monthsToThreshold: monthsToThreshold && monthsToThreshold > 0 ? monthsToThreshold : null,
      riskLevel,
      trend: trend > 0.02 ? "worsening" : trend < -0.02 ? "improving" : "stable",
      trendSlope: trend,
      confidence: Math.min(0.85, 0.5 + monthlyBP.length * 0.05),
      recommendation: generateHypertensionRecommendation(riskLevel),
      recommendationKo: generateHypertensionRecommendationKo(riskLevel)
    };
  }

  // Overall risk score
  const risks = [diabetesRisk, hypertensionRisk].filter(Boolean) as ChronicDiseaseRisk[];
  const riskScores = risks.map(r => {
    switch (r.riskLevel) {
      case "critical": return 90;
      case "high": return 70;
      case "moderate": return 45;
      default: return 20;
    }
  });
  const overallRiskScore = riskScores.length > 0 ? Math.round(mean(riskScores)) : 25;

  // Primary concern
  let primaryConcern = "Your health metrics look stable. Keep monitoring!";
  let primaryConcernKo = "건강 지표가 안정적입니다. 계속 모니터링하세요!";

  const criticalRisks = risks.filter(r => r.riskLevel === "critical" || r.riskLevel === "high");
  if (criticalRisks.length > 0) {
    const highest = criticalRisks[0];
    if (highest.monthsToThreshold) {
      primaryConcern = `At current trend, ${highest.disease} risk is significant. Action needed.`;
      primaryConcernKo = `현재 추세라면 ${highest.diseaseKo} 위험이 높습니다. 조치가 필요합니다.`;
    }
  }

  return {
    diabetesRisk,
    hypertensionRisk,
    overallRiskScore,
    primaryConcern,
    primaryConcernKo
  };
}

function generateDiabetesRecommendation(risk: ChronicDiseaseRisk["riskLevel"], months: number | null): string {
  if (risk === "critical") {
    return "Your HbA1c indicates diabetes. Please consult an endocrinologist immediately.";
  }
  if (risk === "high" && months) {
    return `At current trend, HbA1c may reach 6.5% (Pre-diabetes threshold) in ${months} months. Consider dietary changes and exercise.`;
  }
  if (risk === "moderate") {
    return "Blood sugar trending upward. Reduce refined carbs and increase physical activity.";
  }
  return "Blood sugar levels are healthy. Maintain your current lifestyle.";
}

function generateDiabetesRecommendationKo(risk: ChronicDiseaseRisk["riskLevel"], months: number | null): string {
  if (risk === "critical") {
    return "HbA1c 수치가 당뇨병 범위입니다. 내분비내과 진료를 받으세요.";
  }
  if (risk === "high" && months) {
    return `현재 추세라면 ${months}개월 후 HbA1c가 6.5% (당뇨 전단계)에 도달할 수 있습니다. 식단 조절과 운동을 권장합니다.`;
  }
  if (risk === "moderate") {
    return "혈당이 상승 추세입니다. 정제 탄수화물을 줄이고 운동량을 늘려보세요.";
  }
  return "혈당 수치가 건강합니다. 현재 생활습관을 유지하세요.";
}

function generateHypertensionRecommendation(risk: ChronicDiseaseRisk["riskLevel"]): string {
  if (risk === "critical") {
    return "Blood pressure is in hypertensive range. Consult your doctor about medication.";
  }
  if (risk === "high") {
    return "Blood pressure is elevated. Reduce sodium intake and manage stress.";
  }
  if (risk === "moderate") {
    return "Blood pressure trending upward. Consider lifestyle modifications.";
  }
  return "Blood pressure is normal. Keep up the healthy habits!";
}

function generateHypertensionRecommendationKo(risk: ChronicDiseaseRisk["riskLevel"]): string {
  if (risk === "critical") {
    return "혈압이 고혈압 범위입니다. 약물 치료에 대해 의사와 상담하세요.";
  }
  if (risk === "high") {
    return "혈압이 상승했습니다. 나트륨 섭취를 줄이고 스트레스를 관리하세요.";
  }
  if (risk === "moderate") {
    return "혈압이 상승 추세입니다. 생활습관 개선을 고려해보세요.";
  }
  return "혈압이 정상입니다. 건강한 습관을 유지하세요!";
}

/* ============================================
 * Scenario Simulator: "What If" Analysis
 * ============================================ */

export interface ScenarioInput {
  type: "weight_loss" | "weight_gain" | "exercise_increase" | "diet_change" | "medication_start" | "quit_smoking";
  value: number; // e.g., 5 for "lose 5kg"
  unit?: string;
}

export interface ScenarioResult {
  scenario: ScenarioInput;
  originalRisk: number;
  newRisk: number;
  riskReduction: number;
  riskReductionPct: number;
  diabetesImpact: string;
  diabetesImpactKo: string;
  hypertensionImpact: string;
  hypertensionImpactKo: string;
  timeToNormal?: number; // Months to reach normal values
  summary: string;
  summaryKo: string;
}

/**
 * Simulate health outcomes based on lifestyle changes
 */
export function simulateScenario(
  scenario: ScenarioInput,
  currentRisk: ChronicRiskAnalysis,
  currentWeight?: number
): ScenarioResult {
  const originalRisk = currentRisk.overallRiskScore;
  let riskReduction = 0;
  let diabetesImpact = "";
  let diabetesImpactKo = "";
  let hypertensionImpact = "";
  let hypertensionImpactKo = "";

  switch (scenario.type) {
    case "weight_loss": {
      // Each 1kg lost = ~3-5% diabetes risk reduction, ~1-2% BP reduction
      const kgLost = scenario.value;
      const diabetesReduction = kgLost * 4; // 4% per kg
      const bpReduction = kgLost * 1.5; // 1.5% per kg
      riskReduction = (diabetesReduction + bpReduction) / 2;

      diabetesImpact = `Diabetes risk drops by ~${Math.round(diabetesReduction)}%`;
      diabetesImpactKo = `당뇨병 위험 ~${Math.round(diabetesReduction)}% 감소`;
      hypertensionImpact = `Blood pressure may drop by ~${Math.round(kgLost * 1)}mmHg systolic`;
      hypertensionImpactKo = `수축기 혈압 ~${Math.round(kgLost * 1)}mmHg 감소 예상`;
      break;
    }

    case "exercise_increase": {
      // 30 min/day exercise = ~20-30% diabetes risk reduction
      const minPerDay = scenario.value;
      const diabetesReduction = Math.min(35, minPerDay * 0.8);
      const bpReduction = Math.min(20, minPerDay * 0.5);
      riskReduction = (diabetesReduction + bpReduction) / 2;

      diabetesImpact = `${minPerDay} min/day exercise reduces diabetes risk by ~${Math.round(diabetesReduction)}%`;
      diabetesImpactKo = `하루 ${minPerDay}분 운동으로 당뇨 위험 ~${Math.round(diabetesReduction)}% 감소`;
      hypertensionImpact = `Regular exercise can lower BP by 4-9 mmHg`;
      hypertensionImpactKo = `규칙적인 운동으로 혈압 4-9 mmHg 감소 가능`;
      break;
    }

    case "diet_change": {
      // Mediterranean diet = ~25% diabetes risk reduction
      riskReduction = 22;
      diabetesImpact = "Mediterranean/Low-carb diet reduces diabetes risk by ~25%";
      diabetesImpactKo = "지중해식/저탄수화물 식단으로 당뇨 위험 ~25% 감소";
      hypertensionImpact = "DASH diet can lower BP by 8-14 mmHg";
      hypertensionImpactKo = "DASH 식단으로 혈압 8-14 mmHg 감소 가능";
      break;
    }

    case "quit_smoking": {
      riskReduction = 30;
      diabetesImpact = "Quitting smoking reduces diabetes risk by 30-40%";
      diabetesImpactKo = "금연으로 당뇨 위험 30-40% 감소";
      hypertensionImpact = "BP drops significantly within weeks of quitting";
      hypertensionImpactKo = "금연 후 몇 주 내에 혈압이 크게 감소합니다";
      break;
    }

    case "medication_start": {
      riskReduction = 40;
      diabetesImpact = "Metformin can reduce HbA1c by 1-1.5%";
      diabetesImpactKo = "메트포르민으로 HbA1c 1-1.5% 감소 가능";
      hypertensionImpact = "BP medication typically reduces systolic BP by 10-15 mmHg";
      hypertensionImpactKo = "혈압약으로 수축기 혈압 10-15 mmHg 감소";
      break;
    }

    default:
      riskReduction = 10;
      diabetesImpact = "Lifestyle changes can improve your health metrics";
      diabetesImpactKo = "생활습관 개선으로 건강 지표 향상 가능";
      hypertensionImpact = "Healthy habits help maintain normal blood pressure";
      hypertensionImpactKo = "건강한 습관이 정상 혈압 유지에 도움됩니다";
  }

  const newRisk = Math.max(10, originalRisk - riskReduction);
  const riskReductionPct = Math.round((riskReduction / originalRisk) * 100);

  // Generate summary
  let summary: string;
  let summaryKo: string;

  if (scenario.type === "weight_loss") {
    summary = `If you lose ${scenario.value}kg, your overall disease risk drops by ${riskReductionPct}%.`;
    summaryKo = `${scenario.value}kg 감량 시 전체 질병 위험이 ${riskReductionPct}% 감소합니다.`;
  } else if (scenario.type === "exercise_increase") {
    summary = `Adding ${scenario.value} minutes of daily exercise reduces your risk by ${riskReductionPct}%.`;
    summaryKo = `하루 ${scenario.value}분 운동 추가 시 위험이 ${riskReductionPct}% 감소합니다.`;
  } else {
    summary = `This change could reduce your disease risk by ${riskReductionPct}%.`;
    summaryKo = `이 변화로 질병 위험이 ${riskReductionPct}% 감소할 수 있습니다.`;
  }

  return {
    scenario,
    originalRisk,
    newRisk,
    riskReduction,
    riskReductionPct,
    diabetesImpact,
    diabetesImpactKo,
    hypertensionImpact,
    hypertensionImpactKo,
    summary,
    summaryKo
  };
}

/**
 * Parse natural language "What if" question
 */
export function parseWhatIfQuestion(question: string): ScenarioInput | null {
  const q = question.toLowerCase();

  // Weight loss patterns
  const weightLossMatch = q.match(/(?:lose|drop|shed|감량|빼|뺀다)\s*(\d+)\s*(?:kg|킬로|키로)?/);
  if (weightLossMatch) {
    return { type: "weight_loss", value: parseInt(weightLossMatch[1]), unit: "kg" };
  }

  // Exercise patterns
  const exerciseMatch = q.match(/(?:exercise|workout|run|walk|운동)\s*(\d+)\s*(?:min|분|minutes)?/);
  if (exerciseMatch) {
    return { type: "exercise_increase", value: parseInt(exerciseMatch[1]), unit: "min/day" };
  }

  // Diet patterns
  if (q.includes("diet") || q.includes("식단") || q.includes("먹") || q.includes("mediterranean") || q.includes("저탄수")) {
    return { type: "diet_change", value: 1 };
  }

  // Quit smoking
  if (q.includes("quit smoking") || q.includes("stop smoking") || q.includes("금연")) {
    return { type: "quit_smoking", value: 1 };
  }

  // Medication
  if (q.includes("medication") || q.includes("약") || q.includes("metformin") || q.includes("메트포르민")) {
    return { type: "medication_start", value: 1 };
  }

  return null;
}

/* ============================================
 * Utility Functions
 * ============================================ */

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Simple linear trend calculation (slope normalized to 0-1)
 * Positive = increasing, Negative = decreasing
 */
function linearTrend(values: number[]): number {
  if (values.length < 2) return 0;
  
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) * (i - xMean);
  }
  
  if (denominator === 0) return 0;
  
  const slope = numerator / denominator;
  // Normalize: positive slope means increasing trend
  return slope / (Math.abs(slope) + 1); // Squash to -1 to 1 range
}

/* ============================================
 * Mock Data Generators (for demo)
 * ============================================ */

export function generateMockImmunityData(): Parameters<typeof predictImmunityForecast>[0] {
  return {
    recentTemperatures: [36.5, 36.6, 36.4, 36.8, 37.0, 36.7, 36.5],
    fatigueScores: [4, 5, 6, 5, 7, 6, 5],
    sleepScores: [75, 70, 65, 72, 68, 60, 65],
    localFlu: {
      region: "Seoul",
      weeklyIncidenceRate: 45,
      trend: "rising",
      alertLevel: "medium"
    },
    recentLactate: [2.1, 2.3, 2.5, 2.8, 2.4]
  };
}

export function generateMockChronicData(): Parameters<typeof predictChronicDiseaseRisk>[0] {
  return {
    monthlyGlucose: [
      { month: "2025-01", avgMgDl: 98 },
      { month: "2025-02", avgMgDl: 102 },
      { month: "2025-03", avgMgDl: 105 },
      { month: "2025-04", avgMgDl: 108 },
      { month: "2025-05", avgMgDl: 112 },
      { month: "2025-06", avgMgDl: 115 }
    ],
    monthlyBP: [
      { month: "2025-01", avgSystolic: 118, avgDiastolic: 78 },
      { month: "2025-02", avgSystolic: 120, avgDiastolic: 80 },
      { month: "2025-03", avgSystolic: 122, avgDiastolic: 81 },
      { month: "2025-04", avgSystolic: 124, avgDiastolic: 82 },
      { month: "2025-05", avgSystolic: 125, avgDiastolic: 83 },
      { month: "2025-06", avgSystolic: 127, avgDiastolic: 84 }
    ],
    currentHbA1c: 5.6,
    currentWeight: 78,
    age: 45,
    familyHistory: { diabetes: true, hypertension: false }
  };
}






