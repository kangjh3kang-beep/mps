'use client';

/**
 * Terms of Service Page
 * Legal document for Manpasik platform
 */

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TermsOfServicePage() {
  const lastUpdated = '2024년 12월 29일';
  const effectiveDate = '2025년 1월 1일';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="font-semibold">이용약관</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Meta Info */}
        <div className="mb-8 p-4 bg-muted rounded-xl">
          <p className="text-sm text-muted-foreground">
            최종 수정일: {lastUpdated}
            <br />
            시행일: {effectiveDate}
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-8 p-4 bg-card rounded-xl border border-border">
          <h2 className="font-semibold mb-3">목차</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li><a href="#purpose" className="hover:text-primary">목적</a></li>
            <li><a href="#definitions" className="hover:text-primary">정의</a></li>
            <li><a href="#agreement" className="hover:text-primary">약관의 효력 및 변경</a></li>
            <li><a href="#membership" className="hover:text-primary">회원가입 및 관리</a></li>
            <li><a href="#services" className="hover:text-primary">서비스 제공</a></li>
            <li><a href="#obligations" className="hover:text-primary">당사자의 의무</a></li>
            <li><a href="#medical" className="hover:text-primary">의료정보 관련 고지</a></li>
            <li><a href="#liability" className="hover:text-primary">책임의 제한</a></li>
            <li><a href="#termination" className="hover:text-primary">계약 해지</a></li>
            <li><a href="#disputes" className="hover:text-primary">분쟁 해결</a></li>
          </ol>
        </nav>

        {/* Sections */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section id="purpose" className="mb-12">
            <h2 className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">1</span>
              목적
            </h2>
            <p>
              본 약관은 주식회사 만파식적(이하 "회사")이 제공하는 만파식(ManPaSik, MPS) 
              바이오헬스케어 플랫폼 서비스(이하 "서비스")의 이용조건 및 절차, 
              회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section id="definitions" className="mb-12">
            <h2 className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">2</span>
              정의
            </h2>
            <ul>
              <li><strong>"서비스"</strong>란 회사가 제공하는 바이오센서 기반 건강분석, AI 예측, 원격의료 연계 등의 헬스케어 플랫폼을 의미합니다.</li>
              <li><strong>"이용자"</strong>란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 의미합니다.</li>
              <li><strong>"회원"</strong>이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 서비스를 이용할 수 있는 자를 의미합니다.</li>
              <li><strong>"디바이스"</strong>란 회사가 제공하는 바이오센서 리더기 및 카트리지를 의미합니다.</li>
              <li><strong>"측정 데이터"</strong>란 디바이스를 통해 수집된 바이오마커 정보 및 분석 결과를 의미합니다.</li>
            </ul>
          </section>

          <section id="agreement" className="mb-12">
            <h2 className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">3</span>
              약관의 효력 및 변경
            </h2>
            <p>
              본 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다. 
              회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 
              공지사항을 통해 공지합니다.
            </p>
          </section>

          <section id="medical" className="mb-12">
            <h2 className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </span>
              의료정보 관련 고지
            </h2>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 my-4">
              <p className="text-amber-800 dark:text-amber-200 font-medium">
                ⚠️ 중요 고지사항
              </p>
              <ul className="text-amber-700 dark:text-amber-300 text-sm mt-2">
                <li>본 서비스에서 제공하는 정보는 의학적 진단을 대체하지 않습니다.</li>
                <li>측정 결과는 참고용이며, 정확한 진단을 위해서는 반드시 의료 전문가와 상담하세요.</li>
                <li>긴급한 의료 상황에서는 즉시 119 또는 가까운 응급실을 이용하세요.</li>
                <li>AI 분석 결과는 통계적 추정치이며, 개인차가 있을 수 있습니다.</li>
              </ul>
            </div>
          </section>

          <section id="liability" className="mb-12">
            <h2 className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">8</span>
              책임의 제한
            </h2>
            <p>
              회사는 서비스 제공과 관련하여 회사의 고의 또는 중대한 과실이 없는 한, 
              이용자에게 발생한 손해에 대하여 책임을 지지 않습니다.
            </p>
            <ul>
              <li>천재지변 또는 이에 준하는 불가항력으로 인한 서비스 중단</li>
              <li>이용자의 귀책사유로 인한 서비스 이용 장애</li>
              <li>제3자가 불법으로 회사의 서버에 접속하여 발생한 손해</li>
              <li>이용자가 서비스를 이용하여 기대하는 효과를 얻지 못한 경우</li>
            </ul>
          </section>

          <section id="disputes" className="mb-12">
            <h2 className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">10</span>
              분쟁 해결
            </h2>
            <p>
              본 약관과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 성실히 협의하여 
              해결하도록 노력합니다. 협의가 이루어지지 않을 경우 대한민국 법원을 
              관할 법원으로 합니다.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary">
              개인정보처리방침
            </Link>
            <Link href="/cookies" className="hover:text-primary">
              쿠키 정책
            </Link>
            <a href="mailto:legal@manpasik.com" className="hover:text-primary">
              법무팀 문의
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}


