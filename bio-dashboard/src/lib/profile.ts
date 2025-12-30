export type HealthGoal = "muscle_gain" | "blood_sugar_control" | "stress_management";

export type UserProfile = {
  userId: string;
  createdAtUtc: string;
  updatedAtUtc: string;

  // Step 1 (Basic)
  age: number | null;
  gender: "female" | "male" | "other" | null;
  heightCm: number | null;
  weightKg: number | null;

  // Step 2 (Medical)
  chronicDiseases: Array<"diabetes" | "hypertension" | "ckd" | "heart_failure" | "cad">;
  medications: string[];
  allergies: string[];

  // Step 3 (Lifestyle)
  smoking: "never" | "former" | "current" | null;
  drinking: "none" | "social" | "regular" | null;
  exercisePerWeek: number | null; // 0..14
  sleepHours: number | null; // avg

  // Step 4 (Goals)
  goals: HealthGoal[];

  completed: boolean;
};

export function computeBmi(heightCm: number | null, weightKg: number | null): number | null {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  if (m <= 0) return null;
  return weightKg / (m * m);
}







