"use client";

import { V0Sidebar as Sidebar } from "@/components/dashboard/v0-sidebar";
import { V0Header as Header } from "@/components/dashboard/v0-header";
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit, LucideIcon } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />

      <main className="pl-16 lg:pl-20 min-h-screen overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto p-4 lg:p-8 pb-24">
          <Header title="내 프로필" subtitle="만파식 생태계와 연결된 나의 건강 정보" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="hanji-card rounded-2xl p-5 lg:p-6 text-center">
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-ink/70 to-ink-light/50 flex items-center justify-center mx-auto mb-4 text-hanji text-responsive-3xl font-light shadow-md">
                  M
                </div>
                <h2 className="text-responsive-xl font-medium text-foreground mb-1">김민호</h2>
                <p className="text-responsive-sm text-muted-foreground mb-4">Premium Member</p>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-dancheong-red/10 text-dancheong-red text-responsive-xs">
                    만파식 VIP
                  </span>
                  <span className="px-3 py-1 rounded-full bg-ink/8 text-ink text-responsive-xs">2024년 가입</span>
                </div>

                <button className="w-full py-2.5 rounded-xl ink-btn text-responsive-sm flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" />
                  프로필 수정
                </button>
              </div>
            </div>

            {/* Info Cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="hanji-card rounded-2xl p-5 lg:p-6">
                <h3 className="text-responsive-lg font-medium text-foreground mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-ink" />
                  기본 정보
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem icon={Mail} label="이메일" value="minho.kim@example.com" />
                  <InfoItem icon={Phone} label="전화번호" value="010-1234-5678" />
                  <InfoItem icon={MapPin} label="지역" value="서울특별시 강남구" />
                  <InfoItem icon={Calendar} label="생년월일" value="1990년 3월 15일" />
                </div>
              </div>

              <div className="hanji-card rounded-2xl p-5 lg:p-6">
                <h3 className="text-responsive-lg font-medium text-foreground mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-ink" />
                  건강 데이터 권한
                </h3>
                <div className="space-y-3">
                  <PermissionItem label="심박수 데이터" enabled={true} />
                  <PermissionItem label="수면 데이터" enabled={true} />
                  <PermissionItem label="활동량 데이터" enabled={true} />
                  <PermissionItem label="위치 기반 서비스" enabled={false} />
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-ink/6 text-center">
            <p className="text-responsive-xs text-muted-foreground">
              <span className="text-ink font-medium">만파식</span> · ManPaSik · MPS
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-ink-light" strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <p className="text-responsive-xs text-muted-foreground">{label}</p>
        <p className="text-responsive-sm text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function PermissionItem({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-hanji-warm border border-ink/4">
      <span className="text-responsive-sm text-foreground">{label}</span>
      <div
        className={`w-10 h-6 rounded-full transition-colors ${enabled ? "bg-dancheong-green" : "bg-ink/20"} relative`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? "right-1" : "left-1"}`}
        />
      </div>
    </div>
  );
}

