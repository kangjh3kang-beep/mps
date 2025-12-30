/**
 * Manpasik User Flow Diagram
 * 
 * "The Organic Loop" - Intent-Based Navigation Flow
 * 
 * Mermaid.js diagram showing the path from:
 * Home -> Measure -> Insight -> Care
 */

export const USER_FLOW_MERMAID = `
flowchart TB
    subgraph HOME["🏠 HOME - My Daily Rhythm"]
        H1[Health Score]
        H2[AI Mate Greeting]
        H3[Today's To-Do]
        H4[Weather/Virus Alert]
    end

    subgraph ANALYZE["🔬 ANALYZE - The Lab"]
        A1[Quick Measure]
        A2[Measure Modes]
        A3[History & Trends]
        A4[88-dim Insight]
        
        subgraph MODES["Measurement Modes"]
            M1[💧 Liquid]
            M2[💨 Gas]
            M3[🌿 Solid]
            M4[🔍 Non-target]
        end
    end

    subgraph CARE["💊 CARE - Hospital & Mall"]
        C1[Telemedicine]
        C2[Expert Matching]
        C3[Product Shop]
        C4[E-Prescription]
        
        subgraph GLOBAL["Global Connect"]
            G1[AI Translation]
            G2[Video Call]
        end
    end

    subgraph WORLD["🌍 WORLD - The Campus"]
        W1[School/Tutorials]
        W2[Agora/Ideas]
        W3[Success Stories]
        W4[Health Wiki]
    end

    subgraph ME["👤 ME - Digital Twin"]
        ME1[Medical Records]
        ME2[DNA Profile]
        ME3[Wallet/Points]
        ME4[Devices]
        ME5[Settings]
    end

    %% Main Navigation Flow
    HOME --> ANALYZE
    ANALYZE --> CARE
    CARE --> WORLD
    WORLD --> ME
    ME --> HOME

    %% Cross-Tab Bridges (Organic Linking)
    H3 -->|"To-Do Deep Link"| A1
    H3 -->|"Appointment"| C1
    
    A4 -->|"Result-to-Doctor Bridge"| C2
    A4 -->|"Result-to-Shop Bridge"| C3
    
    W1 -->|"School-to-Measure Bridge"| A2
    
    ME1 -->|"Twin-to-Action Bridge"| C3
    ME2 -->|"DNA-based Recommendation"| C3

    %% Measurement Flow
    A1 --> M1
    A1 --> M2
    A1 --> M3
    A1 --> M4
    M1 --> A4
    M2 --> A4
    M3 --> A4
    M4 --> A4

    %% Care Flow
    C1 --> G1
    G1 --> G2
    C2 --> C1
    C1 --> C4
    C4 --> C3

    %% FAB Quick Actions
    FAB((⚡ FAB))
    FAB -->|"Quick Measure"| A1
    FAB -->|"Talk to Mate"| H2
    FAB -->|"Food Lens"| M1
    FAB -->|"Emergency SOS"| C1

    style HOME fill:#e0f2fe,stroke:#0284c7
    style ANALYZE fill:#e0e7ff,stroke:#4f46e5
    style CARE fill:#ffe4e6,stroke:#e11d48
    style WORLD fill:#f3e8ff,stroke:#9333ea
    style ME fill:#f1f5f9,stroke:#475569
    style FAB fill:#fbbf24,stroke:#d97706,color:#000
`;

/**
 * Flow Step Descriptions
 */
export const FLOW_STEPS = {
  "home-to-analyze": {
    from: "HOME",
    to: "ANALYZE",
    trigger: "To-Do 항목 탭 또는 측정 버튼",
    description: "대시보드에서 측정 센터로 이동"
  },
  "analyze-to-care": {
    from: "ANALYZE",
    to: "CARE",
    trigger: "결과 페이지의 Bridge Button",
    description: "분석 결과를 바탕으로 케어 솔루션으로 연결"
  },
  "school-to-measure": {
    from: "WORLD",
    to: "ANALYZE",
    trigger: "튜토리얼 완료 후 Bridge Button",
    description: "배운 내용을 실전에 적용하도록 유도"
  },
  "twin-to-action": {
    from: "ME",
    to: "CARE",
    trigger: "목표 설정 후 Bridge Button",
    description: "개인 목표에 맞는 제품/서비스 추천"
  }
};

/**
 * Tab Definitions with Intent
 */
export const TAB_INTENTS = {
  HOME: {
    intent: "오늘 내 상태를 한눈에 파악하고 싶다",
    koreanName: "홈",
    subtitle: "My Daily Rhythm",
    color: "#0284c7",
    icon: "Home"
  },
  ANALYZE: {
    intent: "내 몸을 측정하고 이해하고 싶다",
    koreanName: "분석",
    subtitle: "The Lab",
    color: "#4f46e5",
    icon: "Activity"
  },
  CARE: {
    intent: "건강 문제를 해결하고 싶다",
    koreanName: "케어",
    subtitle: "Hospital & Mall",
    color: "#e11d48",
    icon: "Stethoscope"
  },
  WORLD: {
    intent: "배우고 성장하고 기여하고 싶다",
    koreanName: "월드",
    subtitle: "The Campus",
    color: "#9333ea",
    icon: "Globe"
  },
  ME: {
    intent: "내 정보와 자산을 관리하고 싶다",
    koreanName: "나",
    subtitle: "Digital Twin",
    color: "#475569",
    icon: "User"
  }
};

/**
 * Bridge Types and Their Contexts
 */
export const BRIDGE_CONTEXTS = {
  "result-to-doctor": {
    description: "분석 결과가 주의/위험일 때 전문가 상담 유도",
    fromTab: "ANALYZE",
    toTab: "CARE",
    conditions: ["severity >= medium", "status === 'warning' || 'danger'"]
  },
  "result-to-shop": {
    description: "분석 결과에 맞는 제품 추천",
    fromTab: "ANALYZE",
    toTab: "CARE",
    conditions: ["hasRecommendedProduct"]
  },
  "school-to-measure": {
    description: "튜토리얼 완료 후 실전 측정 유도",
    fromTab: "WORLD",
    toTab: "ANALYZE",
    conditions: ["tutorial.completed", "tutorial.hasMeasureMode"]
  },
  "twin-to-action": {
    description: "사용자 목표 설정 후 관련 액션 추천",
    fromTab: "ME",
    toTab: "CARE",
    conditions: ["user.hasGoal"]
  }
};

export default USER_FLOW_MERMAID;

