"use client";

import React from "react";
import { Calendar, Clock, MapPin, User } from "lucide-react";

const schedules = [
  {
    id: 1,
    title: "정기 건강검진",
    type: "checkup",
    date: "오늘",
    time: "오후 2:00",
    location: "서울대학교병원",
    doctor: "김철수 교수",
  },
  {
    id: 2,
    title: "영양 상담",
    type: "consult",
    date: "내일",
    time: "오전 10:30",
    location: "화상 진료",
    doctor: "이영희 영양사",
  },
  {
    id: 3,
    title: "운동 처방 상담",
    type: "exercise",
    date: "금요일",
    time: "오후 4:00",
    location: "만파식 센터",
    doctor: "박지민 트레이너",
  },
];

const typeColors: Record<string, string> = {
  checkup: "bg-dancheong-red/10 border-dancheong-red/30",
  consult: "bg-dancheong-blue/10 border-dancheong-blue/30",
  exercise: "bg-dancheong-green/10 border-dancheong-green/30",
};

const typeDots: Record<string, string> = {
  checkup: "bg-dancheong-red",
  consult: "bg-dancheong-blue",
  exercise: "bg-dancheong-green",
};

/**
 * Upcoming Schedule
 * 
 * 예정된 일정 목록
 */
export function UpcomingSchedule() {
  return (
    <div className="hanji-card rounded-2xl p-4 lg:p-5 h-full animate-ink-spread" style={{ animationDelay: "0.35s" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-ink-light" strokeWidth={1.5} />
          <h3 className="text-responsive-sm font-medium text-foreground">예정된 일정</h3>
        </div>
        <button className="text-responsive-xs text-dancheong-red hover:underline">
          전체보기
        </button>
      </div>

      <div className="space-y-3">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className={`p-3 rounded-xl border ${typeColors[schedule.type]} hover:shadow-md transition-shadow cursor-pointer`}
          >
            <div className="flex items-start gap-3">
              {/* Date Indicator */}
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full ${typeDots[schedule.type]}`} />
                <div className="w-px h-full bg-ink/10 mt-1" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-responsive-sm font-medium text-foreground truncate">
                    {schedule.title}
                  </h4>
                  <span className="text-responsive-xs text-muted-foreground whitespace-nowrap">
                    {schedule.date}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-responsive-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {schedule.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {schedule.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {schedule.doctor}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Button */}
      <button className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-ink/20 text-responsive-xs text-muted-foreground hover:border-ink/40 hover:text-foreground transition-colors">
        + 새 일정 추가
      </button>
    </div>
  );
}

export default UpcomingSchedule;
