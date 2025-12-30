"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Activity, ClipboardList, FileText, LogOut, Pill, Settings, Target, Trash2, User as UserIcon } from "lucide-react";

import { UserProvider, useUser } from "@/context/UserContext";
import { I18nProvider } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { computeBmi, type HealthGoal, type UserProfile } from "@/lib/profile";
import { type MedLedgerEntry, todayKeyLocal, intakeKey, normalizeTimes } from "@/lib/med-ledger";
import { buildSupplementCoaching } from "@/lib/supplement-coach";
import { useSettings } from "@/context/SettingsContext";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

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

function MyPageInner() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const user = useUser();
  const { settings, setSetting } = useSettings();

  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [medEntries, setMedEntries] = React.useState<MedLedgerEntry[]>([]);
  const [intakes, setIntakes] = React.useState<Record<string, { takenAtUtc: string; amount?: number }>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (status === "unauthenticated") router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/my")}`);
  }, [status, router]);

  React.useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/profile");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
        setProfile(json.profile);

        const m = await fetch("/api/med-ledger");
        const mj = await m.json().catch(() => ({}));
        if (m.ok) {
          setMedEntries(mj.entries ?? []);
          setIntakes(mj.intakes ?? {});
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const bmi = computeBmi(profile?.heightCm ?? null, profile?.weightKg ?? null);

  const timeline = React.useMemo(() => {
    const events: Array<{ ts: number; type: string; title: string; detail?: string }> = [];
    user.measurements.forEach((m) => {
      events.push({
        ts: m.ts,
        type: "measurement",
        title: `Measurement: ${m.concentrationMmolL.toFixed(2)} mmol/L`,
        detail: `id=${m.id}`
      });
    });
    user.appointments.forEach((a) => {
      events.push({
        ts: new Date(`${a.date}T${a.time}`).getTime(),
        type: "hospital",
        title: `Hospital: ${a.hospitalName} (${a.specialty})`,
        detail: `${a.doctorName ?? ""} ${a.status}`
      });
    });
    user.prescriptions.forEach((p) => {
      events.push({
        ts: new Date(p.prescribedAt).getTime(),
        type: "prescription",
        title: `Prescription: ${p.diagnosisNameKo}`,
        detail: `by ${p.doctorName}`
      });
    });
    return events.sort((a, b) => b.ts - a.ts).slice(0, 80);
  }, [user.measurements, user.appointments, user.prescriptions]);

  const coaching = React.useMemo(() => {
    return buildSupplementCoaching({
      goals: user.goals,
      latestConcentrationMmolL: user.latestConcentration,
      entries: medEntries
    });
  }, [user.goals, user.latestConcentration, medEntries]);

  const [newMed, setNewMed] = React.useState({
    name: "",
    category: "supplement" as "supplement" | "medicine",
    doseAmount: 1,
    doseUnit: "tablet",
    times: "08:00,21:00",
    notes: ""
  });

  async function refreshMedLedger() {
    const m = await fetch("/api/med-ledger");
    const mj = await m.json().catch(() => ({}));
    if (m.ok) {
      setMedEntries(mj.entries ?? []);
      setIntakes(mj.intakes ?? {});
    }
  }

  async function addMedEntry() {
    setError(null);
    setLoading(true);
    try {
      const times = normalizeTimes(newMed.times.split(",").map((s) => s.trim()));
      const res = await fetch("/api/med-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMed.name,
          category: newMed.category,
          doseAmount: Number(newMed.doseAmount),
          doseUnit: newMed.doseUnit,
          scheduleTimes: times,
          notes: newMed.notes || undefined
        })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      setNewMed({ ...newMed, name: "", notes: "" });
      await refreshMedLedger();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function deleteMedEntry(id: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/med-ledger?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      await refreshMedLedger();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function markTakenUI(entryId: string, time: string) {
    setError(null);
    try {
      const date = todayKeyLocal();
      const res = await fetch("/api/med-ledger/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, date, time })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      await refreshMedLedger();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function saveGoals(goals: HealthGoal[]) {
    if (!profile) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
      setProfile(json.profile);
      // Immediately reflect goal changes across the app (AI coaching tuning)
      await user.refreshProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30">
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-sky-700" />
            <div>
              <div className="text-lg font-semibold">My Page</div>
              <div className="text-xs text-muted-foreground">{session?.user?.email ?? ""}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/result" prefetch={false}>
                <FileText className="w-4 h-4 mr-1" />
                Results
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/onboarding" prefetch={false}>
                <ClipboardList className="w-4 h-4 mr-1" />
                Onboarding
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Logout"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-3 text-xs text-rose-600 border border-rose-200 bg-rose-50 rounded-lg p-2">
            {error}
          </div>
        )}

        {loading && !profile ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : null}

        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="text-xs">
              <UserIcon className="w-3 h-3 mr-1" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="goals" className="text-xs">
              <Target className="w-3 h-3 mr-1" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="meds" className="text-xs">
              <Pill className="w-3 h-3 mr-1" />
              약계부
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">
              <Activity className="w-3 h-3 mr-1" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="w-3 h-3 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <Card className="border shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Digital Twin Profile</CardTitle>
                <CardDescription className="text-xs">기본/의학/라이프스타일 정보</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <Info label="Age" value={profile?.age ?? "-"} />
                <Info label="Gender" value={profile?.gender ?? "-"} />
                <Info label="Height" value={profile?.heightCm ? `${profile.heightCm} cm` : "-"} />
                <Info label="Weight" value={profile?.weightKg ? `${profile.weightKg} kg` : "-"} />
                <Info label="BMI" value={bmi ? bmi.toFixed(1) : "-"} />
                <Info label="Diseases" value={(profile?.chronicDiseases ?? []).join(", ") || "-"} />
                <Info label="Medications" value={(profile?.medications ?? []).join(", ") || "-"} />
                <Info label="Allergies" value={(profile?.allergies ?? []).join(", ") || "-"} />
                <Info label="Smoking" value={profile?.smoking ?? "-"} />
                <Info label="Drinking" value={profile?.drinking ?? "-"} />
                <Info label="Exercise/week" value={profile?.exercisePerWeek ?? "-"} />
                <Info label="Sleep(hours)" value={profile?.sleepHours ?? "-"} />
                <div className="md:col-span-2 text-xs text-muted-foreground">
                  완료 여부: <span className="font-mono text-foreground">{String(!!profile?.completed)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="mt-4">
            <Card className="border shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Health Goals</CardTitle>
                <CardDescription className="text-xs">목표 변경은 AI 코칭 전략을 튜닝하는 입력으로 사용됩니다(연결 포인트).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(["muscle_gain", "blood_sugar_control", "stress_management"] as HealthGoal[]).map((g) => {
                    const active = profile?.goals?.includes(g) ?? false;
                    return (
                      <Button
                        key={g}
                        size="sm"
                        variant={active ? "default" : "outline"}
                        className="h-8 text-xs"
                        disabled={!profile || loading}
                        onClick={async () => {
                          if (!profile) return;
                          const next = active ? profile.goals.filter((x) => x !== g) : [...profile.goals, g];
                          await saveGoals(next);
                        }}
                      >
                        {goalLabel(g)}
                      </Button>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  현재 목표: <span className="font-mono text-foreground">{(profile?.goals ?? []).join(", ") || "-"}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meds" className="mt-4">
            <div className="space-y-3">
              <Card className="border shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">복용 코칭 (MVP)</CardTitle>
                  <CardDescription className="text-xs">
                    목표(goals) + 최근 측정(젖산) + 약계부를 바탕으로 “추가/제외/조정” 추천을 제공합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {coaching.map((c, idx) => (
                    <div key={idx} className="rounded-lg border bg-white p-3">
                      <div className="text-sm font-medium">{c.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{c.detail}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">약/영양제 등록</CardTitle>
                  <CardDescription className="text-xs">복용량/시간 기반 알림과 기록에 사용됩니다.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-medium">이름</div>
                    <Input value={newMed.name} onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} placeholder="예: magnesium" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium">구분(medicine/supplement)</div>
                    <Input value={newMed.category} onChange={(e) => setNewMed({ ...newMed, category: (e.target.value as any) })} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium">용량(amount)</div>
                    <Input
                      type="number"
                      value={newMed.doseAmount}
                      onChange={(e) => setNewMed({ ...newMed, doseAmount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium">단위(unit)</div>
                    <Input value={newMed.doseUnit} onChange={(e) => setNewMed({ ...newMed, doseUnit: e.target.value })} placeholder="mg / g / tablet" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <div className="text-xs font-medium">복용 시간(HH:MM, 콤마)</div>
                    <Input value={newMed.times} onChange={(e) => setNewMed({ ...newMed, times: e.target.value })} placeholder="08:00,21:00" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <div className="text-xs font-medium">메모</div>
                    <Input value={newMed.notes} onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })} placeholder="선택" />
                  </div>
                  <div className="md:col-span-2">
                    <Button className="w-full" onClick={addMedEntry} disabled={loading || !newMed.name.trim()}>
                      추가
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">약계부 목록</CardTitle>
                  <CardDescription className="text-xs">오늘 복용 여부를 체크할 수 있습니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {medEntries.length === 0 ? (
                    <div className="text-sm text-muted-foreground">등록된 항목이 없습니다.</div>
                  ) : (
                    medEntries.map((e) => {
                      const date = todayKeyLocal();
                      return (
                        <div key={e.id} className="rounded-lg border bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate">{e.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {e.category} · {e.dose.amount} {e.dose.unit}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {e.scheduleTimes.map((t) => {
                                  const key = intakeKey(e.id, date, t);
                                  const taken = !!intakes[key];
                                  return (
                                    <Button
                                      key={t}
                                      size="sm"
                                      variant={taken ? "default" : "outline"}
                                      className="h-7 text-xs"
                                      onClick={() => markTakenUI(e.id, t)}
                                    >
                                      {t} {taken ? "✓" : "복용"}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => deleteMedEntry(e.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <Card className="border shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Medical Timeline</CardTitle>
                <CardDescription className="text-xs">측정/병원/처방 이벤트를 시간순으로 표시(현재는 디바이스 로컬 상태 기반).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {timeline.length === 0 ? (
                  <div className="text-sm text-muted-foreground">이벤트가 없습니다.</div>
                ) : (
                  timeline.map((e, idx) => (
                    <div key={idx} className="rounded-lg border bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{e.title}</div>
                          {e.detail ? <div className="text-xs text-muted-foreground mt-0.5">{e.detail}</div> : null}
                        </div>
                        <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(e.ts).toLocaleString("ko-KR")}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility & Appearance Settings */}
          <TabsContent value="settings" className="mt-4">
            <Card className="border shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">앱 설정</CardTitle>
                <CardDescription className="text-xs">접근성 및 디스플레이 설정</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Senior Mode */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className={settings.seniorMode ? "text-base font-medium" : "text-sm font-medium"}>
                      시니어 모드
                    </div>
                    <div className="text-xs text-muted-foreground">
                      큰 글씨, 간단한 설명, 음성 피드백 활성화
                    </div>
                  </div>
                  <Switch
                    checked={settings.seniorMode}
                    onCheckedChange={(v) => setSetting("seniorMode", v)}
                  />
                </div>

                {/* Dark Mode */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className={settings.seniorMode ? "text-base font-medium" : "text-sm font-medium"}>
                      다크 모드
                    </div>
                    <div className="text-xs text-muted-foreground">
                      어두운 배경으로 눈의 피로 감소
                    </div>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(v) => setSetting("darkMode", v)}
                  />
                </div>

                {/* Font Scale */}
                <div className="space-y-2">
                  <div>
                    <div className={settings.seniorMode ? "text-base font-medium" : "text-sm font-medium"}>
                      글씨 크기
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(settings.fontScale * 100)}%
                    </div>
                  </div>
                  <Slider
                    value={[settings.fontScale]}
                    onValueChange={([v]) => setSetting("fontScale", v)}
                    min={0.9}
                    max={1.6}
                    step={0.05}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>작게</span>
                    <span>보통</span>
                    <span>크게</span>
                  </div>
                </div>

                {/* Voice Commands Note */}
                <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                  <div className={settings.seniorMode ? "text-base font-medium text-sky-800" : "text-sm font-medium text-sky-800"}>
                    💡 음성 명령 사용하기
                  </div>
                  <div className="text-xs text-sky-700 mt-1">
                    AI 코치 채팅에서 마이크 버튼을 눌러 음성으로 질문할 수 있습니다.
                    <br />예: "혈당 측정해줘", "스토어로 이동해줘", "시니어 모드 켜줘"
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm">{value}</div>
    </div>
  );
}

export default function MyPage() {
  return (
    <I18nProvider>
      <UserProvider>
        <MyPageInner />
      </UserProvider>
    </I18nProvider>
  );
}


