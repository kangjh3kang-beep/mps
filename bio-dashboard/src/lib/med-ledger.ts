export type MedCategory = "medicine" | "supplement";

export type MedDose = {
  amount: number;
  unit: string; // e.g., "mg", "g", "IU", "tablet"
};

export type MedLedgerEntry = {
  id: string;
  name: string;
  category: MedCategory;
  dose: MedDose;
  scheduleTimes: string[]; // ["08:00","21:00"]
  notes?: string;
  active: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type IntakeRecord = {
  takenAtUtc: string;
  amount?: number;
};

export function isValidTimeHHMM(s: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

export function normalizeTimes(raw: string[]): string[] {
  const set = new Set(
    raw
      .map((t) => t.trim())
      .filter(Boolean)
      .filter(isValidTimeHHMM)
  );
  return Array.from(set.values()).sort();
}

export function todayKeyLocal(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function intakeKey(entryId: string, dateKey: string, timeHHMM: string) {
  return `${entryId}|${dateKey}|${timeHHMM}`;
}







