"use client";

import React, { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrescriptionView } from "./PrescriptionView";
import { PharmacySelector } from "./PharmacySelector";
import { PickupConfirmation } from "./PickupConfirmation";
import { 
  createPrescription, 
  sendToPharmacy,
  type Prescription,
  type Pharmacy,
  ICD10_CODES
} from "@/lib/prescription";
import { type Appointment, appointmentManager, SPECIALTY_LABELS } from "@/lib/telemedicine";
import { auditLogger, type ElectronicSignature } from "@/lib/audit-logger";
import { ElectronicSignatureModal } from "@/components/system/ElectronicSignatureModal";

interface PostConsultationFlowProps {
  appointment: Appointment;
  onComplete: () => void;
}

type FlowStep = "prescription" | "pharmacy" | "confirmation";

/**
 * Post-Consultation Flow
 * 
 * 진료 종료 후 플로우
 * 1. 처방전 확인
 * 2. 약국 선택
 * 3. 수령 확인
 */
export function PostConsultationFlow({ 
  appointment, 
  onComplete 
}: PostConsultationFlowProps) {
  const [step, setStep] = useState<FlowStep>("prescription");
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [showPrescriptionDetail, setShowPrescriptionDetail] = useState(false);
  const [doctorSignature, setDoctorSignature] = useState<ElectronicSignature | null>(null);
  const [doctorSigOpen, setDoctorSigOpen] = useState(false);

  // 진료과에 따른 ICD-10 코드 매핑
  const diagnosisCode = useMemo(() => {
    const specialtyToICD: Record<string, string> = {
      internal: "J06.9",      // 급성 상기도 감염
      cardiology: "I10",      // 고혈압
      endocrinology: "E11.9", // 당뇨
      nephrology: "N18.3",    // 만성 신장질환
      neurology: "G43.9",     // 편두통
      dermatology: "L30.9",   // 피부염
      psychiatry: "F32.9",    // 우울장애
      family: "J06.9"         // 급성 상기도 감염
    };
    return specialtyToICD[appointment.specialty] || "J06.9";
  }, [appointment.specialty]);

  // 처방전 생성 (첫 로드 시)
  React.useEffect(() => {
    const newPrescription = createPrescription(
      appointment.id,
      appointment.userId,
      "홍길동", // Mock patient name
      appointment.doctorId,
      appointment.doctorName,
      `MD-${appointment.doctorId.slice(-6).toUpperCase()}`,
      appointment.hospitalName,
      diagnosisCode
    );
    setPrescription(newPrescription);
    // Part 11: doctor approval signature required before proceeding
    setDoctorSigOpen(true);
  }, [appointment, diagnosisCode]);

  // 약국 선택 처리
  const handleSelectPharmacy = (pharmacy: Pharmacy) => {
    if (prescription) {
      const updatedPrescription = sendToPharmacy(prescription, pharmacy.id);
      setPrescription(updatedPrescription);
      
      // 예약 상태를 완료로 변경
      appointmentManager.updateStatus(appointment.id, "completed");
      
      setStep("confirmation");
    }
  };

  // 처방전 확인 후 약국 선택으로
  const handleProceedToPharmacy = () => {
    if (!doctorSignature) {
      setDoctorSigOpen(true);
      return;
    }
    setStep("pharmacy");
  };

  // 홈으로 돌아가기
  const handleGoHome = () => {
    onComplete();
  };

  if (!prescription) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-muted-foreground">처방전 생성 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Back Button */}
      {step !== "confirmation" && step !== "prescription" && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4"
          onClick={() => {
            if (step === "pharmacy") setStep("prescription");
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          이전
        </Button>
      )}

      {/* Step Content */}
      {step === "prescription" && (
        <div className="space-y-4">
          <PrescriptionView 
            prescription={prescription} 
            showActions={false}
          />
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleGoHome}
            >
              나중에
            </Button>
            <Button 
              className="flex-1"
              onClick={handleProceedToPharmacy}
            >
              약국 선택{doctorSignature ? "" : " (의사 서명 필요)"}
            </Button>
          </div>
        </div>
      )}

      {step === "pharmacy" && (
        <PharmacySelector
          prescription={prescription}
          onSelectPharmacy={handleSelectPharmacy}
          onCancel={() => setStep("prescription")}
        />
      )}

      {step === "confirmation" && (
        <PickupConfirmation
          prescription={prescription}
          onGoHome={handleGoHome}
          onViewPrescription={() => setShowPrescriptionDetail(true)}
        />
      )}

      {/* Prescription Detail Modal */}
      {showPrescriptionDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-auto">
            <PrescriptionView 
              prescription={prescription}
              onClose={() => setShowPrescriptionDetail(false)}
            />
          </div>
        </div>
      )}

      {/* Part 11: Electronic Signature for Doctor Approval */}
      {prescription && (
        <ElectronicSignatureModal
          open={doctorSigOpen}
          onOpenChange={setDoctorSigOpen}
          signerId={appointment.doctorId}
          title="의사 승인 전자서명"
          description="진단/처방 승인은 전자서명이 필요합니다."
          meaningOptions={["I approve this result", "I have reviewed"]}
          defaultMeaning="I approve this result"
          dataToSign={{
            prescriptionId: prescription.id,
            appointmentId: appointment.id,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctorName,
            hospitalName: appointment.hospitalName,
            diagnosisCode,
            specialty: appointment.specialty,
            createdAt: prescription.prescribedAt
          }}
          onSigned={async (sig) => {
            setDoctorSignature(sig);
            await auditLogger.logAction(
              appointment.doctorId,
              "UPDATE",
              { status: "pending_approval" },
              { status: "approved" },
              "Doctor approved diagnosis/prescription (Part 11 e-sign)",
              {
                recordType: "Prescription",
                recordId: prescription.id,
                signature: sig,
                dataRecord: prescription
              }
            );
          }}
        />
      )}
    </div>
  );
}

export default PostConsultationFlow;

