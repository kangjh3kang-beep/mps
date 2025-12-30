import type { DeepAnalysisPacket } from "@/lib/deep-analysis";
import refs from "@/lib/MedicalReferences.json";
import type { HealthGoal } from "@/lib/profile";

export type UserProfile = {
  age: number;
  gender: "female" | "male" | "other";
  conditions: string[]; // e.g., ["diabetes", "hypertension"]
  goals?: HealthGoal[];
};

export type ReportContext = {
  fasting?: boolean;
  postprandial?: boolean;
  postExercise?: boolean;
  resting?: boolean;
  medications?: string[]; // e.g., ["metformin"]
};

type RuleOp = ">=" | ">" | "<=" | "<" | "ALWAYS";

type MedicalReference = {
  id: string;
  analyte: string;
  unit: string;
  rule: { op: RuleOp; value: number };
  appliesTo?: {
    minAge?: number;
    maxAge?: number;
    genders?: Array<"female" | "male" | "other">;
    /** match if user has ANY of these conditions */
    conditionsAny?: string[];
    /** match only if user has ALL of these conditions */
    conditionsAll?: string[];
  };
  contexts?: {
    fasting?: boolean;
    postprandial?: boolean;
    postExercise?: boolean;
    resting?: boolean;
    medicationsAny?: string[];
  };
  /** Higher wins; used for conflict resolution */
  priority?: number;
  citation: string;
  note?: string;
};

export type ReportFootnote = {
  id: string;
  text: string;
};

export type GeneratedReport = {
  prompt: string;
  bodyText: string; // includes [^id] footnotes inline
  footnotes: ReportFootnote[];
  tags: {
    mentionsOxidationPeak: boolean;
    instantActionRequired: boolean;
  };
};

function evalRule(op: RuleOp, x: number, threshold: number): boolean {
  switch (op) {
    case "ALWAYS":
      return true;
    case ">=":
      return x >= threshold;
    case ">":
      return x > threshold;
    case "<=":
      return x <= threshold;
    case "<":
      return x < threshold;
    default:
      return false;
  }
}

function safe(n: unknown, fallback = 0) {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function lactateMgDlToMmolL(mgDl: number) {
  return mgDl / 9.008;
}

function extractAnalyteValueForCitations(packet: DeepAnalysisPacket) {
  // Our app currently reports lactate; deepPacket.layer3 is mg/dL (per deep-analysis.ts).
  if (packet.layer3.unit === "mg/dL") {
    const mmolL = lactateMgDlToMmolL(packet.layer3.concentration);
    return { analyte: "Lactate", unit: "mmol/L", value: mmolL };
  }
  return { analyte: "Lactate", unit: packet.layer3.unit, value: packet.layer3.concentration };
}

export function generateReportPrompt(userProfile: UserProfile, deepPacket: DeepAnalysisPacket, context?: ReportContext): string {
  const demo = extractAnalyteValueForCitations(deepPacket);
  const l2 = deepPacket.layer2;
  const ctx = context ?? { resting: true };
  const matchedRefs = selectReferences(deepPacket, userProfile, ctx);

  const lines: string[] = [];
  lines.push("SYSTEM:");
  lines.push("You are a medical reporting assistant for a biosensor system.");
  lines.push("");
  lines.push("USER PROFILE:");
  lines.push(`- Age: ${userProfile.age}`);
  lines.push(`- Gender: ${userProfile.gender}`);
  lines.push(`- Conditions: ${userProfile.conditions.length ? userProfile.conditions.join(", ") : "None reported"}`);
  lines.push(`- Goals: ${userProfile.goals?.length ? userProfile.goals.join(", ") : "None set"}`);
  lines.push(
    `- Context: ${ctx.fasting ? "fasting" : ctx.postprandial ? "postprandial" : ctx.postExercise ? "post-exercise" : "resting"}`
  );
  if ((ctx.medications?.length ?? 0) > 0) {
    lines.push(`- Medications: ${ctx.medications?.join(", ")}`);
  }
  lines.push("");
  lines.push("MEASUREMENT (Clinical):");
  lines.push(`- Analyte: ${demo.analyte}`);
  lines.push(`- Value: ${demo.value.toFixed(2)} ${demo.unit}`);
  lines.push(`- Confidence: ±${deepPacket.layer3.confidenceIntervalPct.toFixed(1)}%`);
  lines.push("");
  lines.push("L2 PROCESSED FEATURES (Engineer-level):");
  lines.push(`- SignalToNoiseRatio: ${l2.signalToNoiseRatio.toFixed(2)} (lower => noisier)`);
  lines.push(`- DiffusionCoefficient: ${safe(l2.diffusionCoefficient).toExponential(2)}`);
  lines.push(`- ReactionKinetics: ${l2.reactionKinetics.toFixed(4)} (slowing down => reaction rate is slowing)`);
  lines.push(`- MembranePermeability: ${l2.membranePermeability.toFixed(3)} (lower => membrane/filter may be restricting flow)`);
  lines.push("");
  if (matchedRefs.length > 0) {
    lines.push("AVAILABLE REFERENCES (use as citations when relevant):");
    matchedRefs.slice(0, 8).forEach((r) => {
      lines.push(`- [${r.id}] ${r.text}`);
    });
    lines.push("");
  }
  lines.push("INSTRUCTION:");
  lines.push(
    "Explain this result using medical common sense. Cite specific guidelines (e.g., ADA, WHO) if values are out of range."
  );
  lines.push(
    "Explain the connection between the raw signal shape (CV/EIS patterns) and the physiological state in plain language."
  );
  lines.push("If urgent, explicitly include the phrase: Instant Action Required.");

  return lines.join("\n");
}

function appliesToUser(r: MedicalReference, user: UserProfile): boolean {
  const a = r.appliesTo ?? {};
  if (typeof a.minAge === "number" && user.age < a.minAge) return false;
  if (typeof a.maxAge === "number" && user.age > a.maxAge) return false;
  if (Array.isArray(a.genders) && a.genders.length > 0 && !a.genders.includes(user.gender)) return false;

  const userConds = new Set(user.conditions.map((c) => c.toLowerCase()));
  const any = a.conditionsAny?.map((c) => c.toLowerCase()) ?? [];
  const all = a.conditionsAll?.map((c) => c.toLowerCase()) ?? [];
  if (any.length > 0 && !any.some((c) => userConds.has(c))) return false;
  if (all.length > 0 && !all.every((c) => userConds.has(c))) return false;
  return true;
}

function matchesContext(r: MedicalReference, ctx: ReportContext): boolean {
  const c = r.contexts ?? {};
  // If ref specifies a boolean context, require it to match true in ctx.
  const boolKeys: Array<keyof ReportContext> = ["fasting", "postprandial", "postExercise", "resting"];
  for (const k of boolKeys) {
    if (typeof (c as any)[k] === "boolean") {
      if ((c as any)[k] === true && (ctx as any)[k] !== true) return false;
    }
  }
  // medicationsAny: if specified, require any match
  const medsAny = c.medicationsAny?.map((m) => m.toLowerCase()) ?? [];
  if (medsAny.length > 0) {
    const meds = new Set((ctx.medications ?? []).map((m) => m.toLowerCase()));
    if (!medsAny.some((m) => meds.has(m))) return false;
  }
  return true;
}

function specificityScore(r: MedicalReference): number {
  const a = r.appliesTo ?? {};
  const c = r.contexts ?? {};
  let s = 0;
  if (typeof a.minAge === "number") s += 1;
  if (typeof a.maxAge === "number") s += 1;
  if (Array.isArray(a.genders) && a.genders.length > 0) s += 1;
  if (Array.isArray(a.conditionsAny) && a.conditionsAny.length > 0) s += 1;
  if (Array.isArray(a.conditionsAll) && a.conditionsAll.length > 0) s += 2;
  if (c.fasting) s += 1;
  if (c.postprandial) s += 1;
  if (c.postExercise) s += 1;
  if (c.resting) s += 1;
  if (Array.isArray(c.medicationsAny) && c.medicationsAny.length > 0) s += 2;
  return s;
}

function selectReferences(packet: DeepAnalysisPacket, userProfile: UserProfile, ctx: ReportContext): ReportFootnote[] {
  const list = refs as unknown as MedicalReference[];
  const demo = extractAnalyteValueForCitations(packet);

  const hits: MedicalReference[] = [];
  for (const r of list) {
    if (r.analyte === demo.analyte && r.unit === demo.unit) {
      if (!appliesToUser(r, userProfile)) continue;
      if (!matchesContext(r, ctx)) continue;
      if (evalRule(r.rule.op, demo.value, r.rule.value)) hits.push(r);
    }
  }

  // Always include a general reference (simulation) for the narrative.
  const general = list.find((r) => r.id === "WHO_Dehydration_GeneralAdvice");
  if (general && appliesToUser(general, userProfile) && matchesContext(general, ctx)) hits.push(general);

  // de-dupe
  const uniq = new Map<string, MedicalReference>();
  hits.forEach((h) => uniq.set(h.id, h));

  // Conflict resolution / ranking:
  // 1) higher priority
  // 2) higher specificity (more constraints)
  // 3) stable by id
  const ranked = Array.from(uniq.values()).sort((a, b) => {
    const pa = a.priority ?? 0;
    const pb = b.priority ?? 0;
    if (pb !== pa) return pb - pa;
    const sa = specificityScore(a);
    const sb = specificityScore(b);
    if (sb !== sa) return sb - sa;
    return a.id.localeCompare(b.id);
  });

  // Keep top-N to avoid over-citation noise
  return ranked.slice(0, 8).map((h) => ({ id: h.id, text: h.citation }));
}

export function generateSimulatedReport(args: {
  userProfile: UserProfile;
  deepPacket: DeepAnalysisPacket;
  context?: ReportContext;
}): GeneratedReport {
  const prompt = generateReportPrompt(args.userProfile, args.deepPacket, args.context);
  const l2 = args.deepPacket.layer2;
  const demo = extractAnalyteValueForCitations(args.deepPacket);

  const footnotes = selectReferences(args.deepPacket, args.userProfile, args.context ?? { resting: true });
  const cite = (id: string) => `[^${id}]`;

  const snr = l2.signalToNoiseRatio;
  const noisy = snr < 18;
  const lactateHigh = demo.value >= 4.0; // mmol/L

  const instantActionRequired = lactateHigh && !noisy;
  const mentionsOxidationPeak = true;

  const lines: string[] = [];

  lines.push(`### 요약`);
  if (instantActionRequired) {
    lines.push(`- Instant Action Required.`);
  }
  lines.push(`- 측정값(추정): ${demo.value.toFixed(2)} ${demo.unit} (±${args.deepPacket.layer3.confidenceIntervalPct.toFixed(1)}%).`);
  lines.push(`- 데이터 품질(SNR): ${snr.toFixed(1)} ${noisy ? "→ 노이즈가 많아 해석 신뢰도 주의." : "→ 양호."}`);
  lines.push("");

  lines.push(`### 해석(의학적 상식 기반)`);
  if (lactateHigh) {
    lines.push(
      `현재 ${demo.analyte}가 상대적으로 높게 나타납니다. 운동 직후/스트레스/탈수 상황에서 이런 패턴이 관찰될 수 있습니다. ${cite(
        "Lactate_Exercise_High"
      )}`
    );
  } else {
    lines.push(`현재 ${demo.analyte}는 비교적 안정적인 범위로 보입니다. ${cite("Lactate_Exercise_Normal")}`);
  }
  lines.push(
    `신호 형태 관점에서, CV 곡선의 [[OXIDATION_PEAK]] 및 EIS Nyquist 반원 크기는 반응 속도(ReactionKinetics)와 막 투과도(MembranePermeability)에 영향을 받습니다. (시뮬 설명)`
  );
  lines.push("");

  lines.push(`### 공학적 연결(원시 신호 ↔ 생리 상태)`);
  lines.push(
    `- ReactionKinetics=${l2.reactionKinetics.toFixed(3)}: 반응 속도가 느려지면 피크가 둔화/완만해질 수 있습니다.`
  );
  lines.push(
    `- MembranePermeability=${l2.membranePermeability.toFixed(3)}: 투과도가 낮으면 전하 이동이 제한되어 임피던스 반원이 커지는 형태로 나타날 수 있습니다.`
  );
  lines.push(`- SignalToNoiseRatio=${snr.toFixed(1)}: 낮으면 피크/특징값 추출 오차가 증가합니다.`);
  lines.push("");

  lines.push(`### 권장 조치`);
  if (instantActionRequired) {
    lines.push(`- 즉시 휴식하고 수분을 보충하세요. 필요 시 의료진 상담을 권장합니다. ${cite("WHO_Dehydration_GeneralAdvice")}`);
  } else if (noisy) {
    lines.push(`- 측정 환경을 안정화(손 고정/압력 일정)한 뒤 재측정하세요. ${cite("WHO_Dehydration_GeneralAdvice")}`);
  } else {
    lines.push(`- 물 한 컵을 마시고 10분 후 동일 조건으로 재측정해 보세요. ${cite("WHO_Dehydration_GeneralAdvice")}`);
  }

  // Goal-based tuning (personalization)
  const goals = args.userProfile.goals ?? [];
  if (goals.includes("blood_sugar_control")) {
    lines.push(`- (목표: 혈당 관리) 식후 상황이라면 10–15분 가벼운 걷기, 공복이라면 규칙적인 식사/수면 리듬을 우선하세요.`);
  }
  if (goals.includes("muscle_gain")) {
    lines.push(`- (목표: 근육 증가) 컨디션이 낮을 땐 회복(수면/수분) 우선, 양호할 땐 단백질/탄수 타이밍과 과훈련 방지에 집중하세요.`);
  }
  if (goals.includes("stress_management")) {
    lines.push(`- (목표: 스트레스 관리) 3분 복식호흡(4초 들숨/6초 날숨) + 카페인/야식 줄이기 + 취침/기상 시간 고정을 추천합니다.`);
  }

  const bodyText = lines.join("\n");

  return {
    prompt,
    bodyText,
    footnotes,
    tags: { mentionsOxidationPeak, instantActionRequired }
  };
}


