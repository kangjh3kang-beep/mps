"use client";

import React from "react";
import {
  CheckCircle2,
  QrCode,
  MapPin,
  Clock,
  Phone,
  Copy,
  Share2,
  Navigation,
  Home
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  type Prescription, 
  type Pharmacy,
  getPharmacyById,
  generateQRCodeData
} from "@/lib/prescription";

interface PickupConfirmationProps {
  prescription: Prescription;
  onGoHome: () => void;
  onViewPrescription?: () => void;
}

/**
 * Pickup Confirmation Component
 * 
 * 약국 수령 확인 화면
 * - 픽업 코드 QR
 * - 약국 정보
 * - 완료 상태
 */
export function PickupConfirmation({ 
  prescription, 
  onGoHome,
  onViewPrescription 
}: PickupConfirmationProps) {
  const pharmacy = prescription.selectedPharmacyId 
    ? getPharmacyById(prescription.selectedPharmacyId) 
    : null;

  const qrData = generateQRCodeData(prescription);

  const copyPickupCode = () => {
    if (prescription.pickupCode) {
      navigator.clipboard.writeText(prescription.pickupCode);
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Success Header */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-1">처방전 전송 완료</h2>
          <p className="text-white/80 text-sm">
            약국에서 조제 후 연락드립니다
          </p>
        </CardContent>
      </Card>

      {/* Pickup Code */}
      <Card>
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-base flex items-center justify-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            수령 코드
          </CardTitle>
          <CardDescription>
            약국에서 이 코드를 보여주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {/* Mock QR Code (ASCII representation) */}
          <div className="inline-block bg-white p-4 rounded-xl shadow-inner border-2">
            <div className="w-40 h-40 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Simplified QR pattern */}
              <div className="absolute inset-2 grid grid-cols-9 gap-0.5">
                {Array.from({ length: 81 }).map((_, i) => {
                  // Create a pseudo-random pattern based on pickup code
                  const code = prescription.pickupCode || "000000";
                  const charSum = code.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
                  const isBlack = (i + charSum) % 3 !== 0;
                  return (
                    <div 
                      key={i} 
                      className={`${isBlack ? "bg-white" : "bg-transparent"} rounded-sm`}
                    />
                  );
                })}
              </div>
              {/* Corner markers */}
              <div className="absolute top-2 left-2 w-8 h-8 border-4 border-white rounded-md" />
              <div className="absolute top-2 right-2 w-8 h-8 border-4 border-white rounded-md" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-4 border-white rounded-md" />
            </div>
          </div>

          {/* Pickup Code Display */}
          <div className="space-y-2">
            <div className="text-3xl font-mono font-bold tracking-widest text-primary">
              {prescription.pickupCode}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyPickupCode}
              className="text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              코드 복사
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            처방전 번호: {prescription.id}
          </div>
        </CardContent>
      </Card>

      {/* Pharmacy Info */}
      {pharmacy && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              수령 약국
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="font-medium text-lg">{pharmacy.name}</div>
              <div className="text-sm text-muted-foreground">{pharmacy.address}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{pharmacy.hours}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{pharmacy.phone}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" size="sm">
                <Phone className="w-4 h-4 mr-1" />
                전화하기
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
                <Navigation className="w-4 h-4 mr-1" />
                길찾기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescription Summary */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">처방 약품</div>
              <div className="text-xs text-muted-foreground">
                {prescription.medications.map(m => m.nameKo).join(", ")}
              </div>
            </div>
            {onViewPrescription && (
              <Button variant="ghost" size="sm" onClick={onViewPrescription}>
                상세보기
              </Button>
            )}
          </div>
          
          <Separator className="my-3" />
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">전송 시간:</span>
              <div className="font-medium">
                {prescription.sentToPharmacyAt 
                  ? formatTime(prescription.sentToPharmacyAt) 
                  : "-"}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">유효기간:</span>
              <div className="font-medium">
                {new Date(prescription.validUntil).toLocaleDateString("ko-KR")}까지
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm font-medium mb-3">진행 상태</div>
          <div className="space-y-3">
            <TimelineItem 
              icon={<CheckCircle2 className="w-4 h-4" />}
              title="진료 완료"
              completed
            />
            <TimelineItem 
              icon={<CheckCircle2 className="w-4 h-4" />}
              title="처방전 발급"
              completed
            />
            <TimelineItem 
              icon={<CheckCircle2 className="w-4 h-4" />}
              title="약국 전송"
              completed
            />
            <TimelineItem 
              icon={<Clock className="w-4 h-4" />}
              title="조제 대기"
              active
            />
            <TimelineItem 
              icon={<MapPin className="w-4 h-4" />}
              title="수령 완료"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Button className="w-full" onClick={onGoHome}>
        <Home className="w-4 h-4 mr-2" />
        대시보드로 돌아가기
      </Button>
    </div>
  );
}

/**
 * Timeline Item Component
 */
function TimelineItem({ 
  icon, 
  title, 
  completed = false,
  active = false
}: { 
  icon: React.ReactNode;
  title: string;
  completed?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        completed 
          ? "bg-green-100 text-green-600" 
          : active 
            ? "bg-primary/10 text-primary animate-pulse"
            : "bg-muted text-muted-foreground"
      }`}>
        {icon}
      </div>
      <span className={`text-sm ${
        completed ? "text-green-600 font-medium" : 
        active ? "text-primary font-medium" : 
        "text-muted-foreground"
      }`}>
        {title}
      </span>
    </div>
  );
}

export default PickupConfirmation;






