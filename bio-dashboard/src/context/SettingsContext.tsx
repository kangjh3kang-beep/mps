"use client";

import * as React from "react";

export type AppSettings = {
  darkMode: boolean;
  fontScale: number; // 0.9 ~ 1.6
  seniorMode: boolean;
  // 41-Persona Simulation에서 추가된 설정
  kidsMode: boolean;           // User #27 (초등학생)
  voiceEnabled: boolean;       // User #35, #36 (시니어)
  familyAccountEnabled: boolean; // User #26 (주부)
  privacyZoneEnabled: boolean; // User #28 (중학생)
  // 사용자 맞춤형 서브타이틀
  customSubtitle: string;      // 기본값: "모이고, 가공되어, 나만의 세계로 펼쳐지다"
};

const LS_SETTINGS = "manpasik:settings:v1";

// 기본 서브타이틀
export const DEFAULT_SUBTITLE = "모이고, 가공되어, 나만의 세계로 펼쳐지다";

const DEFAULTS: AppSettings = {
  darkMode: false,
  fontScale: 1.0,
  seniorMode: false,
  // 41-Persona Simulation 기본값
  kidsMode: false,
  voiceEnabled: false,
  familyAccountEnabled: false,
  privacyZoneEnabled: false,
  // 사용자 맞춤형 서브타이틀
  customSubtitle: DEFAULT_SUBTITLE
};

type Ctx = {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
};

const SettingsContext = React.createContext<Ctx | null>(null);

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const fontScale = clamp(Number(parsed.fontScale ?? DEFAULTS.fontScale), 0.9, 1.6);
    const seniorMode = !!parsed.seniorMode;
    const kidsMode = !!parsed.kidsMode;
    return {
      darkMode: !!parsed.darkMode,
      seniorMode,
      fontScale: seniorMode ? Math.max(1.25, fontScale) : fontScale,
      // 41-Persona Simulation 설정 로드
      kidsMode,
      voiceEnabled: seniorMode ? true : !!parsed.voiceEnabled, // 시니어 모드 시 음성 자동 활성화
      familyAccountEnabled: !!parsed.familyAccountEnabled,
      privacyZoneEnabled: !!parsed.privacyZoneEnabled,
      // 사용자 맞춤형 서브타이틀 로드
      customSubtitle: typeof parsed.customSubtitle === 'string' && parsed.customSubtitle.trim() 
        ? parsed.customSubtitle 
        : DEFAULT_SUBTITLE
    };
  } catch {
    return DEFAULTS;
  }
}

function saveSettings(s: AppSettings) {
  localStorage.setItem(LS_SETTINGS, JSON.stringify(s));
}

function applyToDom(s: AppSettings) {
  const root = document.documentElement;
  if (s.darkMode) root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.fontSize = `${Math.round(16 * s.fontScale)}px`;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<AppSettings>(() =>
    typeof window === "undefined" ? DEFAULTS : loadSettings()
  );

  React.useEffect(() => {
    applyToDom(settings);
    try {
      saveSettings(settings);
    } catch {
      // ignore
    }
  }, [settings]);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_SETTINGS) return;
      setSettings(loadSettings());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setSetting = React.useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => {
        const next: AppSettings = { ...prev, [key]: value };
        if (next.seniorMode) next.fontScale = Math.max(1.25, next.fontScale);
        next.fontScale = clamp(next.fontScale, 0.9, 1.6);
        return next;
      });
    },
    []
  );

  return (
    <SettingsContext.Provider value={{ settings, setSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  
  // 41-Persona Simulation: 편의 메서드 추가
  return {
    ...ctx.settings,
    settings: ctx.settings,
    setSetting: ctx.setSetting,
    // 개별 setter 함수들
    setDarkMode: (v: boolean) => ctx.setSetting("darkMode", v),
    setSeniorMode: (v: boolean) => ctx.setSetting("seniorMode", v),
    setKidsMode: (v: boolean) => ctx.setSetting("kidsMode", v),
    setVoiceEnabled: (v: boolean) => ctx.setSetting("voiceEnabled", v),
    setFamilyAccountEnabled: (v: boolean) => ctx.setSetting("familyAccountEnabled", v),
    setPrivacyZoneEnabled: (v: boolean) => ctx.setSetting("privacyZoneEnabled", v),
    setFontScale: (v: number) => ctx.setSetting("fontScale", v),
    // 사용자 맞춤형 서브타이틀
    setCustomSubtitle: (v: string) => ctx.setSetting("customSubtitle", v.trim() || DEFAULT_SUBTITLE),
    resetSubtitle: () => ctx.setSetting("customSubtitle", DEFAULT_SUBTITLE),
  };
}
