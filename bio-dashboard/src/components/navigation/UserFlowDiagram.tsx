"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* ============================================
 * Mermaid.js User Flow Diagram
 * ============================================ */

/**
 * User Flow Diagram - "The Organic Loop"
 * 
 * 이 다이어그램은 만파식 앱의 사용자 흐름을 시각화합니다.
 * Home → Analyze → Insight → Care 경로를 보여줍니다.
 */

export const USER_FLOW_MERMAID = `
flowchart TB
    subgraph HOME["🏠 HOME - My Daily Rhythm"]
        H1[Health Score<br/>Moon Jar]
        H2[AI Mate<br/>Morning Briefing]
        H3[To-Do List]
        H4[Weather/Virus<br/>Alert]
    end

    subgraph ANALYZE["📊 ANALYZE - The Lab"]
        A1[Start Measurement]
        A2[Choose Mode<br/>Liquid/Gas/Solid]
        A3[88-dim Raw Data]
        A4[Dual-View Report<br/>Simple/Expert]
        A5[History &<br/>Trend Graphs]
    end

    subgraph CARE["💊 CARE - Hospital & Mall"]
        C1[Telemedicine<br/>Doctor Booking]
        C2[Manpasik Mall<br/>Supplements]
        C3[E-Prescription]
        C4[Global Connect<br/>Real-time Translation]
    end

    subgraph WORLD["🌍 WORLD - The Campus"]
        W1[School<br/>Tutorials]
        W2[Agora<br/>Idea Voting]
        W3[Success Stories]
    end

    subgraph ME["👤 ME - Digital Twin"]
        M1[Medical Records]
        M2[MPS Wallet<br/>Points & Coupons]
        M3[Device Management]
        M4[Settings]
    end

    %% Main Flow: Home → Analyze → Care
    H3 -->|"To-Do: 측정"| A1
    A1 --> A2
    A2 --> A3
    A3 --> A4

    %% Bridge: Result to Care
    A4 -->|"염증 높음<br/>🌉 Bridge"| C1
    A4 -->|"영양 부족<br/>🌉 Bridge"| C2

    %% Care Loop
    C1 --> C3
    C3 --> C2
    C2 -->|"재측정 필요"| A1

    %% School to Measure Bridge
    W1 -->|"튜토리얼 완료<br/>🌉 Bridge"| A1

    %% Twin to Action Bridge
    M1 -->|"목표 업데이트<br/>🌉 Bridge"| C2
    M4 -->|"코치 설정"| H2

    %% Home Connections
    H2 -->|"진료 알림"| C1
    H4 -->|"미세먼지 경보"| C2

    %% Quick Action FAB
    FAB((⚡ FAB)) --> A1
    FAB --> H2
    FAB -->|"🆘 Emergency"| C4

    %% Styling
    classDef home fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e
    classDef analyze fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef care fill:#fce7f3,stroke:#db2777,color:#831843
    classDef world fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
    classDef me fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef fab fill:#3b82f6,stroke:#1d4ed8,color:#ffffff

    class H1,H2,H3,H4 home
    class A1,A2,A3,A4,A5 analyze
    class C1,C2,C3,C4 care
    class W1,W2,W3 world
    class M1,M2,M3,M4 me
    class FAB fab
`;

/* ============================================
 * User Flow Diagram Component
 * ============================================ */

interface UserFlowDiagramProps {
  className?: string;
}

export function UserFlowDiagram({ className }: UserFlowDiagramProps) {
  const [mermaidLoaded, setMermaidLoaded] = React.useState(false);
  const diagramRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Dynamic import of mermaid
    const loadMermaid = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            primaryColor: "#0ea5e9",
            primaryTextColor: "#0c4a6e",
            primaryBorderColor: "#0284c7",
            lineColor: "#64748b",
            secondaryColor: "#f1f5f9",
            tertiaryColor: "#ffffff"
          },
          flowchart: {
            curve: "basis",
            padding: 20,
            nodeSpacing: 50,
            rankSpacing: 50
          }
        });

        if (diagramRef.current) {
          diagramRef.current.innerHTML = "";
          const { svg } = await mermaid.render("user-flow-diagram", USER_FLOW_MERMAID);
          diagramRef.current.innerHTML = svg;
          setMermaidLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load Mermaid:", error);
      }
    };

    loadMermaid();
  }, []);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-slate-50 to-sky-50 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          🗺️ 사용자 흐름 다이어그램
          <span className="text-xs font-normal text-muted-foreground">
            The Organic Loop
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {!mermaidLoaded && (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            다이어그램 로딩 중...
          </div>
        )}
        <div 
          ref={diagramRef}
          className="overflow-x-auto"
          style={{ minHeight: mermaidLoaded ? "auto" : 0 }}
        />

        {/* Legend */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <h4 className="text-sm font-semibold mb-3">범례 (Legend)</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-sky-100 border border-sky-500" />
              <span>HOME</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-500" />
              <span>ANALYZE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-rose-100 border border-rose-500" />
              <span>CARE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-violet-100 border border-violet-500" />
              <span>WORLD</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-100 border border-amber-500" />
              <span>ME</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-lg">🌉</span>
              <span><strong>Bridge:</strong> 컨텍스트 기반 자동 연결 (Dead End 방지)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================
 * Static Flow Description (Fallback)
 * ============================================ */

export function UserFlowDescription() {
  return (
    <div className="space-y-4 text-sm">
      <h3 className="font-bold text-lg">🔄 The Organic Loop - 사용자 흐름</h3>
      
      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
          <h4 className="font-semibold text-sky-800">1️⃣ HOME → ANALYZE</h4>
          <p className="text-sky-700">To-Do의 "측정" 항목 탭 → 측정 페이지로 Deep Link</p>
        </div>

        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <h4 className="font-semibold text-emerald-800">2️⃣ ANALYZE → Result</h4>
          <p className="text-emerald-700">88차원 데이터 분석 → Dual-View 리포트 생성</p>
        </div>

        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
          <h4 className="font-semibold text-rose-800">3️⃣ Result → CARE (Bridge)</h4>
          <p className="text-rose-700">
            염증 수치 높음 → "김 원장님과 상담" 카드 표시<br/>
            영양 부족 → "이 영양제가 도움됩니다" 추천
          </p>
        </div>

        <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
          <h4 className="font-semibold text-violet-800">4️⃣ WORLD → ANALYZE (Bridge)</h4>
          <p className="text-violet-700">
            튜토리얼 완료 → "배운 내용을 직접 측정해보세요" 버튼
          </p>
        </div>

        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
          <h4 className="font-semibold text-amber-800">5️⃣ ME → Action (Bridge)</h4>
          <p className="text-amber-700">
            목표 "근육 증가"로 변경 → AI 코치 페르소나 변경 제안 + 단백질 제품 추천
          </p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <h4 className="font-semibold mb-2">⚡ Quick Action FAB</h4>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>빠른 측정 (마지막 사용 모드)</li>
          <li>메이트와 대화 (음성 모드)</li>
          <li>푸드 렌즈 (카메라 칼로리)</li>
          <li>긴급 SOS</li>
        </ul>
      </div>
    </div>
  );
}

export default UserFlowDiagram;




