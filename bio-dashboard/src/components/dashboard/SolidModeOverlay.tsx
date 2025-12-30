"use client";

import * as React from "react";
import { ShieldAlert, Timer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SolidModeOverlay({
  open,
  onOpenChange,
  onConfirmHoldComplete,
  onHoldStart,
  className
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmHoldComplete: () => void;
  onHoldStart?: () => void;
  className?: string;
}) {
  const [secondsLeft, setSecondsLeft] = React.useState<number>(3);
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSecondsLeft(3);
      setRunning(false);
      return;
    }
  }, [open]);

  React.useEffect(() => {
    if (!open || !running) return;
    if (secondsLeft <= 0) return;

    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, running, secondsLeft]);

  React.useEffect(() => {
    if (!open) return;
    if (!running) return;
    if (secondsLeft > 0) return;
    onConfirmHoldComplete();
    onOpenChange(false);
  }, [open, running, secondsLeft, onConfirmHoldComplete, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-md", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-sky-600" />
            Solid Mode (Hydrogel)
          </DialogTitle>
          <DialogDescription>
            Press probe firmly against the surface. Maintain pressure for <b>3 seconds</b>.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-sky-50/60 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-sky-900">Hold countdown</div>
            <div className="flex items-center gap-1 text-sky-700">
              <Timer className="w-4 h-4" />
              <span className="font-semibold">{Math.max(0, secondsLeft)}s</span>
            </div>
          </div>
          <div className="mt-3 h-2 rounded bg-sky-100 overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all"
              style={{ width: `${((3 - Math.max(0, secondsLeft)) / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => {
              onHoldStart?.();
              setRunning(true);
            }}
            disabled={running}
          >
            {running ? "Holding..." : "Start Hold"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SolidModeOverlay;


