"use client";

/**
 * ============================================================
 * MANPASIK EXPERT VERIFICATION PAGE
 * 전문가 인증 신청 페이지 - v0 디자인 적용
 * ============================================================
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Stethoscope, FileText, Upload, Building2, Award, CheckCircle2,
  ArrowLeft, Sparkles, Shield, Clock, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { ExpertType, MemberLevel } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

// 전문가 유형 옵션
const EXPERT_TYPES = [
  { id: ExpertType.DOCTOR, name: "의사", icon: "🩺", desc: "의사 면허 소지자" },
  { id: ExpertType.NURSE, name: "간호사", icon: "💉", desc: "간호사 면허 소지자" },
  { id: ExpertType.PHARMACIST, name: "약사", icon: "💊", desc: "약사 면허 소지자" },
  { id: ExpertType.NUTRITIONIST, name: "영양사", icon: "🥗", desc: "영양사 자격증 소지자" },
  { id: ExpertType.TRAINER, name: "트레이너", icon: "🏋️", desc: "공인 피트니스 트레이너" },
  { id: ExpertType.THERAPIST, name: "치료사", icon: "🧘", desc: "물리/작업 치료사" },
  { id: ExpertType.RESEARCHER, name: "연구원", icon: "🔬", desc: "생명과학/의학 연구원" },
  { id: ExpertType.PROFESSOR, name: "교수", icon: "📚", desc: "의/생명과학 분야 교수" },
];

export default function VerifyExpertPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [step, setStep] = React.useState(1);
  const [selectedType, setSelectedType] = React.useState<ExpertType | null>(null);
  const [formData, setFormData] = React.useState({
    licenseNumber: "",
    organization: "",
    department: "",
    yearsOfExperience: "",
  });
  const [files, setFiles] = React.useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  // 비로그인 시 로그인 페이지로
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/signin?redirect=/auth/verify-expert");
    }
  }, [isAuthenticated, router]);

  // 파일 업로드 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // 제출 핸들러
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // 시뮬레이션: 실제로는 API 호출
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-medium text-foreground mb-2">
            인증 신청 완료!
          </h1>
          <p className="text-muted-foreground mb-6">
            제출해 주신 서류를 검토 중입니다.<br />
            보통 1-3 영업일 내에 결과를 알려드립니다.
          </p>
          <div className="hanji-card rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 text-sm text-foreground mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
              예상 처리 시간: 1-3 영업일
            </div>
            <p className="text-xs text-muted-foreground">
              승인되면 이메일로 알려드리며, 자동으로 전문가 등급이 부여됩니다.
            </p>
          </div>
          <Button className="ink-btn" onClick={() => router.push("/")}>
            홈으로 돌아가기
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 lg:p-8 pb-24">
        {/* Back Button */}
        <Link 
          href="/mode" 
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          모드 선택으로
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-medium text-foreground mb-2">
            전문가 인증 신청
          </h1>
          <p className="text-muted-foreground">
            자격을 인증하고 프로 모드에 접근하세요
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                step >= s ? "bg-purple-600" : "bg-slate-200 dark:bg-slate-700"
              )}
            />
          ))}
        </div>

        {/* Step 1: 전문가 유형 선택 */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-lg font-medium text-foreground mb-4">
              1. 전문 분야를 선택하세요
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {EXPERT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "p-4 rounded-xl text-left transition-all hanji-card",
                    selectedType === type.id
                      ? "ring-2 ring-purple-600 bg-purple-50 dark:bg-purple-900/20"
                      : "hover:bg-hanji-warm"
                  )}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <p className="font-medium text-foreground mt-2">{type.name}</p>
                  <p className="text-xs text-muted-foreground">{type.desc}</p>
                </button>
              ))}
            </div>
            <Button
              className="w-full mt-6 ink-btn"
              disabled={!selectedType}
              onClick={() => setStep(2)}
            >
              다음
            </Button>
          </motion.div>
        )}

        {/* Step 2: 정보 입력 */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-lg font-medium text-foreground mb-4">
              2. 자격 정보를 입력하세요
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>면허/자격증 번호</Label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="12345-67890"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>소속 기관</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="서울대학교병원"
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>부서/전공</Label>
                <Input
                  placeholder="내과"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label>경력 (년)</Label>
                <Input
                  type="number"
                  placeholder="5"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                이전
              </Button>
              <Button
                className="flex-1 ink-btn"
                disabled={!formData.licenseNumber || !formData.organization}
                onClick={() => setStep(3)}
              >
                다음
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: 서류 업로드 */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-lg font-medium text-foreground mb-4">
              3. 증빙 서류를 업로드하세요
            </h2>
            
            <div className="hanji-card rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">필요 서류</p>
                  <ul className="text-muted-foreground mt-1 space-y-1">
                    <li>• 면허증 또는 자격증 사본</li>
                    <li>• 재직증명서 또는 소속 확인서</li>
                    <li>• 신분증 사본 (선택)</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="border-2 border-dashed border-ink/20 rounded-xl p-8 text-center">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-foreground mb-2">
                파일을 끌어다 놓거나 클릭하여 선택
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                PDF, JPG, PNG (최대 10MB)
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="hanji-card" asChild>
                  <span>파일 선택</span>
                </Button>
              </label>
            </div>
            
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                이전
              </Button>
              <Button
                className="flex-1 ink-btn"
                disabled={files.length === 0 || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    인증 신청
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}


