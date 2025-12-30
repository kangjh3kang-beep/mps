import type { HealthGoal } from "@/lib/profile";
import type { MedLedgerEntry } from "@/lib/med-ledger";

export type CoachingSuggestion = {
  type: "add" | "remove" | "adjust" | "adherence";
  title: string;
  detail: string;
};

function hasName(entries: MedLedgerEntry[], needle: string) {
  const n = needle.toLowerCase();
  return entries.some((e) => e.active && e.name.toLowerCase().includes(n));
}

function anyScheduledAfter(entries: MedLedgerEntry[], needle: string, hhmm: string) {
  const n = needle.toLowerCase();
  return entries.some((e) => {
    if (!e.active) return false;
    if (!e.name.toLowerCase().includes(n)) return false;
    return e.scheduleTimes.some((t) => t >= hhmm);
  });
}

export function buildSupplementCoaching(args: {
  goals: HealthGoal[];
  latestConcentrationMmolL: number;
  entries: MedLedgerEntry[];
}): CoachingSuggestion[] {
  const { goals, latestConcentrationMmolL, entries } = args;
  const out: CoachingSuggestion[] = [];

  const lactateHigh = latestConcentrationMmolL >= 2.5;

  if (goals.includes("stress_management")) {
    if (!hasName(entries, "magnesium")) {
      out.push({
        type: "add",
        title: "스트레스/수면: 마그네슘 추가 고려",
        detail: "목표가 스트레스 관리라면 저녁(예: 21:00)에 magnesium을 추가해볼 수 있어요. (개인 상태/약물과 상호작용은 전문가 확인 권장)"
      });
    }
    if (anyScheduledAfter(entries, "caffeine", "14:00")) {
      out.push({
        type: "adjust",
        title: "카페인 복용 시간 조정",
        detail: "14:00 이후 caffeine(또는 유사 자극제) 복용은 스트레스/수면 목표에 불리할 수 있어요. 오전으로 옮기거나 제외를 고려하세요."
      });
    }
  }

  if (goals.includes("muscle_gain")) {
    if (!hasName(entries, "creatine")) {
      out.push({
        type: "add",
        title: "근육 증가: 크레아틴(creatorine) 추가 고려",
        detail: "목표가 근육 증가라면 creatine 3–5g/day를 루틴으로 고려할 수 있어요. (신장질환/약물 복용 시 상담 권장)"
      });
    }
    if (lactateHigh) {
      out.push({
        type: "adjust",
        title: "피로 신호(젖산↑): 오늘은 회복 우선",
        detail: `젖산이 ${latestConcentrationMmolL.toFixed(1)} mmol/L로 높아 회복 우선이 좋아요. 강도는 낮추고 수면/수분/가벼운 걷기를 우선하세요.`
      });
    }
  }

  if (goals.includes("blood_sugar_control")) {
    if (!hasName(entries, "fiber") && !hasName(entries, "psyllium")) {
      out.push({
        type: "add",
        title: "혈당 관리: 식이섬유 보조제 고려",
        detail: "혈당 목표라면 psyllium/fiber 같은 식이섬유를 식사와 함께 고려할 수 있어요. (소화기 증상/약물 상호작용 주의)"
      });
    }
    out.push({
      type: "adjust",
      title: "혈당 목표: 식후 루틴",
      detail: "식후(특히 postprandial)엔 10–15분 가벼운 걷기와 야식/당류 조절이 우선입니다."
    });
  }

  if (out.length === 0) {
    out.push({
      type: "adherence",
      title: "현재 루틴 유지",
      detail: "등록된 목표/복용 내역 기준으로 큰 조정 포인트는 없어 보여요. 측정 데이터가 흔들릴 때만 미세 조정해보세요."
    });
  }

  return out.slice(0, 5);
}







