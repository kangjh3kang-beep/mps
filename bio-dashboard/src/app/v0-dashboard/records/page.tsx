"use client";

import { V0Sidebar as Sidebar } from "@/components/dashboard/v0-sidebar";
import { V0Header as Header } from "@/components/dashboard/v0-header";
import { FileText, Download, Calendar, Filter } from "lucide-react";

const records = [
  { id: 1, title: "정기 건강검진 결과", date: "2024.12.15", type: "checkup", status: "완료" },
  { id: 2, title: "혈액검사 보고서", date: "2024.12.10", type: "lab", status: "완료" },
  { id: 3, title: "심전도 검사 기록", date: "2024.11.28", type: "cardio", status: "완료" },
  { id: 4, title: "영양상담 기록", date: "2024.11.20", type: "consult", status: "완료" },
  { id: 5, title: "운동 처방전", date: "2024.11.15", type: "prescription", status: "진행중" },
];

export default function RecordsPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />

      <main className="pl-16 lg:pl-20 min-h-screen overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto p-4 lg:p-8 pb-24">
          <Header title="건강 기록" subtitle="만파식이 수집하고 보관하는 나의 건강 데이터" />

          {/* Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 rounded-xl hanji-card text-responsive-sm text-foreground flex items-center gap-2 hover:bg-ink/5 transition-colors">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">필터</span>
              </button>
              <button className="px-4 py-2 rounded-xl hanji-card text-responsive-sm text-foreground flex items-center gap-2 hover:bg-ink/5 transition-colors">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">기간</span>
              </button>
            </div>
            <button className="px-4 py-2 rounded-xl dancheong-btn text-responsive-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">전체 다운로드</span>
            </button>
          </div>

          {/* Records List */}
          <div className="hanji-card rounded-2xl overflow-hidden">
            <div className="p-4 lg:p-5 border-b border-ink/6">
              <h3 className="text-responsive-lg font-medium text-foreground">기록 목록</h3>
              <p className="text-responsive-xs text-muted-foreground mt-1">총 {records.length}개의 기록</p>
            </div>

            <div className="divide-y divide-ink/4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-4 lg:p-5 flex items-center gap-4 hover:bg-hanji-warm/50 transition-colors"
                >
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-ink/5 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-ink" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-responsive-sm font-medium text-foreground truncate">{record.title}</p>
                    <p className="text-responsive-xs text-muted-foreground">{record.date}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] flex-shrink-0 ${
                      record.status === "완료"
                        ? "bg-dancheong-green/10 text-dancheong-green"
                        : "bg-dancheong-yellow/15 text-dancheong-yellow"
                    }`}
                  >
                    {record.status}
                  </span>
                  <button className="w-9 h-9 rounded-lg bg-ink/5 flex items-center justify-center text-ink hover:bg-ink/10 transition-colors flex-shrink-0">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
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

