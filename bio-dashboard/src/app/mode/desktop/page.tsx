"use client";

/**
 * ============================================================
 * DESKTOP MODE - Redirects to Pro Mode
 * 
 * Desktop/Pro 모드는 동일한 전문가 대시보드를 제공합니다.
 * 이 페이지는 기존 URL 호환성을 위해 유지됩니다.
 * ============================================================
 */

import { redirect } from "next/navigation";

export default function DesktopModePage() {
  redirect("/mode/pro");
}
