"use client";

/**
 * ============================================================
 * EMERGENCY CONTACTS MANAGEMENT
 * HIPAA 준수 응급 연락처 관리
 * ============================================================
 * 
 * 41-Persona Simulation: User #20 (규제 전문가), User #33 (40대 부장)
 * Issue: "응급 상황 시 데이터 공유가 HIPAA를 위반할 수 있음"
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Phone, 
  Plus, 
  Shield, 
  AlertTriangle,
  Check,
  X,
  Mail,
  User,
  FileText,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  EMERGENCY_CONSENT_LEGAL_TEXT,
  HIPAA_COMPLIANCE_CHECKLIST 
} from "@/lib/emergency-consent";

// ============================================
// TYPES
// ============================================

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  status: 'pending' | 'confirmed' | 'declined';
  consentedAt?: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_CONTACTS: EmergencyContact[] = [
  {
    id: "1",
    name: "김영희",
    relationship: "배우자",
    phone: "010-1234-5678",
    email: "spouse@email.com",
    status: "confirmed",
    consentedAt: "2024-01-15"
  },
  {
    id: "2",
    name: "박철수",
    relationship: "형",
    phone: "010-9876-5432",
    status: "pending"
  }
];

// ============================================
// COMPONENTS
// ============================================

function ConsentModal({ onSign }: { onSign: () => void }) {
  const [agreed, setAgreed] = React.useState(false);
  const [signature, setSignature] = React.useState("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Shield className="w-4 h-4 mr-2" />
          응급 동의서 서명하기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            응급 상황 데이터 공유 동의서
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          {/* Legal Text */}
          <div className="bg-muted p-4 rounded-lg text-xs max-h-48 overflow-y-auto whitespace-pre-wrap">
            {EMERGENCY_CONSENT_LEGAL_TEXT}
          </div>

          {/* HIPAA Checklist */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              HIPAA 준수 체크리스트
            </h4>
            <div className="space-y-2">
              {HIPAA_COMPLIANCE_CHECKLIST.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-xs">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>{item.requirement}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
            <input 
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">
              위 동의서 내용을 읽고 이해했으며, 응급 상황 시 지정된 연락처에 
              제 건강 데이터가 공유되는 것에 동의합니다.
            </span>
          </label>

          {/* Signature */}
          <div>
            <label className="text-sm font-medium">전자 서명</label>
            <Input 
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="본인 성명을 입력하세요"
              className="mt-1"
            />
          </div>

          {/* Submit */}
          <Button 
            className="w-full"
            disabled={!agreed || signature.length < 2}
            onClick={onSign}
          >
            동의 및 서명 완료
          </Button>

          <p className="text-[10px] text-center text-muted-foreground">
            서명 후 언제든지 설정에서 동의를 철회할 수 있습니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddContactDialog({ onAdd }: { onAdd: (contact: Partial<EmergencyContact>) => void }) {
  const [name, setName] = React.useState("");
  const [relationship, setRelationship] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");

  const handleSubmit = () => {
    onAdd({ name, relationship, phone, email });
    setName("");
    setRelationship("");
    setPhone("");
    setEmail("");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          연락처 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>응급 연락처 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium">이름 *</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
            />
          </div>
          <div>
            <label className="text-sm font-medium">관계 *</label>
            <Input 
              value={relationship} 
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="예: 배우자, 부모, 자녀"
            />
          </div>
          <div>
            <label className="text-sm font-medium">전화번호 *</label>
            <Input 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
          <div>
            <label className="text-sm font-medium">이메일 (선택)</label>
            <Input 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          
          <div className="text-xs text-muted-foreground bg-amber-50 p-3 rounded-lg border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 inline mr-1" />
            추가된 연락처에게 동의 요청이 전송됩니다. 
            연락처가 수락해야 응급 시 데이터를 받을 수 있습니다.
          </div>

          <Button 
            className="w-full"
            disabled={!name || !relationship || !phone}
            onClick={handleSubmit}
          >
            동의 요청 보내기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContactCard({ contact, onRemove }: { 
  contact: EmergencyContact; 
  onRemove: () => void;
}) {
  const getStatusBadge = () => {
    switch (contact.status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700">동의 완료</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700">대기 중</Badge>;
      case "declined":
        return <Badge className="bg-red-100 text-red-700">거부됨</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{contact.name}</span>
                {getStatusBadge()}
              </div>
              <div className="text-sm text-muted-foreground">{contact.relationship}</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {contact.phone}
                </span>
                {contact.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {contact.email}
                  </span>
                )}
              </div>
              {contact.consentedAt && (
                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {contact.consentedAt} 동의
                </div>
              )}
            </div>

            <Button variant="ghost" size="icon" onClick={onRemove}>
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = React.useState<EmergencyContact[]>(MOCK_CONTACTS);
  const [consentSigned, setConsentSigned] = React.useState(true);

  const handleAddContact = (contact: Partial<EmergencyContact>) => {
    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      name: contact.name ?? "",
      relationship: contact.relationship ?? "",
      phone: contact.phone ?? "",
      email: contact.email,
      status: "pending"
    };
    setContacts([...contacts, newContact]);
  };

  const handleRemoveContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30 pb-20">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => history.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-red-600" />
            <div>
              <div className="text-lg font-semibold">응급 연락처</div>
              <div className="text-xs text-muted-foreground">
                HIPAA 준수 응급 데이터 공유 설정
              </div>
            </div>
          </div>
        </div>

        {/* Consent Status */}
        <Card className={`mb-6 ${consentSigned ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {consentSigned ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-green-800">동의서 서명 완료</div>
                    <div className="text-xs text-green-700">
                      응급 상황 시 아래 연락처에 건강 데이터가 공유됩니다
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-amber-800">동의서 서명 필요</div>
                    <div className="text-xs text-amber-700">
                      응급 기능을 사용하려면 먼저 동의서에 서명하세요
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Consent Modal if not signed */}
        {!consentSigned && (
          <div className="mb-6">
            <ConsentModal onSign={() => setConsentSigned(true)} />
          </div>
        )}

        {/* Contact List */}
        <div className="space-y-4">
          <h3 className="font-semibold">등록된 연락처 ({contacts.length}명)</h3>
          
          <AnimatePresence>
            {contacts.map((contact) => (
              <ContactCard 
                key={contact.id}
                contact={contact}
                onRemove={() => handleRemoveContact(contact.id)}
              />
            ))}
          </AnimatePresence>

          <AddContactDialog onAdd={handleAddContact} />
        </div>

        {/* Info Section */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              응급 상황 작동 방식
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary">1.</span>
              <span>건강 점수가 30점 이하로 급락하거나 SOS 버튼을 누르면 응급 모드 활성화</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary">2.</span>
              <span>10초 카운트다운 (취소 가능)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary">3.</span>
              <span>동의 완료된 연락처에 SMS/이메일로 건강 데이터 전송</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary">4.</span>
              <span>위치 정보 포함 (설정된 경우)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






