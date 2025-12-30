"use client";

import React, { useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n, type Locale, type LocaleConfig } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "dropdown" | "inline" | "compact";
  className?: string;
}

/**
 * Language Switcher Component
 * 
 * Supports: Korean, English, Japanese, Chinese, Spanish
 */
export function LanguageSwitcher({ 
  variant = "dropdown",
  className 
}: LanguageSwitcherProps) {
  const { locale, setLocale, locales } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const currentLocale = locales.find(l => l.code === locale) || locales[0];

  // Compact variant - just shows flag
  if (variant === "compact") {
    return (
      <div className={cn("relative", className)}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8"
        >
          <span className="text-lg">{currentLocale.flag}</span>
        </Button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border overflow-hidden min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-200">
              {locales.map((loc) => (
                <button
                  key={loc.code}
                  onClick={() => {
                    setLocale(loc.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    "hover:bg-sky-50",
                    locale === loc.code && "bg-sky-100 text-sky-700"
                  )}
                >
                  <span className="text-base">{loc.flag}</span>
                  <span>{loc.nativeName}</span>
                  {locale === loc.code && (
                    <Check className="w-4 h-4 ml-auto text-sky-600" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Inline variant - horizontal buttons
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {locales.map((loc) => (
          <Button
            key={loc.code}
            variant={locale === loc.code ? "default" : "ghost"}
            size="sm"
            onClick={() => setLocale(loc.code)}
            className={cn(
              "h-8 px-2",
              locale === loc.code && "bg-sky-500 hover:bg-sky-600"
            )}
          >
            <span className="text-base mr-1">{loc.flag}</span>
            <span className="text-xs">{loc.code.toUpperCase()}</span>
          </Button>
        ))}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 gap-2"
      >
        <Globe className="w-4 h-4" />
        <span className="text-base">{currentLocale.flag}</span>
        <span className="hidden sm:inline text-sm">{currentLocale.nativeName}</span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-2xl border overflow-hidden min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 border-b bg-muted/50">
              <div className="text-xs font-medium text-muted-foreground px-2">
                Select Language
              </div>
            </div>
            <div className="p-1">
              {locales.map((loc) => (
                <LanguageOption
                  key={loc.code}
                  locale={loc}
                  isSelected={locale === loc.code}
                  onSelect={() => {
                    setLocale(loc.code);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface LanguageOptionProps {
  locale: LocaleConfig;
  isSelected: boolean;
  onSelect: () => void;
}

function LanguageOption({ locale, isSelected, onSelect }: LanguageOptionProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
        "hover:bg-sky-50 hover:scale-[1.02]",
        isSelected && "bg-sky-100"
      )}
    >
      <span className="text-xl">{locale.flag}</span>
      <div className="flex-1 text-left">
        <div className="font-medium">{locale.nativeName}</div>
        <div className="text-xs text-muted-foreground">{locale.name}</div>
      </div>
      {isSelected && (
        <Badge variant="default" className="bg-sky-500 text-xs">
          <Check className="w-3 h-3" />
        </Badge>
      )}
    </button>
  );
}

export default LanguageSwitcher;






