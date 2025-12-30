import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "만파식 · ManPaSik | 대시보드",
  description: "데이터가 모이고, 정제되어, 세계로 펼쳐집니다 — Collect, Process, Expand",
};

export default function V0DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


