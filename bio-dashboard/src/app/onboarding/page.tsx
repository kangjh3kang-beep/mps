"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { computeBmi, type HealthGoal, type UserProfile } from "@/lib/profile";

type Step = 1 | 2 | 3 | 4;

function goalLabel(g: HealthGoal) {
  switch (g) {
    case "muscle_gain":
      return "Muscle Gain";
    case "blood_sugar_control":
      return "Blood Sugar Control";
    case "stress_management":
      return "Stress Management";
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { status } = useSession();

  const [step, setStep] = React.useState<Step>(1);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (status === "unauthenticated") router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/onboarding")}`);
  }, [status, router]);

  React.useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) return;
      const json = await res.json();
      setProfile(json.profile);
      if (json.profile?.completed) {
        router.push("/my");
      }
    };
    run();
  }, [router]);

  async function save(patch: Partial<UserProfile>, done?: boolean) {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patch, ...(done ? { completed: true } : {}) })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
      setProfile(json.profile);
      if (done) router.push("/my");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const bmi = computeBmi(profile?.heightCm ?? null, profile?.weightKg ?? null);

  if (!profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sky-700" />
            <div>
              <div className="text-lg font-semibold">Digital Twin Onboarding</div>
              <div className="text-xs text-muted-foreground">개인화 AI를 위한 프로필 설정</div>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            Step {step}/4
          </Badge>
        </div>

        {error && (
          <div className="mb-3 text-xs text-rose-600 border border-rose-200 bg-rose-50 rounded-lg p-2">
            {error}
          </div>
        )}

        <Card className="border shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {step === 1 && "Step 1 — Basic"}
              {step === 2 && "Step 2 — Medical"}
              {step === 3 && "Step 3 — Lifestyle"}
              {step === 4 && "Step 4 — Goals"}
            </CardTitle>
            <CardDescription className="text-xs">필드는 이후 마이페이지에서 수정 가능합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Age">
                  <Input
                    value={profile.age ?? ""}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value ? Number(e.target.value) : null })}
                    type="number"
                    className="h-9"
                  />
                </Field>
                <Field label="Gender (female/male/other)">
                  <Input
                    value={profile.gender ?? ""}
                    onChange={(e) => setProfile({ ...profile, gender: (e.target.value as any) || null })}
                    placeholder="female / male / other"
                    className="h-9"
                  />
                </Field>
                <Field label="Height (cm)">
                  <Input
                    value={profile.heightCm ?? ""}
                    onChange={(e) => setProfile({ ...profile, heightCm: e.target.value ? Number(e.target.value) : null })}
                    type="number"
                    className="h-9"
                  />
                </Field>
                <Field label="Weight (kg)">
                  <Input
                    value={profile.weightKg ?? ""}
                    onChange={(e) => setProfile({ ...profile, weightKg: e.target.value ? Number(e.target.value) : null })}
                    type="number"
                    className="h-9"
                  />
                </Field>
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground">
                    BMI: <span className="font-mono text-foreground">{bmi ? bmi.toFixed(1) : "-"}</span>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <Field label="Chronic Diseases (comma)">
                  <Input
                    value={profile.chronicDiseases.join(",")}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        chronicDiseases: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean) as any
                      })
                    }
                    placeholder="diabetes,hypertension"
                    className="h-9"
                  />
                </Field>
                <Field label="Medications (comma)">
                  <Input
                    value={profile.medications.join(",")}
                    onChange={(e) => setProfile({ ...profile, medications: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                    placeholder="metformin, statin"
                    className="h-9"
                  />
                </Field>
                <Field label="Allergies (comma)">
                  <Input
                    value={profile.allergies.join(",")}
                    onChange={(e) => setProfile({ ...profile, allergies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                    placeholder="penicillin"
                    className="h-9"
                  />
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Smoking (never/former/current)">
                  <Input
                    value={profile.smoking ?? ""}
                    onChange={(e) => setProfile({ ...profile, smoking: (e.target.value as any) || null })}
                    placeholder="never"
                    className="h-9"
                  />
                </Field>
                <Field label="Drinking (none/social/regular)">
                  <Input
                    value={profile.drinking ?? ""}
                    onChange={(e) => setProfile({ ...profile, drinking: (e.target.value as any) || null })}
                    placeholder="social"
                    className="h-9"
                  />
                </Field>
                <Field label="Exercise / week">
                  <Input
                    value={profile.exercisePerWeek ?? ""}
                    onChange={(e) => setProfile({ ...profile, exercisePerWeek: e.target.value ? Number(e.target.value) : null })}
                    type="number"
                    className="h-9"
                  />
                </Field>
                <Field label="Sleep hours (avg)">
                  <Input
                    value={profile.sleepHours ?? ""}
                    onChange={(e) => setProfile({ ...profile, sleepHours: e.target.value ? Number(e.target.value) : null })}
                    type="number"
                    className="h-9"
                  />
                </Field>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">목표를 선택하세요(복수 가능)</div>
                <div className="flex flex-wrap gap-2">
                  {(["muscle_gain", "blood_sugar_control", "stress_management"] as HealthGoal[]).map((g) => {
                    const active = profile.goals.includes(g);
                    return (
                      <Button
                        key={g}
                        size="sm"
                        variant={active ? "default" : "outline"}
                        className="h-8 text-xs"
                        onClick={() => {
                          setProfile({
                            ...profile,
                            goals: active ? profile.goals.filter((x) => x !== g) : [...profile.goals, g]
                          });
                        }}
                      >
                        {goalLabel(g)}
                      </Button>
                    );
                  })}
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  완료 후 AI 코칭이 목표에 맞게 조정됩니다.
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))} disabled={step === 1 || saving}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                이전
              </Button>
              <div className="flex gap-2">
                {step < 4 ? (
                  <Button
                    onClick={async () => {
                      // save partial then go next
                      await save(profile);
                      setStep((s) => ((s + 1) as Step));
                    }}
                    disabled={saving}
                  >
                    다음
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={() => save(profile, true)} disabled={saving}>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    완료
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium">{label}</div>
      {children}
    </div>
  );
}







