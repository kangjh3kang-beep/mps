"use client";

import * as React from "react";
import { 
  Pill, 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  Package, 
  AlertCircle,
  ChevronRight,
  FileText,
  MapPin,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { UserPrescription } from "@/context/UserContext";

type PrescriptionsListProps = {
  prescriptions: UserPrescription[];
  onBack: () => void;
  onViewDetails?: (prescription: UserPrescription) => void;
};

const statusConfig: Record<UserPrescription["status"], {
  label: string;
  color: string;
  icon: React.ReactNode;
}> = {
  pending: {
    label: "처리 중",
    color: "bg-amber-100 text-amber-700",
    icon: <Clock className="w-3 h-3" />
  },
  sent: {
    label: "약국 전송됨",
    color: "bg-sky-100 text-sky-700",
    icon: <Package className="w-3 h-3" />
  },
  ready: {
    label: "수령 가능",
    color: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle className="w-3 h-3" />
  },
  completed: {
    label: "완료",
    color: "bg-gray-100 text-gray-700",
    icon: <CheckCircle className="w-3 h-3" />
  }
};

export function PrescriptionsList({
  prescriptions,
  onBack,
  onViewDetails
}: PrescriptionsListProps) {
  const [selectedPrescription, setSelectedPrescription] = React.useState<UserPrescription | null>(null);

  if (selectedPrescription) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedPrescription(null)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          처방전 목록
        </Button>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                처방전 상세
              </CardTitle>
              <Badge className={statusConfig[selectedPrescription.status].color}>
                {statusConfig[selectedPrescription.status].icon}
                <span className="ml-1">{statusConfig[selectedPrescription.status].label}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prescription ID */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-muted-foreground">처방전 번호</div>
              <div className="font-mono font-medium">{selectedPrescription.id}</div>
            </div>

            {/* Doctor Info */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">처방 의사</div>
              <div className="font-medium">{selectedPrescription.doctor.name} 전문의</div>
              <div className="text-sm text-muted-foreground">{selectedPrescription.doctor.hospital}</div>
            </div>

            {/* Diagnosis */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">진단</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedPrescription.diagnosis.icdCode}</Badge>
                <span className="font-medium">{selectedPrescription.diagnosis.nameKo}</span>
              </div>
            </div>

            {/* Medications */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">처방 약품 ({selectedPrescription.medications.length}종)</div>
              <div className="space-y-2">
                {selectedPrescription.medications.map((med, idx) => (
                  <div key={idx} className="p-3 bg-sky-50 rounded-lg border border-sky-100">
                    <div className="font-medium">{med.nameKo}</div>
                    <div className="text-sm text-muted-foreground">
                      {med.dosage} • {med.frequency} • {med.duration}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pharmacy Info */}
            {selectedPrescription.pharmacyName && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-700">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{selectedPrescription.pharmacyName}</span>
                </div>
              </div>
            )}

            {/* Pickup Code */}
            {selectedPrescription.pickupCode && (
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-center">
                <div className="flex items-center justify-center gap-2 text-primary mb-2">
                  <QrCode className="w-5 h-5" />
                  <span className="font-medium">수령 코드</span>
                </div>
                <div className="text-3xl font-mono font-bold tracking-wider">
                  {selectedPrescription.pickupCode}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-muted-foreground">처방일</div>
                <div>{new Date(selectedPrescription.issuedAt).toLocaleDateString("ko-KR")}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-muted-foreground">유효기간</div>
                <div>{new Date(selectedPrescription.expiresAt).toLocaleDateString("ko-KR")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={onBack}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        대시보드
      </Button>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            내 처방전
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="py-12 text-center">
              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">처방전이 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">
                원격 진료 후 처방전이 여기에 표시됩니다
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-2">
              <div className="space-y-3">
                {prescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    onClick={() => setSelectedPrescription(prescription)}
                    className="p-4 rounded-xl border bg-white hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {prescription.id}
                      </span>
                      <Badge className={cn("text-xs", statusConfig[prescription.status].color)}>
                        {statusConfig[prescription.status].icon}
                        <span className="ml-1">{statusConfig[prescription.status].label}</span>
                      </Badge>
                    </div>
                    
                    <div className="font-medium text-gray-900">
                      {prescription.diagnosis.nameKo}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">
                        {prescription.doctor.name} • {prescription.medications.length}종 약품
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>

                    {prescription.pickupCode && (
                      <div className="mt-2 pt-2 border-t flex items-center gap-2 text-primary">
                        <QrCode className="w-4 h-4" />
                        <span className="font-mono font-medium">{prescription.pickupCode}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

