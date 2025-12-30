/**
 * ============================================================
 * MANPASIK PERSONA COUNCIL SIMULATOR
 * 41 High-Fidelity Personas for System Stress Testing
 * ============================================================
 */

// ============================================
// PERSONA DEFINITIONS
// ============================================

export type PersonaGroup = 'expert' | 'user';

export interface Persona {
  id: number;
  name: string;
  role: string;
  group: PersonaGroup;
  focusArea: string[];
  painPoints: string[];
  needs: string[];
}

// Group A: Expert Panel (Technical Validity & Regulations)
export const expertPanel: Persona[] = [
  {
    id: 1,
    name: "특허 변호사",
    role: "Patent Attorney",
    group: "expert",
    focusArea: ["IP Protection", "Patent Claims", "Freedom-to-Operate"],
    painPoints: ["새 기능마다 IP 충돌 가능성", "글로벌 특허 매핑 부재"],
    needs: ["자동 IP 검토 시스템", "특허 인용 데이터베이스"]
  },
  {
    id: 2,
    name: "특허 심사관",
    role: "Patent Examiner",
    group: "expert",
    focusArea: ["Novelty Assessment", "Prior Art Search", "Claims Validity"],
    painPoints: ["88차원 벡터의 신규성 증명 어려움"],
    needs: ["선행기술 자동 검색", "청구항 차별화 문서"]
  },
  {
    id: 3,
    name: "기계공학 박사",
    role: "Mech. Eng. PhD",
    group: "expert",
    focusArea: ["EHD Suction", "Mechanical Durability", "Fluid Dynamics"],
    painPoints: ["EHD 펌프 장기 내구성 미검증", "온습도 변화에 따른 흡입력 변동"],
    needs: ["MTBF 테스트 데이터", "환경 시험 결과"]
  },
  {
    id: 4,
    name: "물리학 박사",
    role: "Physics PhD",
    group: "expert",
    focusArea: ["88-dim Vector Math", "Signal Processing", "Noise Analysis"],
    painPoints: ["CV/EIS/SWV 크로스톡 분석 부족", "양자화 오차 누적"],
    needs: ["정밀도 분석 보고서", "신호 무결성 증명"]
  },
  {
    id: 5,
    name: "재료공학 박사",
    role: "Materials PhD",
    group: "expert",
    focusArea: ["PLA/PHA Biodegradability", "Material Safety", "Biocompatibility"],
    painPoints: ["생분해 인증 문서 부재", "장기 안정성 데이터 없음"],
    needs: ["ISO 13485 준수 증명", "생체적합성 테스트"]
  },
  {
    id: 6,
    name: "MBA (경영)",
    role: "MBA",
    group: "expert",
    focusArea: ["Profit Margin", "Unit Economics", "Market Strategy"],
    painPoints: ["Mall 마진율 불투명", "CAC/LTV 분석 부재"],
    needs: ["상품별 마진 대시보드", "고객 생애가치 분석"]
  },
  {
    id: 7,
    name: "생명공학 박사",
    role: "Bio-Eng. PhD",
    group: "expert",
    focusArea: ["Enzyme Kinetics", "Biosensor Design", "Reaction Rates"],
    painPoints: ["효소 안정성 시간대별 변화", "포화 곡선 정확도"],
    needs: ["Michaelis-Menten 파라미터", "효소 수명 예측"]
  },
  {
    id: 8,
    name: "공학 박사",
    role: "Engineering PhD",
    group: "expert",
    focusArea: ["System Integration", "Architecture", "Scalability"],
    painPoints: ["모듈 간 결합도 높음", "테스트 커버리지 부족"],
    needs: ["아키텍처 문서", "통합 테스트 스위트"]
  },
  {
    id: 9,
    name: "전기화학 박사",
    role: "Elec/Chem PhD",
    group: "expert",
    focusArea: ["Electrode Noise", "Electrochemistry", "Signal Quality"],
    painPoints: ["전극 노이즈 레벨 높음", "온도 보정 미흡"],
    needs: ["노이즈 스펙트럼 분석", "자동 온도 보정"]
  },
  {
    id: 10,
    name: "의공학 박사",
    role: "Biomedical Eng. PhD",
    group: "expert",
    focusArea: ["Biocompatibility", "Medical Device Standards", "Safety"],
    painPoints: ["피부 접촉 테스트 미비", "알레르기 반응 데이터 없음"],
    needs: ["ISO 10993 테스트", "임상시험 데이터"]
  },
  {
    id: 11,
    name: "반도체 개발자",
    role: "Semiconductor Dev",
    group: "expert",
    focusArea: ["MCU/ADC Interface", "Power Management", "EMI/EMC"],
    painPoints: ["ADC 분해능 16비트로 부족할 수 있음", "전력 소모 최적화"],
    needs: ["24비트 ADC 검토", "저전력 모드"]
  },
  {
    id: 12,
    name: "센서 전문가",
    role: "Sensor Expert",
    group: "expert",
    focusArea: ["Cross-talk", "Calibration", "Drift Compensation"],
    painPoints: ["모션 아티팩트로 인한 신호 왜곡", "장기 드리프트"],
    needs: ["모션 필터 알고리즘", "자동 재교정 시스템"]
  },
  {
    id: 13,
    name: "마이크로유체공학자",
    role: "Microfluidics Eng",
    group: "expert",
    focusArea: ["Fluid Flow", "Filter Design", "Sample Collection"],
    painPoints: ["미세채널 막힘 문제", "불균일 유량"],
    needs: ["유체 시뮬레이션", "막힘 감지 센서"]
  },
  {
    id: 14,
    name: "펌웨어 엔지니어",
    role: "Firmware Eng",
    group: "expert",
    focusArea: ["RTOS", "Latency", "OTA Updates"],
    painPoints: ["실시간 응답 지연", "OTA 실패 시 복구"],
    needs: ["RTOS 최적화", "Failsafe 부트로더"]
  },
  {
    id: 15,
    name: "풀스택 개발자",
    role: "Full-stack Dev",
    group: "expert",
    focusArea: ["UI/UX", "API Performance", "Security"],
    painPoints: ["초기 로딩 30초 이상", "API 레이턴시 높음"],
    needs: ["코드 스플리팅", "Redis 캐싱"]
  },
  {
    id: 16,
    name: "계산물리학 박사",
    role: "Comp. Physics PhD",
    group: "expert",
    focusArea: ["Digital Twin", "Simulation", "Modeling"],
    painPoints: ["디지털 트윈 정확도 검증 안됨"],
    needs: ["시뮬레이션 벤치마크", "Monte Carlo 검증"]
  },
  {
    id: 17,
    name: "분석화학자",
    role: "Analytical Chemist",
    group: "expert",
    focusArea: ["Calibration Curves", "LOD/LOQ", "Accuracy"],
    painPoints: ["검출한계 증명 문서 없음", "교정 곡선 R² 부족"],
    needs: ["검출한계 인증", "정밀도/정확도 보고서"]
  },
  {
    id: 18,
    name: "생화학자",
    role: "Biochemist",
    group: "expert",
    focusArea: ["Target Binding", "Specificity", "Cross-reactivity"],
    painPoints: ["비특이적 결합 이슈", "간섭물질 테스트 미비"],
    needs: ["특이성 테스트", "간섭물질 목록"]
  },
  {
    id: 19,
    name: "임상병리사",
    role: "Clinical Pathologist",
    group: "expert",
    focusArea: ["MPS vs Lab Correlation", "Clinical Validation", "Reference Range"],
    painPoints: ["임상검사 대비 정확도 미검증", "참조범위 불명확"],
    needs: ["Bland-Altman 분석", "임상시험 결과"]
  },
  {
    id: 20,
    name: "규제 전문가",
    role: "Regulatory Expert",
    group: "expert",
    focusArea: ["FDA/HIPAA/GDPR", "21 CFR Part 11", "IVD Regulations"],
    painPoints: ["HIPAA 준수 증명 부족", "전자서명 미흡"],
    needs: ["규제 체크리스트", "감사 추적 로그"]
  }
];

// Group B: General Public (UX, Usability & Life)
export const userPanel: Persona[] = [
  {
    id: 21,
    name: "헬스 트레이너",
    role: "Health Trainer",
    group: "user",
    focusArea: ["Client Management", "Lactate Tracking", "Performance"],
    painPoints: ["다수 고객 데이터 관리 어려움", "실시간 공유 불가"],
    needs: ["멀티 프로필", "실시간 대시보드"]
  },
  {
    id: 22,
    name: "축구 선수",
    role: "Soccer Player",
    group: "user",
    focusArea: ["Ruggedness", "Quick Measurement", "Sweat Resistance"],
    painPoints: ["격렬한 운동 중 사용 불가", "땀으로 인한 오작동"],
    needs: ["방수 케이스", "퀵 측정 모드"]
  },
  {
    id: 23,
    name: "야구 선수",
    role: "Baseball Player",
    group: "user",
    focusArea: ["Arm Condition", "Inflammation", "Recovery"],
    painPoints: ["염증 마커 지원 없음"],
    needs: ["염증 바이오마커 카트리지"]
  },
  {
    id: 24,
    name: "골프 선수",
    role: "Golf Player",
    group: "user",
    focusArea: ["Focus", "Stress Levels", "Concentration"],
    painPoints: ["스트레스 레벨 정확도 의문"],
    needs: ["코르티솔 측정", "집중력 가이드"]
  },
  {
    id: 25,
    name: "회사원",
    role: "Corporate Employee",
    group: "user",
    focusArea: ["Work-Life Balance", "Stress", "Quick Use"],
    painPoints: ["바쁜 일과 중 측정 시간 부족", "회의 중 알람 곤란"],
    needs: ["무음 모드", "5분 퀵 체크"]
  },
  {
    id: 26,
    name: "주부",
    role: "Housewife",
    group: "user",
    focusArea: ["Family Health", "Kids", "Convenience"],
    painPoints: ["가족 전체 관리 불편", "아이들용 UI 없음"],
    needs: ["가족 계정", "키즈 모드"]
  },
  {
    id: 27,
    name: "초등학생",
    role: "Elementary Student",
    group: "user",
    focusArea: ["Fun", "Gamification", "Easy UI"],
    painPoints: ["재미없음", "어려운 용어"],
    needs: ["캐릭터/게이미피케이션", "쉬운 언어"]
  },
  {
    id: 28,
    name: "중학생",
    role: "Middle Schooler",
    group: "user",
    focusArea: ["Privacy", "Independence", "Cool Design"],
    painPoints: ["부모가 모든 데이터 볼 수 있음"],
    needs: ["프라이버시 모드", "선택적 공유"]
  },
  {
    id: 29,
    name: "고등학생",
    role: "High Schooler",
    group: "user",
    focusArea: ["Exam Stress", "Sleep", "Study Performance"],
    painPoints: ["스트레스 관리 조언 부족"],
    needs: ["시험 기간 모드", "수면 분석"]
  },
  {
    id: 30,
    name: "대학생",
    role: "College Student",
    group: "user",
    focusArea: ["Diet", "Alcohol", "Budget"],
    painPoints: ["음주 후 건강 영향 확인 어려움", "가성비 제품 없음"],
    needs: ["알코올 대사 추적", "학생 할인"]
  },
  {
    id: 31,
    name: "20대 직장인 (만성질환)",
    role: "20s Office Worker (Chronic)",
    group: "user",
    focusArea: ["Early Diabetes", "Medication Reminder", "Discrete Use"],
    painPoints: ["직장 동료에게 알려지기 싫음", "약 복용 알림 없음"],
    needs: ["디스크리트 모드", "약 알림"]
  },
  {
    id: 32,
    name: "30대 과장 (만성질환)",
    role: "30s Manager A (Chronic)",
    group: "user",
    focusArea: ["Hypertension", "Stress", "Quick Check"],
    painPoints: ["높은 스트레스", "시간 부족"],
    needs: ["스트레스 상관관계", "원클릭 리포트"]
  },
  {
    id: 33,
    name: "40대 부장 (만성질환)",
    role: "40s Director B (Chronic)",
    group: "user",
    focusArea: ["Hyperlipidemia", "Cholesterol", "Diet"],
    painPoints: ["콜레스테롤 추적 어려움", "식단 연동 없음"],
    needs: ["지질 바이오마커", "식단 앱 연동"]
  },
  {
    id: 34,
    name: "50대 임원 (만성질환)",
    role: "50s Exec C (Chronic)",
    group: "user",
    focusArea: ["Gout", "Uric Acid", "Precise Diet"],
    painPoints: ["요산 수치 관리 필요", "정밀 식단 가이드 없음"],
    needs: ["요산 측정", "통풍 예방 AI"]
  },
  {
    id: 35,
    name: "60대 자영업자",
    role: "60s Self-Employed",
    group: "user",
    focusArea: ["Large Fonts", "Simple UI", "Voice"],
    painPoints: ["글씨가 너무 작음", "버튼이 작아 터치 어려움"],
    needs: ["시니어 모드", "음성 안내"]
  },
  {
    id: 36,
    name: "70대 은퇴자",
    role: "70s Retiree",
    group: "user",
    focusArea: ["SOS", "Battery", "Family Connect"],
    painPoints: ["충전 자주 잊음", "긴급 시 연락 어려움"],
    needs: ["저배터리 알림", "SOS 버튼"]
  },
  {
    id: 37,
    name: "폐암 생존자",
    role: "Lung Cancer Survivor",
    group: "user",
    focusArea: ["Air Quality", "EHD Safety", "Sensitivity"],
    painPoints: ["EHD 공기 흡입 시 불안함"],
    needs: ["HEPA 필터 증명", "저자극 모드"]
  },
  {
    id: 38,
    name: "AI 스타트업 CEO",
    role: "AI Startup CEO",
    group: "user",
    focusArea: ["API Access", "Integration", "Data Export"],
    painPoints: ["API 문서 없음", "데이터 내보내기 불가"],
    needs: ["Developer API", "웹훅"]
  },
  {
    id: 39,
    name: "AI 전공 학생",
    role: "AI Major Student",
    group: "user",
    focusArea: ["Dataset", "Research", "Model Access"],
    painPoints: ["학습용 데이터셋 없음"],
    needs: ["익명화 데이터셋", "연구 협력"]
  },
  {
    id: 40,
    name: "MPS Omni-Brain (AI)",
    role: "AI (Artificial Intelligence)",
    group: "user",
    focusArea: ["Self-Reflection", "Learning", "Evolution"],
    painPoints: ["학습 데이터 불충분", "피드백 루프 느림"],
    needs: ["실시간 피드백", "자가 개선 로직"]
  }
];

// ============================================
// SIMULATION SCENARIOS
// ============================================

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  participants: number[];
  steps: string[];
  expectedFriction: string[];
}

export const scenarios: SimulationScenario[] = [
  {
    id: "S1",
    name: "Unboxing & First Use Chaos",
    description: "첫 사용자 온보딩 경험 테스트",
    participants: [27, 35, 36], // 초등학생, 60대, 70대
    steps: [
      "앱 다운로드",
      "회원가입",
      "디바이스 페어링",
      "첫 측정",
      "결과 확인"
    ],
    expectedFriction: [
      "70대 사용자가 페어링 코드를 읽을 수 없음",
      "초등학생이 의학 용어를 이해 못함",
      "60대가 버튼을 잘못 눌러 측정 취소"
    ]
  },
  {
    id: "S2",
    name: "Emergency Stress Test",
    description: "응급 상황 시 자동 감지 및 알림 테스트",
    participants: [33, 38, 20], // 40대 부장, AI CEO, 규제 전문가
    steps: [
      "부장이 회의 중 쓰러짐",
      "디바이스가 이상 징후 감지",
      "긴급 연락처(CEO)에게 알림",
      "원격 진료 연결"
    ],
    expectedFriction: [
      "HIPAA 위반 가능성 (데이터 공유)",
      "응급 알림 수신 거부 상태",
      "원격 진료 연결 지연"
    ]
  },
  {
    id: "S3",
    name: "Ecosystem Loop",
    description: "측정 → AI 추천 → 구매 → 피드백 루프",
    participants: [21, 31, 6, 15], // 트레이너, 20대 당뇨, MBA, 풀스택
    steps: [
      "측정 실행",
      "AI가 아연 부족 감지",
      "만파식 몰에서 제품 추천",
      "구매 완료",
      "배송 후 복용",
      "다음 측정에서 개선 확인"
    ],
    expectedFriction: [
      "추천 제품의 마진율 불투명 (MBA)",
      "결제 게이트웨이 오류 (풀스택)",
      "피드백 루프 데이터 미수집"
    ]
  },
  {
    id: "S4",
    name: "Hacker & Edge Case Attack",
    description: "보안 및 엣지 케이스 테스트",
    participants: [39, 14], // AI 학생, 펌웨어 엔지니어
    steps: [
      "AI 학생이 가짜 데이터 주입 시도",
      "해시 체인 검증 트리거",
      "펌웨어 엔지니어가 OTA 중 전원 차단"
    ],
    expectedFriction: [
      "해시 체인 우회 가능성",
      "OTA 실패 시 벽돌 현상"
    ]
  }
];

// ============================================
// FRICTION POINTS AGGREGATOR
// ============================================

export interface FrictionPoint {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'UX' | 'Security' | 'Performance' | 'Regulation' | 'Technical';
  reportedBy: number[]; // Persona IDs
  description: string;
  proposedSolution: string;
  effort: 'low' | 'medium' | 'high';
}

export const identifiedFrictions: FrictionPoint[] = [
  // CRITICAL
  {
    severity: 'critical',
    category: 'UX',
    reportedBy: [35, 36],
    description: "시니어 사용자(60대, 70대)가 작은 폰트와 버튼으로 인해 앱 사용 불가",
    proposedSolution: "음성 안내 기반 시니어 모드 + 대형 버튼 UI 구현",
    effort: 'medium'
  },
  {
    severity: 'critical',
    category: 'Security',
    reportedBy: [20, 14],
    description: "OTA 업데이트 실패 시 디바이스 복구 불가 (벽돌 현상)",
    proposedSolution: "Failsafe 부트로더 + A/B 파티션 구현",
    effort: 'high'
  },
  {
    severity: 'critical',
    category: 'Regulation',
    reportedBy: [20, 33],
    description: "응급 상황 시 데이터 공유가 HIPAA를 위반할 수 있음",
    proposedSolution: "사전 동의 기반 응급 연락처 시스템 + 법적 면책 조항",
    effort: 'medium'
  },
  {
    severity: 'critical',
    category: 'Technical',
    reportedBy: [12, 22],
    description: "운동 중 모션 아티팩트로 인한 신호 왜곡",
    proposedSolution: "가속도계 기반 Motion Artifact Cancellation 알고리즘",
    effort: 'high'
  },
  {
    severity: 'critical',
    category: 'Performance',
    reportedBy: [15, 25],
    description: "초기 로딩 시간 30초 이상, API 응답 지연",
    proposedSolution: "코드 스플리팅 + Redis 캐싱 + 스켈레톤 로딩",
    effort: 'medium'
  },
  // HIGH
  {
    severity: 'high',
    category: 'UX',
    reportedBy: [27],
    description: "초등학생이 의학 용어를 이해하지 못함",
    proposedSolution: "키즈 모드: 캐릭터 기반 설명 + 게이미피케이션",
    effort: 'medium'
  },
  {
    severity: 'high',
    category: 'UX',
    reportedBy: [28],
    description: "중학생 프라이버시: 부모가 모든 데이터 열람 가능",
    proposedSolution: "프라이버시 존 + 선택적 데이터 공유 설정",
    effort: 'low'
  },
  {
    severity: 'high',
    category: 'Technical',
    reportedBy: [38],
    description: "API 문서 없음, 외부 개발자 통합 불가",
    proposedSolution: "OpenAPI 3.0 스펙 + Developer Portal 구축",
    effort: 'medium'
  },
  {
    severity: 'high',
    category: 'UX',
    reportedBy: [26],
    description: "가족 구성원 전체 건강 관리 어려움",
    proposedSolution: "가족 계정 + 멀티 프로필 대시보드",
    effort: 'medium'
  },
  {
    severity: 'high',
    category: 'Technical',
    reportedBy: [9],
    description: "온도 변화에 따른 전극 노이즈 증가",
    proposedSolution: "실시간 온도 보정 알고리즘",
    effort: 'medium'
  }
];

// ============================================
// TOP 5 CRITICAL ISSUES
// ============================================

export const top5CriticalIssues = identifiedFrictions
  .filter(f => f.severity === 'critical')
  .slice(0, 5);

// ============================================
// 5 INNOVATIVE FEATURES (Expert + User Intersection)
// ============================================

export interface InnovativeFeature {
  name: string;
  description: string;
  expertValidation: { personaId: number; validation: string }[];
  userNeed: { personaId: number; need: string }[];
  implementation: string;
}

export const innovativeFeatures: InnovativeFeature[] = [
  {
    name: "음식 안전 카트리지 (Food Safety Cartridge)",
    description: "과일/채소의 잔류 농약을 가정에서 검사",
    expertValidation: [
      { personaId: 18, validation: "생화학자: 표면 잔류물 전기화학 검출 가능" }
    ],
    userNeed: [
      { personaId: 26, need: "주부: 아이들이 먹는 과일 안전 확인 필요" }
    ],
    implementation: "새 카트리지 SKU + 농약 검출 알고리즘"
  },
  {
    name: "스마트워치 통합 (Wearable Fusion)",
    description: "Apple Watch, Galaxy Watch와 연동하여 심박수/SpO2 데이터 통합",
    expertValidation: [
      { personaId: 8, validation: "공학 박사: HealthKit/Samsung Health API 통합 가능" }
    ],
    userNeed: [
      { personaId: 22, need: "축구 선수: 운동 중 실시간 모니터링" }
    ],
    implementation: "HealthKit/Samsung Health SDK 연동"
  },
  {
    name: "날씨-건강 상관 AI (Weather-Health Correlation)",
    description: "기압 변화, 미세먼지로 관절통/호흡기 증상 예측",
    expertValidation: [
      { personaId: 16, validation: "계산물리학자: 외부 API + 바이오마커 상관분석" }
    ],
    userNeed: [
      { personaId: 34, need: "50대 임원: 통풍 발작 예측 필요" }
    ],
    implementation: "OpenWeather API + Bayesian 예측 모델"
  },
  {
    name: "AI 음성 코치 (Voice-First AI Coach)",
    description: "시니어를 위한 완전 음성 기반 앱 네비게이션",
    expertValidation: [
      { personaId: 15, validation: "풀스택 개발자: Web Speech API + TTS 구현 가능" }
    ],
    userNeed: [
      { personaId: 36, need: "70대 은퇴자: 글씨 읽기 어려움, 음성 선호" }
    ],
    implementation: "Web Speech API + GPT TTS 통합"
  },
  {
    name: "익명화 연구 데이터셋 (Research Data Hub)",
    description: "학술 연구용 익명화된 바이오시그널 데이터셋 제공",
    expertValidation: [
      { personaId: 20, validation: "규제 전문가: GDPR 익명화 기준 충족 시 가능" }
    ],
    userNeed: [
      { personaId: 39, need: "AI 학생: 머신러닝 학습용 데이터 필요" }
    ],
    implementation: "k-익명화 파이프라인 + 연구 포털"
  }
];

console.log("✅ Persona Council Simulator Loaded");
console.log(`   - Expert Panel: ${expertPanel.length} personas`);
console.log(`   - User Panel: ${userPanel.length} personas`);
console.log(`   - Scenarios: ${scenarios.length}`);
console.log(`   - Critical Issues: ${top5CriticalIssues.length}`);






