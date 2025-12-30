"use client";

import React, { useState, useEffect } from "react";
import {
  Droplets,
  Wind,
  Bug,
  Power,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Activity,
  Cpu,
  CircleDot,
  SlidersHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  useRAFE,
  RAFEMode,
  MODE_PRESETS,
  type RAFEState,
  type PinConfig,
  type SwitchState
} from "@/lib/rafe-controller";
import { useI18n } from "@/lib/i18n";
import { cartridgeEcosystem } from "@/lib/cartridge-ecosystem";
import { useAppToast } from "@/components/system/AppToast";

/* ============================================
 * Hardware Topology Widget
 * 
 * Visualizes the RAFE chip configuration:
 * - Active mode display
 * - Pin status indicators
 * - Switch matrix visualization
 * - Mode switching controls
 * ============================================ */

interface HardwareTopologyWidgetProps {
  compact?: boolean;
  showLogs?: boolean;
  className?: string;
  onMeasure?: (mode: RAFEMode, data: { value: number; unit: string }) => void;
}

export function HardwareTopologyWidget({
  compact = false,
  showLogs = false,
  className,
  onMeasure
}: HardwareTopologyWidgetProps) {
  const { t, locale } = useI18n();
  const {
    state,
    lockState,
    isTransitioning,
    setMode,
    selectTargetAnalyte,
    runCalibration,
    getModePreset,
    simulateMeasurement,
    getSwitchMatrixLog,
    getAvailableModes
  } = useRAFE();
  const { toast } = useAppToast();

  const notifyLocked = React.useCallback(() => {
    toast({
      title: "Stabilizing… 변경 불가",
      description: "접촉 안정화(홀드 3초) 중에는 SDMS/RAFE 설정 변경이 잠깐 잠깁니다.",
      variant: "warning"
    });
  }, [toast]);

  const isLocked = !!lockState.locked;

  // SDMS profile selection (shared with CartridgeScanner via localStorage keys)
  const USER_ID = "demo-user";
  const LS_PROFILE_KEY = "manpasik:sdms:selectedProfileId";
  const LS_GAS_PREF_KEY = "manpasik:sdms:gasPreference"; // auto | radon | vocs
  type GasPreference = "auto" | "radon" | "vocs";
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [gasPreference, setGasPreference] = useState<GasPreference>("auto");

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(LS_PROFILE_KEY);
      if (savedProfile) setSelectedProfileId(savedProfile);
      const savedGasPref = localStorage.getItem(LS_GAS_PREF_KEY) as GasPreference | null;
      if (savedGasPref === "auto" || savedGasPref === "radon" || savedGasPref === "vocs") {
        setGasPreference(savedGasPref);
      }
    } catch {
      // ignore
    }
  }, []);

  const syncedProfiles = React.useMemo(() => {
    const lib = cartridgeEcosystem.getUserLibrary(USER_ID);
    const items = lib.cartridges
      .slice()
      .sort((a, b) => (b.lastSyncAt ?? b.purchasedAt) - (a.lastSyncAt ?? a.purchasedAt));
    const synced = items.filter((x) => x.syncedToDevice);
    return (synced.length > 0 ? synced : items)
      .map((item) => {
        const profile = cartridgeEcosystem.getCartridgeById(item.cartridgeId);
        return profile ? { item, profile } : null;
      })
      .filter(Boolean) as any[];
  }, []);

  const effectiveProfile = React.useMemo(() => {
    if (syncedProfiles.length === 0) return null;
    const selected = selectedProfileId ? syncedProfiles.find((x) => x.profile.id === selectedProfileId) : null;
    return selected ?? syncedProfiles[0];
  }, [syncedProfiles, selectedProfileId]);

  const pickAnalyteFromProfile = React.useCallback(
    (profile: any) => {
      const analytes = (profile?.spec?.targetAnalytes ?? []) as { id: string; name: string; nameKo: string }[];
      if (analytes.length === 0) return null;
      const hasRadon = analytes.some((a) => a.id === "radon");
      const hasVocs = analytes.some((a) => a.id === "vocs");
      const base = ["ammonia", "h2s", "co2", "glucose", "lactate"];
      const preferredOrder =
        gasPreference === "radon"
          ? ["radon", "vocs", ...base]
          : gasPreference === "vocs"
            ? ["vocs", "radon", ...base]
            : ["radon", "vocs", ...base];

      const chosen =
        analytes
          .slice()
          .sort((a, b) => preferredOrder.indexOf(a.id) - (preferredOrder.indexOf(b.id)))
          .find((a) => preferredOrder.includes(a.id)) ?? analytes[0];

      return { chosen, hasRadon, hasVocs };
    },
    [gasPreference]
  );

  const applyProfileSelection = React.useCallback(
    async (profile: any) => {
      if (isLocked) {
        notifyLocked();
        return;
      }
      const picked = pickAnalyteFromProfile(profile);
      if (!picked) return;
      await selectTargetAnalyte(picked.chosen.name);
    },
    [isLocked, notifyLocked, pickAnalyteFromProfile, selectTargetAnalyte]
  );
  
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [showSwitchMatrix, setShowSwitchMatrix] = useState(showLogs);
  
  const currentPreset = getModePreset(state.mode);
  const currentTarget = state.selectedAnalyte ?? (state.targetAnalytes[0] ?? "");
  
  // Get mode icon
  const getModeIcon = (category: string) => {
    switch (category) {
      case "liquid":
        return <Droplets className="w-5 h-5" />;
      case "gas":
        return <Wind className="w-5 h-5" />;
      case "bio":
        return <Bug className="w-5 h-5" />;
      default:
        return <Power className="w-5 h-5" />;
    }
  };
  
  // Get mode color
  const getModeColor = (category: string) => {
    switch (category) {
      case "liquid":
        return "text-blue-500 bg-blue-50 border-blue-200";
      case "gas":
        return "text-purple-500 bg-purple-50 border-purple-200";
      case "bio":
        return "text-green-500 bg-green-50 border-green-200";
      default:
        return "text-gray-500 bg-gray-50 border-gray-200";
    }
  };
  
  // Handle calibration
  const handleCalibration = async () => {
    setIsCalibrating(true);
    await runCalibration();
    setIsCalibrating(false);
  };
  
  // Handle measurement
  const handleMeasure = async () => {
    if (state.mode === "MODE_IDLE") return;
    
    setIsMeasuring(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const result = simulateMeasurement();
    setIsMeasuring(false);
    
    onMeasure?.(state.mode, { value: result.value, unit: result.unit });
  };
  
  if (compact) {
    return (
      <Card className={cn("border", className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                getModeColor(state.category)
              )}>
                {getModeIcon(state.category)}
              </div>
              <div>
                <div className="text-sm font-medium">
                  {locale === "ko" ? currentPreset.nameKo : currentPreset.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {state.inputImpedance} | {state.frequency}
                </div>
              </div>
            </div>
            <Badge 
              variant={state.isCalibrated ? "default" : "secondary"}
              className="text-xs"
            >
              {state.isCalibrated ? "교정완료" : "미교정"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="w-5 h-5 text-blue-600" />
              Hardware Topology
              {isLocked && (
                <Badge className="ml-1 bg-amber-100 text-amber-800 border border-amber-200 text-[10px]">
                  Stabilizing… 변경 불가
                </Badge>
              )}
            </CardTitle>
            <CardDescription>RAFE (Reconfigurable Analog Front-End)</CardDescription>
          </div>
          
          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            {/* Target Analyte Selector (SDMS) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isTransitioning}>
                  <CircleDot className="w-4 h-4 mr-1 text-blue-600" />
                  {currentTarget || (locale === "ko" ? "타겟 선택" : "Select Target")}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {[
                  { label: "Liquid EC", items: ["Glucose", "Lactate"] },
                  { label: "Gas High-Z", items: ["Radon", "VOCs"] },
                  { label: "Bio-Impedance", items: ["Virus", "Bacteria"] }
                ].map((group) => (
                  <React.Fragment key={group.label}>
                    <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">
                      {group.label}
                    </div>
                    {group.items.map((a) => (
                      <DropdownMenuItem
                        key={a}
                        onClick={() => {
                          if (isLocked) return notifyLocked();
                          selectTargetAnalyte(a);
                        }}
                        className={cn(
                          state.selectedAnalyte?.toLowerCase() === a.toLowerCase() && "bg-blue-50"
                        )}
                      >
                        {a}
                      </DropdownMenuItem>
                    ))}
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mode Selector (Manual Override) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isTransitioning}>
                  <span className="mr-1">{currentPreset.icon}</span>
                  {locale === "ko" ? currentPreset.nameKo : currentPreset.name}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {getAvailableModes().map((preset) => (
                  <DropdownMenuItem
                    key={preset.mode}
                    onClick={() => {
                      if (isLocked) return notifyLocked();
                      setMode(preset.mode);
                    }}
                    className={cn(
                      state.mode === preset.mode && "bg-blue-50"
                    )}
                  >
                    <span className="mr-2">{preset.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">
                        {locale === "ko" ? preset.nameKo : preset.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {preset.targetAnalytes.slice(0, 2).join(", ")}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* SDMS Profile + Gas Prefer (mirrors CartridgeScanner) */}
        {syncedProfiles.length > 1 && effectiveProfile?.profile && (
          <div className="mt-3 rounded-lg border bg-muted/20 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <SlidersHorizontal className="w-4 h-4" />
                SDMS Profile
              </div>
              <span className="text-[10px] text-muted-foreground">
                {syncedProfiles.filter((x: any) => x.item.syncedToDevice).length > 0 ? "Synced" : "Library"} · {syncedProfiles.length}
              </span>
            </div>

            <div className="mt-2 flex gap-2">
              <select
                className="flex-1 rounded border px-2 py-1 bg-white text-xs"
                value={effectiveProfile.profile.id}
                onChange={async (e) => {
                  if (isLocked) {
                    notifyLocked();
                    return;
                  }
                  const id = e.target.value;
                  setSelectedProfileId(id);
                  try { localStorage.setItem(LS_PROFILE_KEY, id); } catch {}
                  const picked = syncedProfiles.find((x: any) => x.profile.id === id);
                  if (picked?.profile) await applyProfileSelection(picked.profile);
                }}
              >
                {syncedProfiles.map((x: any) => (
                  <option key={x.profile.id} value={x.profile.id}>
                    {(x.profile.marketing.titleKo || x.profile.marketing.title) + (x.item.syncedToDevice ? " (Synced)" : "")}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                disabled={isTransitioning}
                onClick={() => {
                  if (isLocked) return notifyLocked();
                  applyProfileSelection(effectiveProfile.profile);
                }}
              >
                적용
              </Button>
            </div>

            {(() => {
              const picked = pickAnalyteFromProfile(effectiveProfile.profile);
              const hasRadon = picked?.hasRadon;
              const hasVocs = picked?.hasVocs;
              if (!hasRadon || !hasVocs) return null;
              return (
                <div className="mt-2">
                  <div className="text-[11px] font-medium mb-1">Gas Prefer</div>
                  <div className="grid grid-cols-3 gap-1">
                    {(["auto", "radon", "vocs"] as const).map((pref) => (
                      <button
                        key={pref}
                        className={cn(
                          "py-1 rounded border text-[11px] transition-colors",
                          gasPreference === pref ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"
                        )}
                        onClick={async () => {
                          if (isLocked) return notifyLocked();
                          setGasPreference(pref);
                          try { localStorage.setItem(LS_GAS_PREF_KEY, pref); } catch {}
                          await applyProfileSelection(effectiveProfile.profile);
                        }}
                        disabled={isTransitioning}
                      >
                        {pref === "auto" ? "Auto" : pref === "radon" ? "Prefer Radon" : "Prefer VOCs"}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mode Info Card */}
        <div className={cn(
          "p-3 rounded-xl border-2 transition-all",
          getModeColor(state.category),
          isTransitioning && "animate-pulse"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
              {getModeIcon(state.category)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">
                  {locale === "ko" ? currentPreset.nameKo : currentPreset.name}
                </span>
                {state.isCalibrated && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
              </div>
              <div className="text-xs mt-0.5 opacity-80">
                Target: {(locale === "ko" ? currentPreset.targetAnalytesKo : currentPreset.targetAnalytes).slice(0, 3).join(", ")}
              </div>
            </div>
          </div>
          
          {/* Specs Grid */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div className="bg-white/50 rounded-lg p-2 text-center">
              <div className="font-mono font-bold">{state.inputImpedance}</div>
              <div className="text-[10px] opacity-70">Impedance</div>
            </div>
            <div className="bg-white/50 rounded-lg p-2 text-center">
              <div className="font-mono font-bold">{state.frequency}</div>
              <div className="text-[10px] opacity-70">Frequency</div>
            </div>
            <div className="bg-white/50 rounded-lg p-2 text-center">
              <div className="font-mono font-bold">{state.powerConsumption}</div>
              <div className="text-[10px] opacity-70">Power</div>
            </div>
          </div>

          {/* SDMS Target */}
          <div className="mt-2 text-xs opacity-80">
            <span className="font-medium">SDMS Target:</span>{" "}
            <span className="font-mono">{currentTarget || "—"}</span>
          </div>
        </div>
        
        {/* Pin Status Visualization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pin Status</span>
            <span className="text-xs text-muted-foreground">
              {state.activePins.filter(p => p.isActive).length}/8 Active
            </span>
          </div>
          
          <div className="grid grid-cols-8 gap-1">
            {state.activePins.map((pin) => (
              <div
                key={pin.pin}
                className="relative group"
                title={`${pin.name}: ${pin.function}`}
              >
                <div className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-xs font-mono transition-all",
                  pin.isActive
                    ? "bg-green-500 text-white shadow-md shadow-green-500/30"
                    : "bg-slate-200 text-slate-400"
                )}>
                  {pin.pin}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {pin.name}: {pin.function}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Switch Matrix Toggle */}
        <button
          onClick={() => setShowSwitchMatrix(!showSwitchMatrix)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-sm"
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4" />
            Switch Matrix
          </span>
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            showSwitchMatrix && "rotate-180"
          )} />
        </button>
        
        {/* Switch Matrix Details */}
        {showSwitchMatrix && (
          <div className="space-y-1 font-mono text-xs bg-slate-900 text-slate-100 p-3 rounded-lg">
            <div className="text-slate-400 mb-2">// Virtual Switch Matrix State</div>
            {Object.entries(state.switchMatrix).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <CircleDot className={cn(
                  "w-3 h-3",
                  value === "CLOSED" ? "text-green-400" : "text-slate-600"
                )} />
                <span className={cn(
                  value === "CLOSED" ? "text-green-400" : "text-slate-500"
                )}>
                  {key}: {value}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCalibration}
            disabled={isCalibrating || state.mode === "MODE_IDLE"}
          >
            {isCalibrating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                Calibrating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1" />
                Calibrate
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            onClick={handleMeasure}
            disabled={isMeasuring || state.mode === "MODE_IDLE" || !state.isCalibrated}
          >
            {isMeasuring ? (
              <>
                <Zap className="w-4 h-4 mr-1 animate-pulse" />
                Measuring...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-1" />
                Measure
              </>
            )}
          </Button>
        </div>
        
        {/* Warning if not calibrated */}
        {!state.isCalibrated && state.mode !== "MODE_IDLE" && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>Calibration required for accurate measurements</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ============================================
 * Compact Mode Selector (for smaller spaces)
 * ============================================ */

export function RAFEModeSelector({
  className,
  onModeChange
}: {
  className?: string;
  onModeChange?: (mode: RAFEMode) => void;
}) {
  const { state, setMode, isTransitioning } = useRAFE();
  const modes = Object.values(MODE_PRESETS).filter(m => m.mode !== "MODE_IDLE");
  
  const handleModeChange = async (mode: RAFEMode) => {
    await setMode(mode);
    onModeChange?.(mode);
  };
  
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-slate-100 rounded-xl", className)}>
      {modes.map((preset) => (
        <button
          key={preset.mode}
          onClick={() => handleModeChange(preset.mode)}
          disabled={isTransitioning}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
            state.mode === preset.mode
              ? "bg-white shadow text-blue-700 font-medium"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          )}
        >
          <span>{preset.icon}</span>
          <span className="hidden sm:inline">{preset.nameKo}</span>
        </button>
      ))}
    </div>
  );
}

export default HardwareTopologyWidget;
