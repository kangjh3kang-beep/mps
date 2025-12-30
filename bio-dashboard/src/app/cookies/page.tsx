'use client';

/**
 * Cookie Policy Page
 * GDPR/CCPA compliant cookie disclosure
 */

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Cookie, Settings, Shield, BarChart3 } from 'lucide-react';

interface CookieType {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  type: 'essential' | 'functional' | 'analytics' | 'marketing';
}

const cookies: CookieType[] = [
  {
    name: 'next-auth.session-token',
    provider: '만파식',
    purpose: '사용자 인증 및 세션 관리',
    duration: '30일',
    type: 'essential',
  },
  {
    name: 'next-auth.csrf-token',
    provider: '만파식',
    purpose: 'CSRF 공격 방지',
    duration: '세션',
    type: 'essential',
  },
  {
    name: 'mps_locale',
    provider: '만파식',
    purpose: '언어 설정 저장',
    duration: '1년',
    type: 'functional',
  },
  {
    name: 'mps_theme',
    provider: '만파식',
    purpose: '다크모드/라이트모드 설정',
    duration: '1년',
    type: 'functional',
  },
  {
    name: 'mps_consent',
    provider: '만파식',
    purpose: '쿠키 동의 상태 저장',
    duration: '1년',
    type: 'essential',
  },
  {
    name: '_ga',
    provider: 'Google Analytics',
    purpose: '웹사이트 트래픽 분석',
    duration: '2년',
    type: 'analytics',
  },
  {
    name: '_gid',
    provider: 'Google Analytics',
    purpose: '사용자 구분',
    duration: '24시간',
    type: 'analytics',
  },
];

const typeLabels = {
  essential: { label: '필수', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  functional: { label: '기능', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  analytics: { label: '분석', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  marketing: { label: '마케팅', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
};

export default function CookiePolicyPage() {
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
            <Cookie className="w-5 h-5 text-primary" />
            <h1 className="font-semibold">쿠키 정책</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-muted-foreground mb-8">
          최종 수정일: 2024년 12월 29일
        </p>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">쿠키란 무엇인가요?</h2>
          <p className="text-muted-foreground leading-relaxed">
            쿠키는 웹사이트를 방문할 때 브라우저에 저장되는 작은 텍스트 파일입니다. 
            쿠키를 통해 웹사이트는 사용자의 기기를 인식하고, 로그인 상태를 유지하며, 
            사용자 경험을 개선할 수 있습니다.
          </p>
        </section>

        {/* Cookie Categories */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">쿠키 유형</h2>
          
          <div className="grid gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-green-800 dark:text-green-300">필수 쿠키</h3>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400">
                서비스 이용에 필수적인 쿠키입니다. 이 쿠키 없이는 로그인, 보안 기능 등이 작동하지 않습니다. 
                비활성화할 수 없습니다.
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-300">기능 쿠키</h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                언어 설정, 테마 선택 등 사용자 환경설정을 저장합니다. 
                비활성화 시 일부 기능이 제한될 수 있습니다.
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-purple-800 dark:text-purple-300">분석 쿠키</h3>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                웹사이트 사용 현황을 분석하여 서비스를 개선하는 데 사용됩니다. 
                익명으로 수집되며, 설정에서 비활성화할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* Cookie List */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">사용되는 쿠키 목록</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-3 text-left text-sm font-medium">쿠키명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">제공자</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">목적</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">유효기간</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">유형</th>
                </tr>
              </thead>
              <tbody>
                {cookies.map((cookie, index) => (
                  <tr key={index} className="border-b border-border">
                    <td className="px-4 py-3 text-sm font-mono">{cookie.name}</td>
                    <td className="px-4 py-3 text-sm">{cookie.provider}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{cookie.purpose}</td>
                    <td className="px-4 py-3 text-sm">{cookie.duration}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${typeLabels[cookie.type].color}`}>
                        {typeLabels[cookie.type].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Managing Cookies */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">쿠키 관리</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            대부분의 웹 브라우저에서 쿠키 설정을 변경할 수 있습니다. 
            아래 링크에서 각 브라우저의 쿠키 관리 방법을 확인하세요:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Google Chrome
              </a>
            </li>
            <li>
              <a href="https://support.mozilla.org/ko/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a href="https://support.apple.com/ko-kr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Apple Safari
              </a>
            </li>
            <li>
              <a href="https://support.microsoft.com/ko-kr/microsoft-edge/microsoft-edge%EC%97%90%EC%84%9C-%EC%BF%A0%ED%82%A4-%EC%82%AD%EC%A0%9C-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Microsoft Edge
              </a>
            </li>
          </ul>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary">
              개인정보처리방침
            </Link>
            <Link href="/terms" className="hover:text-primary">
              이용약관
            </Link>
            <a href="mailto:privacy@manpasik.com" className="hover:text-primary">
              개인정보 문의
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}


