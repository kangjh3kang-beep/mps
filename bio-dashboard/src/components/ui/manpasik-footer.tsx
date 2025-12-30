"use client";

import * as React from "react";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

interface ManpasikFooterProps {
  className?: string;
  showBorder?: boolean;
}

/**
 * 만파식 공통 푸터 컴포넌트
 * 사용자가 설정한 맞춤형 서브타이틀을 표시합니다.
 */
export function ManpasikFooter({ className, showBorder = true }: ManpasikFooterProps) {
  const { customSubtitle } = useSettings();
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  // Hydration 이슈 방지를 위해 기본값 사용
  const displaySubtitle = hasMounted 
    ? customSubtitle 
    : "모이고, 가공되어, 나만의 세계로 펼쳐지다";

  return (
    <footer 
      className={cn(
        "mt-8 pt-6 text-center",
        showBorder && "border-t border-ink/8",
        className
      )}
    >
      <p className="text-xs text-muted-foreground">
        <span className="text-ink font-medium">만파식</span> · ManPaSik —
        <span className="text-dancheong-red ml-1">{displaySubtitle}</span>
      </p>
    </footer>
  );
}

/**
 * 인라인 서브타이틀 (푸터 없이 텍스트만)
 */
export function ManpasikSubtitle({ className }: { className?: string }) {
  const { customSubtitle } = useSettings();
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const displaySubtitle = hasMounted 
    ? customSubtitle 
    : "모이고, 가공되어, 나만의 세계로 펼쳐지다";

  return (
    <span className={cn("text-dancheong-red", className)}>
      {displaySubtitle}
    </span>
  );
}




