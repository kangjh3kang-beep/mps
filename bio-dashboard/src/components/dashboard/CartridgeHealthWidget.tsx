"use client";

import React from "react";
import { Battery, Leaf, ShoppingBag, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { CartridgeInfo, CalibrationParameters } from "@/lib/cartridge";
import {
  computeRemainingLife,
  DEFAULT_INITIAL_CAPACITY,
  DEFAULT_OXIDATION_FACTOR_PER_HOUR,
  getOxidationFactorPerHour,
  getWearFactor,
  getWearFactorAdvanced,
  hoursSince,
  type EnvironmentalContext,
  type TestType
} from "@/lib/sensor-life";
import { getRAFEController } from "@/lib/rafe-controller";
import { getEHDDriver } from "@/lib/ehd-driver";

export function CartridgeHealthWidget({
  activeCartridge,
  calibration,
  testType,
  onOpenMall
}: {
  activeCartridge: CartridgeInfo | null;
  calibration: CalibrationParameters | null;
  testType: TestType;
  onOpenMall?: () => void;
}) {
  const [showDisposal, setShowDisposal] = React.useState(false);
  const [showReplenish, setShowReplenish] = React.useState(false);

  const prediction = React.useMemo(() => {
    if (!activeCartridge) return null;
    const rafeCategory = getRAFEController().getState().category;
    const isGasMode = rafeCategory === "gas";

    const env: EnvironmentalContext | undefined = isGasMode
      ? {
          humidityPct: getEHDDriver().getState().humidityPct,
          temperatureC: 25
        }
      : undefined;

    const effectiveTestType: TestType = isGasMode ? "gas" : testType;

    const wearFactor = env ? getWearFactorAdvanced(effectiveTestType, env) : getWearFactor(effectiveTestType);
    const timeHours = hoursSince(activeCartridge.openedAt ?? activeCartridge.registeredAt);
    const oxidationFactor = env ? getOxidationFactorPerHour(effectiveTestType, env) : DEFAULT_OXIDATION_FACTOR_PER_HOUR;
    return computeRemainingLife({
      initialCapacity: DEFAULT_INITIAL_CAPACITY,
      usageCount: activeCartridge.usageCount,
      wearFactor,
      timeSinceOpenHours: timeHours,
      oxidationFactor
    });
  }, [activeCartridge, testType]);

  // one-time popups per cartridge id
  React.useEffect(() => {
    if (!activeCartridge || !prediction) return;
    const id = activeCartridge.id;
    const disposalKey = `manpasik:disposalShown:${id}`;
    const replenishKey = `manpasik:replenishShown:${id}`;

    if (prediction.remainingPct <= 0) {
      const shown = typeof window !== "undefined" ? localStorage.getItem(disposalKey) : null;
      if (!shown) {
        setShowDisposal(true);
        try { localStorage.setItem(disposalKey, "1"); } catch {}
      }
    } else if (prediction.remainingPct < 10) {
      const shown = typeof window !== "undefined" ? localStorage.getItem(replenishKey) : null;
      if (!shown) {
        setShowReplenish(true);
        try { localStorage.setItem(replenishKey, "1"); } catch {}
      }
    }
  }, [activeCartridge, prediction]);

  const { t } = useI18n();
  
  if (!activeCartridge || !prediction) {
    return (
      <Card className="border shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Battery className="w-4 h-4 text-muted-foreground" />
            {t("cartridge.title")}
          </CardTitle>
          <CardDescription className="text-xs">{t("cartridge.insertScan")}</CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {t("cartridge.noActive")}
        </CardContent>
      </Card>
    );
  }

  const pct = Math.round(prediction.remainingPct);
  const approx = prediction.approxTestsRemaining;
  const isLow = pct < 10 && pct > 0;
  const isEmpty = pct <= 0;

  const rafeCategory = getRAFEController().getState().category;
  const isGasMode = rafeCategory === "gas";
  const humidityPct = isGasMode ? getEHDDriver().getState().humidityPct : null;

  const precisionBadge = calibration?.precision === "low" ? (
    <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px]">저정밀</Badge>
  ) : (
    <Badge variant="secondary" className="text-[10px]">정상</Badge>
  );

  return (
    <>
      <Card className="border shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Battery className={cn("w-4 h-4", isEmpty ? "text-rose-600" : isLow ? "text-amber-600" : "text-emerald-600")} />
                {t("cartridge.title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {pct}% (약 {approx}회 측정 가능)
              </CardDescription>
            </div>
            {precisionBadge}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={pct} />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>식별자: {activeCartridge.id}</span>
            <span>
              유형: {(isGasMode ? "가스" : testType === "liquid" ? "액체" : testType === "solid" ? "고체" : testType.toUpperCase())}
              {isGasMode && humidityPct !== null ? ` · 습도 ${humidityPct.toFixed(0)}%` : ""}
            </span>
          </div>

          {isLow && (
            <div className="flex items-center justify-between p-2 rounded-lg border border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4" />
                카트리지가 거의 소진되었습니다. 교체 주문하시겠습니까?
              </div>
              <Button size="sm" className="h-7 text-xs" onClick={onOpenMall}>
                <ShoppingBag className="w-3 h-3 mr-1" />
                몰
              </Button>
            </div>
          )}

          {isEmpty && (
            <Button variant="outline" className="w-full" onClick={() => setShowDisposal(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Biodegradable Disposal Guide
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Disposal Guide Popup */}
      <Dialog open={showDisposal} onOpenChange={setShowDisposal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-600" />
              Biodegradable Disposal Guide
            </DialogTitle>
            <DialogDescription>
              This cartridge uses biodegradable materials (PLA/PHA). Please dispose responsibly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="rounded-lg border p-3 bg-emerald-50/40">
              <div className="font-medium text-emerald-800">Recommended steps</div>
              <ul className="list-disc pl-5 mt-2 text-emerald-900/80 space-y-1">
                <li>Seal used cartridge in the provided bio-bag.</li>
                <li>Dispose in compostable waste (if available) or designated bio-plastics bin.</li>
                <li>Avoid high-heat incineration to reduce unnecessary emissions.</li>
              </ul>
            </div>
            <div className="text-xs text-muted-foreground">
              Note: Local disposal rules vary. Follow municipal guidelines.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Replenishment notification popup */}
      <Dialog open={showReplenish} onOpenChange={setShowReplenish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              Cartridge nearly empty
            </DialogTitle>
            <DialogDescription>
              Health is below 10%. Order a replacement from Manpasik Mall?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={onOpenMall}>
              Open Mall
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowReplenish(false)}>
              Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CartridgeHealthWidget;


