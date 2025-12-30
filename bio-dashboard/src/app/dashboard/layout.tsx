import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "만파식 대시보드 | ManPaSik Dashboard",
  description: "모이고, 가공되어, 세계로 펼쳐지다 — Collect, Process, Expand",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


