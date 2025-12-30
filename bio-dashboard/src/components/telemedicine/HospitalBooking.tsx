"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Building2,
  MapPin,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  Shield,
  Video
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  searchHospitals,
  getAvailableSlots,
  appointmentManager,
  generateAccessToken,
  type Hospital,
  type Doctor,
  type TimeSlot,
  type Region,
  type Specialty,
  type Appointment,
  REGION_LABELS,
  SPECIALTY_LABELS
} from "@/lib/telemedicine";
import { auditLogger, type ElectronicSignature } from "@/lib/audit-logger";
import { ElectronicSignatureModal } from "@/components/system/ElectronicSignatureModal";

/* ============================================
 * Types
 * ============================================
 */

interface HospitalBookingProps {
  userId: string;
  onBookingComplete?: (appointment: Appointment) => void;
  onStartConsultation?: (appointment: Appointment) => void;
}

type BookingStep = "search" | "hospital" | "doctor" | "calendar" | "consent" | "confirm";

/* ============================================
 * Main Component
 * ============================================
 */

export function HospitalBooking({ 
  userId, 
  onBookingComplete,
  onStartConsultation 
}: HospitalBookingProps) {
  // Booking Flow State
  const [step, setStep] = useState<BookingStep>("search");
  const [selectedRegion, setSelectedRegion] = useState<Region | "">("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | "">("");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [dataShareConsent, setDataShareConsent] = useState(false);
  const [notes, setNotes] = useState("");
  const [consentSignature, setConsentSignature] = useState<ElectronicSignature | null>(null);
  const [consentSigOpen, setConsentSigOpen] = useState(false);
  
  // User Appointments
  const [appointments, setAppointments] = useState<Appointment[]>(() => 
    appointmentManager.getUserAppointments(userId)
  );

  // Search Results
  const searchResults = useMemo(() => {
    return searchHospitals(
      selectedRegion || undefined,
      selectedSpecialty || undefined
    );
  }, [selectedRegion, selectedSpecialty]);

  // Available Slots for Selected Date
  const availableSlots = useMemo(() => {
    if (!selectedDoctor || !selectedDate) return [];
    return getAvailableSlots(selectedDoctor.id, selectedDate);
  }, [selectedDoctor, selectedDate]);

  // Calendar Dates (2 weeks)
  const calendarDates = useMemo(() => {
    const dates: { date: string; dayName: string; dayNum: number; isWeekend: boolean }[] = [];
    const now = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      dates.push({
        date: d.toISOString().split('T')[0],
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6
      });
    }
    
    return dates;
  }, []);

  // Handlers
  const handleSelectHospital = useCallback((hospital: Hospital) => {
    setSelectedHospital(hospital);
    setStep("doctor");
  }, []);

  const handleSelectDoctor = useCallback((doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setStep("calendar");
  }, []);

  const handleSelectSlot = useCallback((slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep("consent");
  }, []);

  const handleConfirmBooking = useCallback(() => {
    if (!selectedHospital || !selectedDoctor || !selectedSlot) return;

    // Part 11: consent requires an electronic signature
    if (dataShareConsent && !consentSignature) {
      setConsentSigOpen(true);
      return;
    }
    
    const appointment = appointmentManager.createAppointment(
      userId,
      selectedHospital,
      selectedDoctor,
      selectedSlot,
      dataShareConsent,
      notes
    );

    // Audit: appointment created (append-only)
    void auditLogger.logAction(
      userId,
      "CREATE",
      null,
      {
        appointmentId: appointment.id,
        hospitalId: appointment.hospitalId,
        doctorId: appointment.doctorId,
        slotId: appointment.slotId,
        dataShareConsent: appointment.dataShareConsent
      },
      "Telemedicine appointment created",
      {
        recordType: "Appointment",
        recordId: appointment.id,
        dataRecord: appointment
      }
    );
    
    setAppointments(appointmentManager.getUserAppointments(userId));
    onBookingComplete?.(appointment);
    setStep("confirm");
  }, [selectedHospital, selectedDoctor, selectedSlot, dataShareConsent, consentSignature, notes, userId, onBookingComplete]);

  const handleReset = useCallback(() => {
    setStep("search");
    setSelectedHospital(null);
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedSlot(null);
    setDataShareConsent(false);
    setNotes("");
  }, []);

  // Progress calculation
  const stepProgress = useMemo(() => {
    const steps: BookingStep[] = ["search", "hospital", "doctor", "calendar", "consent", "confirm"];
    return ((steps.indexOf(step) + 1) / steps.length) * 100;
  }, [step]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4 text-primary" />
              원격 진료 예약
            </CardTitle>
            <CardDescription>
              Telemedicine Booking System
            </CardDescription>
          </div>
          {step !== "search" && step !== "confirm" && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const steps: BookingStep[] = ["search", "hospital", "doctor", "calendar", "consent"];
                const idx = steps.indexOf(step);
                if (idx > 0) setStep(steps[idx - 1]);
              }}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              이전
            </Button>
          )}
        </div>
        <Progress value={stepProgress} className="h-1 mt-2" />
      </CardHeader>
      
      <CardContent className="flex-1 overflow-auto">
        <Tabs value={step === "confirm" ? "appointments" : "booking"} className="h-full">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="booking" onClick={() => step === "confirm" && handleReset()}>
              예약하기
            </TabsTrigger>
            <TabsTrigger value="appointments">
              내 예약 ({appointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="booking" className="mt-0 space-y-4">
            {/* Step 1: Search & Filter */}
            {step === "search" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Region Filter */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      지역 선택
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg text-sm"
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value as Region | "")}
                    >
                      <option value="">전체 지역</option>
                      {Object.entries(REGION_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Specialty Filter */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      진료과 선택
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg text-sm"
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value as Specialty | "")}
                    >
                      <option value="">전체 진료과</option>
                      {Object.entries(SPECIALTY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Hospital List */}
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    검색 결과: {searchResults.length}개 병원
                  </div>
                  {searchResults.map(hospital => (
                    <div
                      key={hospital.id}
                      className="p-3 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                      onClick={() => handleSelectHospital(hospital)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{hospital.name}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" />
                            {REGION_LABELS[hospital.region]}
                            <span>•</span>
                            <Star className="w-3 h-3 text-yellow-500" />
                            {hospital.rating} ({hospital.reviewCount})
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {hospital.specialty.map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">
                            {SPECIALTY_LABELS[s]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Hospital Detail - Select Doctor */}
            {step === "doctor" && selectedHospital && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="font-medium">{selectedHospital.name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    {selectedHospital.address}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    {selectedHospital.phone}
                  </div>
                </div>

                <div className="text-sm font-medium">의사 선택</div>
                <div className="space-y-2">
                  {selectedHospital.doctors
                    .filter(d => !selectedSpecialty || d.specialty === selectedSpecialty)
                    .map(doctor => (
                    <div
                      key={doctor.id}
                      className="p-3 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                      onClick={() => handleSelectDoctor(doctor)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{doctor.name} 전문의</div>
                          <div className="text-xs text-muted-foreground">
                            {SPECIALTY_LABELS[doctor.specialty]} • 경력 {doctor.experience}년
                          </div>
                          <div className="flex items-center gap-1 text-xs mt-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {doctor.rating}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Calendar & Time Selection */}
            {step === "calendar" && selectedDoctor && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{selectedDoctor.name} 전문의</div>
                    <div className="text-xs text-muted-foreground">
                      {SPECIALTY_LABELS[selectedDoctor.specialty]}
                    </div>
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    날짜 선택
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDates.map(d => (
                      <button
                        key={d.date}
                        disabled={d.isWeekend}
                        className={`p-2 text-center rounded-lg text-xs transition-colors ${
                          d.isWeekend 
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : selectedDate === d.date
                              ? "bg-primary text-primary-foreground"
                              : "border hover:border-primary"
                        }`}
                        onClick={() => setSelectedDate(d.date)}
                      >
                        <div className="font-medium">{d.dayNum}</div>
                        <div className="text-[10px]">{d.dayName}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      시간 선택 ({availableSlots.length}개 가능)
                    </div>
                    {availableSlots.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        선택한 날짜에 가능한 시간이 없습니다.
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {availableSlots.map(slot => (
                          <button
                            key={slot.id}
                            className={`p-2 text-center rounded-lg text-sm transition-colors ${
                              selectedSlot?.id === slot.id
                                ? "bg-primary text-primary-foreground"
                                : "border hover:border-primary"
                            }`}
                            onClick={() => handleSelectSlot(slot)}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Data Privacy Consent */}
            {step === "consent" && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 font-medium mb-3">
                    <Shield className="w-5 h-5 text-primary" />
                    데이터 프라이버시
                  </div>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={dataShareConsent}
                        onChange={(e) => {
                          const next = e.target.checked;
                          if (next) {
                            setConsentSigOpen(true);
                            return;
                          }

                          // revoke consent
                          setDataShareConsent(false);
                          setConsentSignature(null);
                          void auditLogger.logAction(
                            userId,
                            "UPDATE",
                            { dataShareConsent: true },
                            { dataShareConsent: false },
                            "User revoked data sharing consent",
                            {
                              recordType: "AppointmentConsent",
                              recordId: `booking:${userId}:${selectedDoctor?.id ?? "unknown"}:${selectedSlot?.id ?? "unknown"}`,
                              dataRecord: {
                                userId,
                                doctorId: selectedDoctor?.id,
                                hospitalId: selectedHospital?.id,
                                slotId: selectedSlot?.id,
                                dataShareConsent: false
                              }
                            }
                          );
                        }}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-sm">
                          건강 리포트 공유 동의
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          최근 Health Score, Trend Chart, 측정 기록을 담당 의사에게 공유합니다.
                          진료 종료 후 접근 권한이 자동으로 만료됩니다.
                        </div>
                      </div>
                    </label>

                    {dataShareConsent && (
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm">
                        <div className="flex items-center gap-2 text-green-700 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          임시 접근 토큰이 생성됩니다 {consentSignature ? "(전자서명 완료)" : ""}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          의사가 진료 중 귀하의 건강 데이터를 확인할 수 있습니다.
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium">메모 (선택)</label>
                      <textarea
                        className="w-full mt-1 p-2 border rounded-lg text-sm"
                        rows={3}
                        placeholder="증상이나 질문을 미리 작성해주세요..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="bg-primary/5 p-4 rounded-lg">
                  <div className="text-sm font-medium mb-2">예약 정보 확인</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">병원</span>
                      <span>{selectedHospital?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">의사</span>
                      <span>{selectedDoctor?.name} 전문의</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">진료과</span>
                      <span>{selectedDoctor && SPECIALTY_LABELS[selectedDoctor.specialty]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">일시</span>
                      <span>{selectedSlot?.date} {selectedSlot?.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">데이터 공유</span>
                      <span>{dataShareConsent ? "✓ 동의" : "✗ 비동의"}</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={handleConfirmBooking}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  예약 확정
                </Button>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {step === "confirm" && (
              <div className="text-center space-y-4 py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold">예약이 완료되었습니다!</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    예약 확인 알림이 전송됩니다.
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={handleReset}>
                    새 예약
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Appointments List */}
          <TabsContent value="appointments" className="mt-0">
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                예약된 진료가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {appointments.map(apt => (
                  <div
                    key={apt.id}
                    className={`p-3 border rounded-lg ${
                      apt.status === "cancelled" ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{apt.hospitalName}</div>
                        <div className="text-sm text-muted-foreground">
                          {apt.doctorName} 전문의 • {SPECIALTY_LABELS[apt.specialty]}
                        </div>
                        <div className="text-sm mt-1">
                          📅 {apt.date} {apt.time}
                        </div>
                        {apt.dataShareConsent && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            🔒 데이터 공유 동의
                          </Badge>
                        )}
                      </div>
                      <Badge 
                        variant={apt.status === "confirmed" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {apt.status === "confirmed" ? "예약됨" : apt.status}
                      </Badge>
                    </div>
                    {apt.status === "confirmed" && (
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => onStartConsultation?.(apt)}
                        >
                          <Video className="w-4 h-4 mr-1" />
                          화상 진료 시작
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            appointmentManager.cancelAppointment(apt.id);
                            setAppointments(appointmentManager.getUserAppointments(userId));
                          }}
                        >
                          취소
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Part 11: Electronic Signature for consent */}
      <ElectronicSignatureModal
        open={consentSigOpen}
        onOpenChange={(open) => {
          setConsentSigOpen(open);
          if (!open && !consentSignature) {
            // cancelled -> keep consent off
            setDataShareConsent(false);
          }
        }}
        signerId={userId}
        title="데이터 공유 동의 전자서명"
        description="건강 리포트 공유 동의는 전자서명이 필요합니다."
        meaningOptions={["I consent to share my recent health reports", "I have reviewed and consent"]}
        defaultMeaning="I consent to share my recent health reports"
        dataToSign={{
          userId,
          doctorId: selectedDoctor?.id,
          hospitalId: selectedHospital?.id,
          slotId: selectedSlot?.id,
          dataShareConsent: true
        }}
        onSigned={async (sig, dataChecksum) => {
          setConsentSignature(sig);
          setDataShareConsent(true);
          await auditLogger.logAction(
            userId,
            "UPDATE",
            { dataShareConsent: false },
            { dataShareConsent: true },
            "User consented to data sharing (Part 11 e-sign)",
            {
              recordType: "AppointmentConsent",
              recordId: `booking:${userId}:${selectedDoctor?.id ?? "unknown"}:${selectedSlot?.id ?? "unknown"}`,
              signature: sig,
              dataRecord: {
                userId,
                doctorId: selectedDoctor?.id,
                hospitalId: selectedHospital?.id,
                slotId: selectedSlot?.id,
                dataShareConsent: true,
                dataChecksum
              }
            }
          );
        }}
      />
    </Card>
  );
}

export default HospitalBooking;

