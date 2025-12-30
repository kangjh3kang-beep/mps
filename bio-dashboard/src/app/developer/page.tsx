"use client";

/**
 * ============================================================
 * DEVELOPER PORTAL
 * 개발자 API 포털
 * ============================================================
 * 
 * 41-Persona Simulation: User #38 (AI 스타트업 CEO)
 * Feature: "우리 앱에 Manpasik 데이터를 연동하고 싶다"
 */

import * as React from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Code2, 
  Key, 
  Copy, 
  Check,
  ExternalLink,
  BookOpen,
  Shield,
  Zap,
  Clock,
  BarChart3,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// ============================================
// TYPES
// ============================================

interface APIKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  permissions: string[];
  rateLimit: number;
  requestsToday: number;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_API_KEY: APIKey = {
  id: "1",
  name: "Production Key",
  key: "mps_live_sk_1234567890abcdef",
  createdAt: "2024-01-15",
  lastUsed: "2024-12-28 10:30",
  permissions: ["read:measurements", "read:insights", "write:webhooks"],
  rateLimit: 1000,
  requestsToday: 247
};

const API_ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/measurements",
    description: "사용자의 측정 기록 조회",
    rateLimit: "100/min"
  },
  {
    method: "GET",
    path: "/api/v1/measurements/{id}",
    description: "특정 측정 상세 조회 (88차원 벡터 포함)",
    rateLimit: "100/min"
  },
  {
    method: "GET",
    path: "/api/v1/insights",
    description: "AI 인사이트 및 건강 점수 조회",
    rateLimit: "50/min"
  },
  {
    method: "POST",
    path: "/api/v1/webhooks",
    description: "이벤트 웹훅 등록",
    rateLimit: "10/min"
  },
  {
    method: "GET",
    path: "/api/v1/user/profile",
    description: "사용자 프로필 조회",
    rateLimit: "100/min"
  }
];

// ============================================
// COMPONENTS
// ============================================

function APIKeyCard({ apiKey }: { apiKey: APIKey }) {
  const [copied, setCopied] = React.useState(false);
  const [showKey, setShowKey] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedKey = apiKey.key.slice(0, 12) + "..." + apiKey.key.slice(-4);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            {apiKey.name}
          </CardTitle>
          <Badge className="bg-green-100 text-green-700">활성</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* API Key Display */}
        <div className="flex items-center gap-2 mb-4">
          <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono">
            {showKey ? apiKey.key : maskedKey}
          </code>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? "🙈" : "👁️"}
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold">{apiKey.requestsToday}</div>
            <div className="text-[10px] text-muted-foreground">오늘 요청</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold">{apiKey.rateLimit}</div>
            <div className="text-[10px] text-muted-foreground">일일 한도</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {Math.round((apiKey.requestsToday / apiKey.rateLimit) * 100)}%
            </div>
            <div className="text-[10px] text-muted-foreground">사용량</div>
          </div>
        </div>

        {/* Permissions */}
        <div className="mb-4">
          <div className="text-xs font-medium mb-2">권한</div>
          <div className="flex flex-wrap gap-1">
            {apiKey.permissions.map(perm => (
              <Badge key={perm} variant="secondary" className="text-[10px]">
                {perm}
              </Badge>
            ))}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>생성: {apiKey.createdAt}</span>
          <span>마지막 사용: {apiKey.lastUsed}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function EndpointCard({ endpoint }: { 
  endpoint: typeof API_ENDPOINTS[0];
}) {
  const methodColors: Record<string, string> = {
    GET: "bg-green-100 text-green-700",
    POST: "bg-blue-100 text-blue-700",
    PUT: "bg-amber-100 text-amber-700",
    DELETE: "bg-red-100 text-red-700"
  };

  return (
    <div className="p-3 border rounded-xl hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <Badge className={`${methodColors[endpoint.method]} text-[10px] font-mono`}>
          {endpoint.method}
        </Badge>
        <code className="text-sm font-mono text-primary">{endpoint.path}</code>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{endpoint.description}</span>
        <Badge variant="outline" className="text-[10px]">
          <Clock className="w-3 h-3 mr-1" />
          {endpoint.rateLimit}
        </Badge>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function DeveloperPortalPage() {
  const [apiKey] = React.useState<APIKey>(MOCK_API_KEY);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white pb-20">
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => history.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-primary" />
            <div>
              <div className="text-xl font-bold">Developer Portal</div>
              <div className="text-xs text-slate-400">
                Manpasik API v1.0
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: BookOpen, label: "문서", href: "/developer/docs" },
            { icon: Shield, label: "인증", href: "/developer/auth" },
            { icon: Zap, label: "Webhooks", href: "/developer/webhooks" },
            { icon: BarChart3, label: "사용량", href: "/developer/usage" }
          ].map((item) => (
            <motion.a
              key={item.label}
              href={item.href}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors text-center"
            >
              <item.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">{item.label}</div>
            </motion.a>
          ))}
        </div>

        {/* API Key Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" />
            API 키
          </h2>
          <APIKeyCard apiKey={apiKey} />
          
          <Button variant="outline" className="mt-4 text-white border-white/20 hover:bg-white/10">
            <Key className="w-4 h-4 mr-2" />
            새 API 키 생성
          </Button>
        </div>

        {/* Endpoints */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            API 엔드포인트
          </h2>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 space-y-2">
              {API_ENDPOINTS.map((endpoint, i) => (
                <EndpointCard key={i} endpoint={endpoint} />
              ))}
            </CardContent>
          </Card>
          
          <Button 
            className="mt-4"
            onClick={() => window.open('/developer/docs', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            전체 API 문서 보기
          </Button>
        </div>

        {/* Code Example */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">빠른 시작</h2>
          <Card className="bg-slate-950 border-white/10">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">
                JavaScript / Node.js
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm font-mono text-green-400 overflow-x-auto">
{`const response = await fetch(
  'https://api.manpasik.com/v1/measurements',
  {
    headers: {
      'Authorization': 'Bearer mps_live_sk_...',
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log(data.measurements);`}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Rate Limiting Notice */}
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <div className="font-medium text-amber-400">Rate Limiting</div>
                <p className="text-xs text-slate-300 mt-1">
                  API 요청은 분당/일일 제한이 있습니다. 제한 초과 시 429 에러가 반환됩니다.
                  더 높은 한도가 필요하면 Enterprise 플랜을 문의하세요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
