"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "warning";

export type AppToastAction = {
  label: string;
  onClick: () => void | Promise<void>;
};

export type AppToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
  actions?: AppToastAction[];
};

type AppToast = Required<Omit<AppToastInput, "actions">> & {
  actions: AppToastAction[];
  id: string;
  createdAt: number;
};

type Ctx = {
  toast: (t: AppToastInput) => void;
};

const ToastContext = React.createContext<Ctx | null>(null);

export function AppToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<AppToast[]>([]);

  const toast = React.useCallback((input: AppToastInput) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const t: AppToast = {
      id,
      title: input.title,
      description: input.description ?? "",
      variant: input.variant ?? "default",
      durationMs: input.durationMs ?? 2500,
      actions: input.actions ?? [],
      createdAt: Date.now()
    };
    setToasts((prev) => [...prev.slice(-4), t]);

    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, t.durationMs);

    // best-effort cleanup if unmounted early
    return () => clearTimeout(timeout);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <AppToaster toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
    </ToastContext.Provider>
  );
}

export function useAppToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useAppToast must be used within AppToastProvider");
  return ctx;
}

function AppToaster({
  toasts,
  onDismiss
}: {
  toasts: AppToast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[92vw] max-w-md pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto rounded-xl border shadow-lg backdrop-blur-xl",
            "px-4 py-3 bg-white/98",
            t.variant === "warning" ? "border-amber-200" : "border-slate-200"
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={cn("text-sm font-semibold", t.variant === "warning" ? "text-amber-900" : "text-slate-900")}>
                {t.title}
              </div>
              {t.description ? (
                <div className={cn("text-xs mt-0.5", t.variant === "warning" ? "text-amber-800/80" : "text-slate-600")}>
                  {t.description}
                </div>
              ) : null}
              {t.actions.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {t.actions.slice(0, 2).map((a, i) => (
                    <button
                      key={`${t.id}-act-${i}`}
                      className={cn(
                        "text-xs font-semibold rounded-lg border px-2 py-1",
                        "bg-white hover:bg-slate-50",
                        t.variant === "warning" ? "border-amber-200 text-amber-900" : "border-slate-200 text-slate-900"
                      )}
                      onClick={async () => {
                        try {
                          await a.onClick();
                        } finally {
                          onDismiss(t.id);
                        }
                      }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              className="shrink-0 rounded-md p-1 hover:bg-slate-100"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}


