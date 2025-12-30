"use client";

import React from "react";
import {
  FileText,
  User,
  Building2,
  Calendar,
  Pill,
  AlertTriangle,
  Shield,
  CheckCircle2,
  Clock,
  Copy,
  Download
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { type Prescription, type Medication, validatePrescription } from "@/lib/prescription";

interface PrescriptionViewProps {
  prescription: Prescription;
  onClose?: () => void;
  showActions?: boolean;
}

/**
 * Digital Prescription View Component
 * 
 * 전자 처방전 표시 컴포넌트
 * - 의사 정보
 * - ICD-10 진단 코드
 * - 처방 약품 목록
 * - 디지털 서명 해시
 */
export function PrescriptionView({ 
  prescription, 
  onClose,
  showActions = true 
}: PrescriptionViewProps) {
  const validation = validatePrescription(prescription);
  const isExpired = Date.now() > prescription.validUntil;
  
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const copySignature = () => {
    navigator.clipboard.writeText(prescription.digitalSignature);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">전자 처방전</CardTitle>
              <CardDescription className="font-mono text-xs">
                {prescription.id}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <Badge 
              variant={isExpired ? "destructive" : "secondary"}
              className="mb-1"
            >
              {isExpired ? "만료됨" : prescription.status === "sent_to_pharmacy" ? "약국 전송됨" : "유효"}
            </Badge>
            {validation.isValid && !isExpired && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                서명 검증됨
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Doctor & Hospital Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" /> 처방 의사
            </div>
            <div className="font-medium">{prescription.doctorName}</div>
            <div className="text-xs text-muted-foreground">
              면허번호: {prescription.doctorLicense}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3 h-3" /> 의료기관
            </div>
            <div className="font-medium">{prescription.hospitalName}</div>
          </div>
        </div>

        <Separator />

        {/* Diagnosis */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">진단명 (ICD-10)</div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {prescription.diagnosisCode}
            </Badge>
            <span className="font-medium">{prescription.diagnosisNameKo}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {prescription.diagnosisName}
          </div>
        </div>

        {/* Medications */}
        <div>
          <div className="text-sm font-medium mb-2 flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" />
            처방 약품 ({prescription.medications.length}종)
          </div>
          <div className="space-y-3">
            {prescription.medications.map((med, idx) => (
              <MedicationCard key={med.id} medication={med} index={idx + 1} />
            ))}
          </div>
        </div>

        <Separator />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> 처방일
            </div>
            <div>{formatDate(prescription.prescribedAt)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> 유효기간
            </div>
            <div className={isExpired ? "text-red-600" : ""}>
              {formatDate(prescription.validUntil)}
            </div>
          </div>
        </div>

        <Separator />

        {/* Digital Signature */}
        <div className="bg-gray-900 text-white p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">디지털 서명 (Hash Chain)</span>
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-400 mb-1">Signature Hash</div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-green-400 bg-gray-800 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                  {prescription.digitalSignature}
                </code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-gray-400 hover:text-white"
                  onClick={copySignature}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div>
              <div className="text-xs text-gray-400 mb-1">Hash Chain ({prescription.signatureChain.length} blocks)</div>
              <div className="space-y-1">
                {prescription.signatureChain.map((hash, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-8">#{idx + 1}</span>
                    <code className="font-mono text-gray-400 truncate">
                      {hash.slice(0, 32)}...
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500 border-t border-gray-700 pt-2">
            본 처방전은 블록체인 해시 체인으로 서명되어 위변조가 불가능합니다.
          </div>
        </div>

        {/* Validation Errors */}
        {!validation.isValid && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-1">
              <AlertTriangle className="w-4 h-4" />
              검증 오류
            </div>
            <ul className="text-xs text-red-600 list-disc list-inside">
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              닫기
            </Button>
            <Button className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              PDF 저장
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Medication Card Component
 */
function MedicationCard({ medication, index }: { medication: Medication; index: number }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {index}
          </div>
          <div>
            <div className="font-medium">{medication.nameKo}</div>
            <div className="text-xs text-muted-foreground">
              {medication.name} ({medication.genericName})
            </div>
          </div>
        </div>
        <Badge variant="secondary">{medication.dosage}</Badge>
      </div>
      
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">복용법:</span>
          <div>{medication.frequency}</div>
        </div>
        <div>
          <span className="text-muted-foreground">기간:</span>
          <div>{medication.duration}</div>
        </div>
        <div>
          <span className="text-muted-foreground">수량:</span>
          <div>{medication.quantity}정</div>
        </div>
      </div>
      
      <div className="mt-2 text-xs bg-muted/50 p-2 rounded">
        <div className="text-muted-foreground mb-1">복용 지침</div>
        <div>{medication.instructions}</div>
      </div>
      
      {medication.warnings && medication.warnings.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {medication.warnings.map((warning, i) => (
            <Badge key={i} variant="destructive" className="text-xs">
              ⚠ {warning}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default PrescriptionView;






