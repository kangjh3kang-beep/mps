"use client";

import type React from "react";
import { V0Sidebar as Sidebar } from "@/components/dashboard/v0-sidebar";
import { V0Header as Header } from "@/components/dashboard/v0-header";
import { Bell, Moon, Globe, Lock, HelpCircle, LogOut } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />

      <main className="pl-16 lg:pl-20 min-h-screen overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto p-4 lg:p-8 pb-24">
          <Header title="설정" subtitle="만파식 앱 환경을 맞춤 설정하세요" />

          <div className="max-w-2xl space-y-4">
            <SettingsSection title="알림 설정">
              <SettingItem
                icon={Bell}
                label="푸시 알림"
                description="건강 알림 및 일정 알림 받기"
                hasToggle
                defaultOn
              />
              <SettingItem
                icon={Bell}
                label="이메일 알림"
                description="주간 건강 리포트 이메일로 받기"
                hasToggle
                defaultOn={false}
              />
            </SettingsSection>

            <SettingsSection title="앱 설정">
              <SettingItem icon={Moon} label="다크 모드" description="어두운 테마로 전환" hasToggle defaultOn={false} />
              <SettingItem icon={Globe} label="언어" description="한국어" hasArrow />
            </SettingsSection>

            <SettingsSection title="보안">
              <SettingItem icon={Lock} label="비밀번호 변경" description="계정 비밀번호 변경하기" hasArrow />
              <SettingItem icon={Lock} label="2단계 인증" description="추가 보안 설정" hasToggle defaultOn />
            </SettingsSection>

            <SettingsSection title="지원">
              <SettingItem icon={HelpCircle} label="도움말" description="자주 묻는 질문 및 가이드" hasArrow />
              <SettingItem icon={HelpCircle} label="문의하기" description="고객 지원팀에 연락하기" hasArrow />
            </SettingsSection>

            <div className="hanji-card rounded-2xl p-4 lg:p-5">
              <button className="w-full py-3 rounded-xl border border-dancheong-red/30 text-dancheong-red text-responsive-sm flex items-center justify-center gap-2 hover:bg-dancheong-red/5 transition-colors">
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          </div>

          <footer className="mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-ink/6 text-center">
            <p className="text-responsive-xs text-muted-foreground">
              <span className="text-ink font-medium">만파식</span> · ManPaSik · MPS · v1.0.0
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="hanji-card rounded-2xl overflow-hidden">
      <div className="px-4 lg:px-5 py-3 border-b border-ink/6">
        <h3 className="text-responsive-sm font-medium text-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-ink/4">{children}</div>
    </div>
  );
}

function SettingItem({
  icon: Icon,
  label,
  description,
  hasToggle,
  hasArrow,
  defaultOn,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  hasToggle?: boolean;
  hasArrow?: boolean;
  defaultOn?: boolean;
}) {
  return (
    <div className="px-4 lg:px-5 py-3.5 flex items-center gap-3 hover:bg-hanji-warm/50 transition-colors cursor-pointer">
      <div className="w-9 h-9 rounded-lg bg-ink/5 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-ink-light" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-responsive-sm text-foreground">{label}</p>
        <p className="text-responsive-xs text-muted-foreground truncate">{description}</p>
      </div>
      {hasToggle && (
        <div
          className={`w-10 h-6 rounded-full transition-colors ${defaultOn ? "bg-dancheong-green" : "bg-ink/20"} relative flex-shrink-0`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${defaultOn ? "right-1" : "left-1"}`}
          />
        </div>
      )}
      {hasArrow && (
        <svg
          className="w-5 h-5 text-muted-foreground flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );
}

