"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useAppToast } from "@/components/system/AppToast";
import type { MedLedgerEntry } from "@/lib/med-ledger";
import { intakeKey, todayKeyLocal } from "@/lib/med-ledger";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type LedgerResponse = {
  entries: MedLedgerEntry[];
  intakes: Record<string, { takenAtUtc: string; amount?: number }>;
};

function nowHHMM() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function nowMs() {
  return Date.now();
}

export function MedicationReminderAgent() {
  const { data: session, status } = useSession();
  const { toast } = useAppToast();

  const mfaVerified = (session?.user as any)?.mfaVerified === true;

  const [entries, setEntries] = React.useState<MedLedgerEntry[]>([]);
  const [intakes, setIntakes] = React.useState<Record<string, { takenAtUtc: string; amount?: number }>>({});

  const [snoozeOpen, setSnoozeOpen] = React.useState(false);
  const [snoozeTarget, setSnoozeTarget] = React.useState<{
    entry: MedLedgerEntry;
    date: string;
    time: string;
  } | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/med-ledger");
      const json = (await res.json().catch(() => null)) as LedgerResponse | null;
      if (!res.ok || !json) return;
      setEntries(json.entries ?? []);
      setIntakes(json.intakes ?? {});
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    if (status !== "authenticated" || !mfaVerified) return;
    load();
    const t = setInterval(load, 5 * 60_000);
    return () => clearInterval(t);
  }, [status, mfaVerified, load]);

  React.useEffect(() => {
    if (status !== "authenticated" || !mfaVerified) return;

    const tick = async () => {
      const date = todayKeyLocal();
      const hhmm = nowHHMM();
      const now = nowMs();

      const maybeNotify = async (e: MedLedgerEntry, scheduledTime: string, reason: "scheduled" | "snoozed") => {
        const key = intakeKey(e.id, date, scheduledTime);
        if (intakes[key]) return; // already taken

        // One-time skip for this scheduled time today
        const skipKey = `manpasik:medreminder:skipOnce:${key}`;
        if (localStorage.getItem(skipKey) === "1") {
          localStorage.removeItem(skipKey);
          return;
        }

        const deferKey = `manpasik:medreminder:deferUntil:${key}`;
        const deferUntil = Number(localStorage.getItem(deferKey) ?? "0");
        if (Number.isFinite(deferUntil) && deferUntil > now) {
          return; // still snoozed
        }
        if (deferUntil > 0 && deferUntil <= now) {
          // snooze window ended; clear so future logic doesn't keep thinking it's deferred
          localStorage.removeItem(deferKey);
        }

        // spam guard: don't re-toast the same key more than once per minute
        const notifiedKey = `manpasik:medreminder:notifiedAt:${key}`;
        const last = Number(localStorage.getItem(notifiedKey) ?? "0");
        if (Number.isFinite(last) && now - last < 60_000) return;
        localStorage.setItem(notifiedKey, String(now));

        const title = "복용 알림";
        const desc = `${e.name} · ${e.dose.amount} ${e.dose.unit} · ${scheduledTime}${reason === "snoozed" ? " (스누즈)" : ""}`;

        toast({
          title,
          description: desc,
          variant: "warning",
          durationMs: 12_000,
          actions: [
            {
              label: "복용 완료",
              onClick: async () => {
                await fetch("/api/med-ledger/intake", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ entryId: e.id, date, time: scheduledTime })
                });
                setIntakes((prev) => ({
                  ...prev,
                  [key]: { takenAtUtc: new Date().toISOString() }
                }));
              }
            },
            {
              label: "스누즈",
              onClick: async () => {
                setSnoozeTarget({ entry: e, date, time: scheduledTime });
                setSnoozeOpen(true);
              }
            }
          ]
        });

        // Browser Notification (optional)
        try {
          if ("Notification" in window) {
            if (Notification.permission === "default") {
              await Notification.requestPermission();
            }
            if (Notification.permission === "granted") {
              new Notification(title, { body: desc });
            }
          }
        } catch {
          // ignore
        }
      };

      // 1) Scheduled due now
      for (const e of entries) {
        if (!e.active) continue;
        if (!e.scheduleTimes.includes(hhmm)) continue;
        await maybeNotify(e, hhmm, "scheduled");
      }

      // 2) Snoozed reminders whose deferUntil has matured (re-alert even if not exact HH:MM anymore)
      for (const e of entries) {
        if (!e.active) continue;
        for (const t of e.scheduleTimes) {
          const key = intakeKey(e.id, date, t);
          if (intakes[key]) continue;
          const deferKey = `manpasik:medreminder:deferUntil:${key}`;
          const deferUntil = Number(localStorage.getItem(deferKey) ?? "0");
          if (Number.isFinite(deferUntil) && deferUntil > 0 && deferUntil <= now) {
            await maybeNotify(e, t, "snoozed");
          }
        }
      }
    };

    // check every 30s
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [status, mfaVerified, entries, intakes, toast]);

  const applySnooze = (minutes: 5 | 10 | 30) => {
    if (!snoozeTarget) return;
    const key = intakeKey(snoozeTarget.entry.id, snoozeTarget.date, snoozeTarget.time);
    const deferKey = `manpasik:medreminder:deferUntil:${key}`;
    localStorage.setItem(deferKey, String(Date.now() + minutes * 60_000));
    setSnoozeOpen(false);
    setSnoozeTarget(null);
    toast({
      title: "스누즈 설정됨",
      description: `${snoozeTarget.entry.name} · ${minutes}분 뒤 다시 알림`,
      variant: "default",
      durationMs: 2500
    });
  };

  const skipOnceToday = () => {
    if (!snoozeTarget) return;
    const key = intakeKey(snoozeTarget.entry.id, snoozeTarget.date, snoozeTarget.time);
    const skipKey = `manpasik:medreminder:skipOnce:${key}`;
    localStorage.setItem(skipKey, "1");
    setSnoozeOpen(false);
    const name = snoozeTarget.entry.name;
    const t = snoozeTarget.time;
    setSnoozeTarget(null);
    toast({
      title: "오늘은 1회 무시",
      description: `${name} · ${t} 알림을 오늘은 표시하지 않습니다.`,
      variant: "default",
      durationMs: 2500
    });
  };

  return (
    <>
      <Dialog
        open={snoozeOpen}
        onOpenChange={(open) => {
          setSnoozeOpen(open);
          if (!open) setSnoozeTarget(null);
        }}
      >
        <DialogContent className="p-0">
          <DialogHeader>
            <DialogTitle>스누즈 시간 선택</DialogTitle>
            <DialogDescription>
              {snoozeTarget ? (
                <span className="font-mono">
                  {snoozeTarget.entry.name} · {snoozeTarget.time}
                </span>
              ) : (
                "복용 알림을 잠시 미룹니다."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-4 flex gap-2">
            <Button className="flex-1" variant="outline" onClick={() => applySnooze(5)}>
              5분
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => applySnooze(10)}>
              10분
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => applySnooze(30)}>
              30분
            </Button>
          </div>
          <div className="px-4 pb-4 -mt-2">
            <Button variant="ghost" className="w-full text-xs" onClick={skipOnceToday}>
              오늘은 이 시간 알림 끄기(1회 무시)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


