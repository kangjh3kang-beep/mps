"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/* ============================================
 * Language Selector Component
 * 
 * 국가/언어 선택 시 전체 UI가 해당 언어로 변경됨
 * ============================================ */

interface LanguageSelectorProps {
  className?: string;
  variant?: "button" | "dropdown" | "inline";
  showFlag?: boolean;
  showName?: boolean;
}

export function LanguageSelector({
  className,
  variant = "dropdown",
  showFlag = true,
  showName = true
}: LanguageSelectorProps) {
  const { locale, setLocale, locales } = useI18n();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const currentLocale = locales.find(l => l.code === locale) || locales[0];

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Inline variant: Shows all languages as buttons
  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {locales.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              locale === lang.code
                ? "bg-primary text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {showFlag && <span className="text-lg">{lang.flag}</span>}
            {showName && <span>{lang.nativeName}</span>}
            {locale === lang.code && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    );
  }

  // Button variant: Simple button that cycles through languages
  if (variant === "button") {
    const currentIndex = locales.findIndex(l => l.code === locale);
    const nextIndex = (currentIndex + 1) % locales.length;
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLocale(locales[nextIndex].code)}
        className={cn("gap-2", className)}
      >
        <Globe className="w-4 h-4" />
        {showFlag && <span>{currentLocale.flag}</span>}
        {showName && <span>{currentLocale.nativeName}</span>}
      </Button>
    );
  }

  // Dropdown variant (default)
  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        {showFlag && <span className="text-base">{currentLocale.flag}</span>}
        {showName && <span className="text-sm">{currentLocale.nativeName}</span>}
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 z-50 min-w-[180px] max-h-[50vh] bg-white/98 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
          >
            <div className="p-2 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span>Select Language</span>
              </div>
            </div>
            <div className="py-1 overflow-y-auto flex-1">
              {locales.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLocale(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                    "hover:bg-slate-50",
                    locale === lang.code && "bg-primary/5"
                  )}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <div className={cn(
                      "font-medium",
                      locale === lang.code && "text-primary"
                    )}>
                      {lang.nativeName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lang.name}
                    </div>
                  </div>
                  {locale === lang.code && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================
 * Language Selection Modal (First-time setup)
 * ============================================ */

interface LanguageSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function LanguageSetupModal({ isOpen, onComplete }: LanguageSetupModalProps) {
  const { locale, setLocale, locales } = useI18n();

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 text-center bg-gradient-to-r from-primary to-primary-end">
          <Globe className="w-12 h-12 mx-auto mb-3 text-white" />
          <h2 className="text-xl font-bold text-white">
            Select Your Language
          </h2>
          <p className="text-sm text-white/80 mt-1">
            언어를 선택해주세요
          </p>
        </div>

        {/* Language Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            {locales.map((lang) => (
              <motion.button
                key={lang.code}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLocale(lang.code)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  locale === lang.code
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 hover:border-primary/50"
                )}
              >
                <span className="text-4xl">{lang.flag}</span>
                <span className={cn(
                  "font-medium text-sm",
                  locale === lang.code && "text-primary"
                )}>
                  {lang.nativeName}
                </span>
                {locale === lang.code && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <Button 
            className="w-full" 
            size="lg"
            onClick={onComplete}
          >
            <Check className="w-5 h-5 mr-2" />
            Confirm / 확인
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default LanguageSelector;



