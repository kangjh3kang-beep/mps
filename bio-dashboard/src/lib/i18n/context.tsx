"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { 
  Locale, 
  SUPPORTED_LOCALES, 
  translations, 
  getTranslation,
  AI_SYSTEM_PROMPTS,
  type TranslationKey 
} from "./translations";

/* ============================================
 * Types
 * ============================================
 */
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  locales: typeof SUPPORTED_LOCALES;
  aiSystemPrompt: string;
}

/* ============================================
 * Context
 * ============================================
 */
const I18nContext = createContext<I18nContextType | null>(null);

const LS_LOCALE_KEY = "bio-dashboard:locale";

/* ============================================
 * Provider
 * ============================================
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ko");
  const [mounted, setMounted] = useState(false);

  // Load locale from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(LS_LOCALE_KEY) as Locale;
      if (saved && SUPPORTED_LOCALES.some(l => l.code === saved)) {
        setLocaleState(saved);
      } else {
        // Try to detect browser language
        const browserLang = navigator.language.slice(0, 2);
        const matchedLocale = SUPPORTED_LOCALES.find(l => l.code === browserLang);
        if (matchedLocale) {
          setLocaleState(matchedLocale.code);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save locale to localStorage
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LS_LOCALE_KEY, newLocale);
    } catch {
      // Ignore
    }
  }, []);

  // Translation function - always use current locale state
  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>) => {
    return getTranslation(locale, key, params);
  }, [locale]);

  // AI System Prompt for current locale
  const aiSystemPrompt = AI_SYSTEM_PROMPTS[locale];

  // SSR 호환성: Provider는 항상 렌더링되어야 함 (Context가 항상 사용 가능하도록)
  // hydration mismatch를 방지하기 위해 children을 조건부로 렌더링
  return (
    <I18nContext.Provider value={{
      locale,
      setLocale,
      t,
      locales: SUPPORTED_LOCALES,
      aiSystemPrompt
    }}>
      {/* mounted 전에는 빈 div를 렌더링하여 hydration 불일치 방지 */}
      {mounted ? children : (
        <div style={{ visibility: 'hidden' }} suppressHydrationWarning>
          {children}
        </div>
      )}
    </I18nContext.Provider>
  );
}

/* ============================================
 * Hook
 * ============================================
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

/**
 * Hook for getting just the translation function
 */
export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}





