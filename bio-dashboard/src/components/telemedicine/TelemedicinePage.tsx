"use client";

import React, { useState, useCallback } from "react";
import { ArrowLeft, Video, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HospitalBooking } from "./HospitalBooking";
import { VideoRoom } from "./VideoRoom";
import { PostConsultationFlow } from "./PostConsultationFlow";
import { type Appointment } from "@/lib/telemedicine";

interface TelemedicinePageProps {
  userId: string;
  healthData?: {
    healthScore: number;
    concentration: number;
    trendData: { date: string; value: number }[];
  };
  onBack?: () => void;
}

type ViewMode = "booking" | "consultation" | "post-consultation";

/**
 * Telemedicine Page
 * 
 * 원격 의료 통합 페이지
 * - 병원/의사 검색 및 예약
 * - 화상 진료 (WebRTC 시뮬레이션)
 * - 데이터 공유 동의
 * - 처방전 및 약국 선택 (Post-consultation)
 */
export function TelemedicinePage({ 
  userId, 
  healthData,
  onBack 
}: TelemedicinePageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("booking");
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

  const handleStartConsultation = useCallback((appointment: Appointment) => {
    setActiveAppointment(appointment);
    setViewMode("consultation");
  }, []);

  const handleEndCall = useCallback(() => {
    // 진료 종료 후 처방전/약국 선택 플로우로 이동
    if (activeAppointment) {
      setViewMode("post-consultation");
    }
  }, [activeAppointment]);

  const handlePostConsultationComplete = useCallback(() => {
    setActiveAppointment(null);
    setViewMode("booking");
  }, []);

  const handleBookingComplete = useCallback((appointment: Appointment) => {
    console.log("[Telemedicine] Booking complete:", appointment);
  }, []);

  // Prepare shared data if consent was given
  const sharedData = activeAppointment?.dataShareConsent && healthData
    ? healthData
    : undefined;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      {viewMode === "booking" && onBack && (
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            대시보드로 돌아가기
          </Button>
        </div>
      )}

      {/* Content */}
      {viewMode === "booking" ? (
        <div className="flex-1">
          <HospitalBooking
            userId={userId}
            onBookingComplete={handleBookingComplete}
            onStartConsultation={handleStartConsultation}
          />
        </div>
      ) : viewMode === "consultation" && activeAppointment ? (
        <div className="flex-1">
          <VideoRoom
            appointment={activeAppointment}
            sharedData={sharedData}
            onEndCall={handleEndCall}
          />
        </div>
      ) : viewMode === "post-consultation" && activeAppointment ? (
        <div className="flex-1 overflow-auto">
          <PostConsultationFlow
            appointment={activeAppointment}
            onComplete={handlePostConsultationComplete}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Telemedicine Mini Card (for Dashboard)
 * 대시보드에 표시되는 원격 의료 미니 카드
 */
interface TelemedicineMiniCardProps {
  onExpand: () => void;
  upcomingAppointments: number;
}

export function TelemedicineMiniCard({ 
  onExpand, 
  upcomingAppointments 
}: TelemedicineMiniCardProps) {
  return (
    <div 
      className="p-4 border rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary cursor-pointer transition-all"
      onClick={onExpand}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">원격 진료</div>
            <div className="text-xs text-muted-foreground">
              Telemedicine Booking
            </div>
          </div>
        </div>
        {upcomingAppointments > 0 && (
          <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
            {upcomingAppointments}개 예약
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1 h-8 text-xs">
          <Building2 className="w-3 h-3 mr-1" />
          예약하기
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs">
          <Video className="w-3 h-3 mr-1" />
          진료실
        </Button>
      </div>
    </div>
  );
}

export default TelemedicinePage;

