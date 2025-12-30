/**
 * ============================================================
 * MANPASIK MATE - SCREEN INTERPRETER (강화 버전)
 * Context-Aware Screen Analysis & Voice Script Generation
 * 모든 화면에 대한 설명 및 기능 사용법 안내
 * ============================================================
 */

import type { EmotionalTone } from './voice-manager';

// Screen context types - 확장
export type ScreenType = 
  | 'dashboard'
  | 'result'
  | 'measurement'
  | 'store'
  | 'telemedicine'
  | 'settings'
  | 'school'
  | 'analyze'
  | 'profile'
  | 'me'
  | 'records'
  | 'analytics'
  | 'care'
  | 'world'
  | 'device'
  | 'wallet'
  | 'agora'
  | 'unknown';

export interface HealthMetrics {
  healthScore?: number;
  lactate?: number;
  heartRate?: number;
  bloodOxygen?: number;
  temperature?: number;
  glucose?: number;
  immunityScore?: number;
  sleepHours?: number;
  respiratoryRate?: number;
}

export interface ScreenContext {
  type: ScreenType;
  metrics?: HealthMetrics;
  alerts?: string[];
  schedules?: { time: string; title: string }[];
  cartridgeUsesLeft?: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  userName?: string;
  // 추가 컨텍스트
  currentTab?: string;
  measurementMode?: 'liquid' | 'gas' | 'solid' | 'non-target';
  deviceConnected?: boolean;
  pointsBalance?: number;
}

export interface VoiceScript {
  text: string;
  emotion: EmotionalTone;
  highlights?: { selector: string; message: string }[];
}

// Personality types
export type PersonalityType = 'sergeant' | 'caregiver' | 'analyst';

// ============================================
// 화면별 기능 사용법 정의
// ============================================
interface ScreenGuide {
  title: string;
  description: string;
  features: { name: string; howTo: string }[];
  tips?: string[];
}

const SCREEN_GUIDES: Record<ScreenType, ScreenGuide> = {
  dashboard: {
    title: '대시보드',
    description: '오늘의 건강 현황을 한눈에 확인하는 메인 화면입니다.',
    features: [
      { name: '건강 점수', howTo: '원형 점수 카드를 클릭하면 상세 분석을 볼 수 있어요.' },
      { name: 'AI 코치', howTo: '메시지를 입력하거나 빠른 질문 버튼을 탭해 대화하세요.' },
      { name: '바이오리듬 차트', howTo: '그래프를 좌우로 드래그하여 과거 기록을 확인하세요.' },
      { name: '바이탈 카드', howTo: '각 카드를 탭하면 해당 지표의 추세를 볼 수 있어요.' },
      { name: '빠른 실행', howTo: '자주 사용하는 기능에 빠르게 접근할 수 있어요.' },
      { name: '예정된 일정', howTo: '일정을 탭하면 상세 정보와 알림 설정이 가능해요.' },
    ],
    tips: [
      '매일 아침 대시보드를 확인하면 하루 건강 관리에 도움이 돼요.',
      '건강 점수가 70점 미만이면 AI 코치에게 조언을 구해보세요.',
    ],
  },
  
  analyze: {
    title: '분석 (The Lab)',
    description: '다양한 바이오마커를 측정하고 데이터를 분석하는 화면입니다.',
    features: [
      { name: '측정 모드 선택', howTo: '액체/기체/고체/비표적 중 측정 대상을 선택하세요.' },
      { name: '측정 시작', howTo: '카트리지를 삽입하고 "측정 시작" 버튼을 누르세요.' },
      { name: '측정 기록', howTo: '하단 탭에서 과거 측정 기록과 추세를 확인하세요.' },
      { name: '인사이트 보기', howTo: '측정 완료 후 AI가 생성한 분석 리포트를 확인하세요.' },
      { name: '88차원 Raw Data', howTo: '전문가 모드에서 CV/EIS/SWV 원시 데이터를 볼 수 있어요.' },
    ],
    tips: [
      '정확한 측정을 위해 측정 전 30분간 음식 섭취를 피하세요.',
      '카트리지는 사용 전 실온에 10분간 방치하면 정확도가 높아져요.',
    ],
  },

  result: {
    title: '측정 결과',
    description: '바이오마커 측정 결과와 AI 해석을 확인하는 화면입니다.',
    features: [
      { name: '결과 요약', howTo: '상단의 종합 점수와 주요 지표를 먼저 확인하세요.' },
      { name: '상세 분석', howTo: '각 지표를 탭하면 정상 범위와 비교를 볼 수 있어요.' },
      { name: 'AI 해석', howTo: '하단의 AI 코치 조언을 읽고 개선 방법을 확인하세요.' },
      { name: '레이더 차트', howTo: '88차원 데이터를 시각화한 레이더 차트를 확인하세요.' },
      { name: '전문가 상담', howTo: '"솔루션 받기" 버튼으로 전문가 상담을 예약할 수 있어요.' },
      { name: '결과 공유', howTo: '공유 버튼으로 결과를 PDF로 저장하거나 전송하세요.' },
    ],
    tips: [
      '결과가 정상 범위를 벗어나면 AI 코치가 자동으로 개선 방안을 제안해요.',
      '이전 결과와 비교하려면 "추세 보기" 탭을 활용하세요.',
    ],
  },

  measurement: {
    title: '측정 진행',
    description: '바이오마커 측정을 진행하는 화면입니다.',
    features: [
      { name: '실시간 파형', howTo: '측정 중 CV/EIS/SWV 파형이 실시간으로 표시돼요.' },
      { name: '진행 상태', howTo: '상단 프로그레스 바에서 측정 진행률을 확인하세요.' },
      { name: '중단하기', howTo: '측정 중 문제가 생기면 "중단" 버튼을 누르세요.' },
      { name: '품질 지표', howTo: 'SQI(신호 품질 지수)가 90% 이상이면 정확한 결과에요.' },
    ],
    tips: [
      '측정 중에는 리더기를 움직이지 마세요.',
      '약 30초~1분 정도 소요되니 잠시 기다려주세요.',
    ],
  },

  store: {
    title: '만파식 몰',
    description: '건강 제품과 서비스를 구매하는 쇼핑 화면입니다.',
    features: [
      { name: '바이오 호환성', howTo: '내 측정 데이터 기반 맞춤 추천 상품을 확인하세요.' },
      { name: '카테고리', howTo: '상단 탭에서 보충제, 장비, 서비스를 선택하세요.' },
      { name: '장바구니', howTo: '상품을 담고 우측 상단 장바구니 아이콘을 탭하세요.' },
      { name: 'MPS 포인트', howTo: '포인트로 결제하거나 할인 적용이 가능해요.' },
      { name: '리뷰 확인', howTo: '상품 카드를 탭해 다른 사용자 리뷰를 확인하세요.' },
    ],
    tips: [
      'AI가 추천하는 "나를 위한 상품"은 측정 데이터 기반이에요.',
      '정기 구독을 설정하면 10% 할인을 받을 수 있어요.',
    ],
  },

  telemedicine: {
    title: '원격 진료 / 상담',
    description: '전문가와 화상 상담 또는 채팅 상담을 진행하는 화면입니다.',
    features: [
      { name: '전문가 찾기', howTo: '전문 분야와 언어로 필터링하여 전문가를 찾으세요.' },
      { name: '예약하기', howTo: '원하는 전문가의 가능한 시간을 선택하여 예약하세요.' },
      { name: '화상 상담', howTo: '예약 시간에 "상담 시작" 버튼으로 화상 통화를 시작하세요.' },
      { name: '실시간 번역', howTo: '외국 전문가와도 AI 실시간 번역으로 소통 가능해요.' },
      { name: '처방전', howTo: '상담 후 처방전이 발급되면 약국으로 전송할 수 있어요.' },
      { name: '채팅 상담', howTo: '간단한 질문은 채팅으로 빠르게 상담받을 수 있어요.' },
    ],
    tips: [
      '최근 측정 결과를 상담 전에 공유하면 더 정확한 상담이 가능해요.',
      '첫 상담은 무료인 경우가 많으니 확인해보세요.',
    ],
  },

  settings: {
    title: '설정',
    description: '앱 환경설정과 계정 관리를 하는 화면입니다.',
    features: [
      { name: '알림 설정', howTo: '푸시 알림, 이메일 알림을 켜거나 끌 수 있어요.' },
      { name: '다크 모드', howTo: '어두운 테마로 전환하여 눈의 피로를 줄이세요.' },
      { name: '언어 변경', howTo: '한국어, 영어 등 원하는 언어를 선택하세요.' },
      { name: '보안 설정', howTo: '비밀번호 변경, 2단계 인증을 설정할 수 있어요.' },
      { name: '데이터 내보내기', howTo: '내 건강 데이터를 PDF나 CSV로 내보낼 수 있어요.' },
      { name: '도움말', howTo: '자주 묻는 질문과 사용 가이드를 확인하세요.' },
    ],
    tips: [
      '2단계 인증을 켜면 계정 보안이 강화돼요.',
      '주간 건강 리포트 이메일 알림을 켜두면 편리해요.',
    ],
  },

  school: {
    title: '만파식 스쿨',
    description: '건강 교육과 커뮤니티 활동을 하는 학습 화면입니다.',
    features: [
      { name: '튜토리얼', howTo: '초보자를 위한 단계별 사용 가이드를 따라하세요.' },
      { name: '건강 위키', howTo: '바이오마커와 건강 지식을 검색해보세요.' },
      { name: '비전 스토리', howTo: '만파식의 철학과 생태계 로드맵을 확인하세요.' },
      { name: '인증서', howTo: '학습을 완료하면 인증서와 포인트를 받을 수 있어요.' },
    ],
    tips: [
      '튜토리얼을 완료하면 MPS 포인트를 보상으로 받아요.',
      '매주 새로운 건강 콘텐츠가 업데이트돼요.',
    ],
  },

  profile: {
    title: '프로필',
    description: '내 정보와 건강 데이터 권한을 관리하는 화면입니다.',
    features: [
      { name: '프로필 수정', howTo: '프로필 사진과 기본 정보를 수정할 수 있어요.' },
      { name: '건강 정보', howTo: '키, 체중, 혈액형 등 기본 건강 정보를 입력하세요.' },
      { name: '데이터 권한', howTo: '앱이 접근할 수 있는 데이터 범위를 설정하세요.' },
      { name: '멤버십', howTo: '현재 멤버십 등급과 혜택을 확인하세요.' },
    ],
    tips: [
      '정확한 건강 정보를 입력하면 AI 분석 정확도가 높아져요.',
      'VIP 멤버십에 가입하면 전문가 상담이 무료예요.',
    ],
  },

  me: {
    title: '나의 공간 (Digital Twin)',
    description: '내 디지털 트윈과 자산을 관리하는 개인 화면입니다.',
    features: [
      { name: '건강 기록', howTo: '전체 건강 기록과 의료 이력을 확인하세요.' },
      { name: 'DNA 정보', howTo: '유전자 분석 결과와 연동하여 맞춤 분석을 받으세요.' },
      { name: '기기 관리', howTo: '연결된 리더기와 웨어러블 기기를 관리하세요.' },
      { name: '지갑', howTo: 'MPS 포인트, 쿠폰, 결제 수단을 관리하세요.' },
      { name: '선호 설정', howTo: 'AI 코치 성격, 목표, 관심사를 설정하세요.' },
    ],
    tips: [
      '디지털 트윈은 내 모든 건강 데이터의 중심이에요.',
      '기기 펌웨어 업데이트 알림을 확인해주세요.',
    ],
  },

  records: {
    title: '건강 기록',
    description: '모든 건강 검진 기록과 리포트를 보관하는 화면입니다.',
    features: [
      { name: '기록 목록', howTo: '날짜순으로 정렬된 기록을 스크롤하여 확인하세요.' },
      { name: '필터', howTo: '기간, 유형별로 기록을 필터링할 수 있어요.' },
      { name: '다운로드', howTo: '개별 또는 전체 기록을 PDF로 다운로드하세요.' },
      { name: '공유', howTo: '의사나 전문가에게 기록을 안전하게 공유하세요.' },
    ],
    tips: [
      '정기 검진 기록을 업로드하면 통합 분석이 가능해요.',
      '외부 기관 기록도 업로드할 수 있어요.',
    ],
  },

  analytics: {
    title: '데이터 분석',
    description: '수집된 건강 데이터를 심층 분석하는 화면입니다.',
    features: [
      { name: '요약 카드', howTo: '심장, 정신, 활동량, 에너지 점수를 한눈에 확인하세요.' },
      { name: '추이 차트', howTo: '주간/월간 활동 추이를 그래프로 확인하세요.' },
      { name: '수면 분석', howTo: '수면 패턴과 질을 분석한 차트를 확인하세요.' },
      { name: '인사이트', howTo: 'AI가 생성한 건강 인사이트를 확인하세요.' },
    ],
    tips: [
      '데이터가 많을수록 AI 분석 정확도가 높아져요.',
      '이상 패턴이 감지되면 알림을 받을 수 있어요.',
    ],
  },

  care: {
    title: '케어 서비스',
    description: '의료 서비스와 건강 제품을 통합 제공하는 화면입니다.',
    features: [
      { name: '전문가 매칭', howTo: '내 상태에 맞는 전문가를 AI가 추천해줘요.' },
      { name: '쇼핑', howTo: '건강 제품을 검색하고 구매하세요.' },
      { name: '약국 연동', howTo: '전자처방전을 가까운 약국으로 전송하세요.' },
    ],
    tips: [
      '측정 결과가 나쁘면 자동으로 전문가 상담을 제안해요.',
    ],
  },

  world: {
    title: '월드 (커뮤니티)',
    description: '교육과 커뮤니티 활동을 하는 공간입니다.',
    features: [
      { name: '스쿨', howTo: '튜토리얼과 건강 교육 콘텐츠를 학습하세요.' },
      { name: '아고라', howTo: '아이디어를 제출하고 투표에 참여하세요.' },
      { name: '스토리', howTo: '다른 사용자들의 성공 사례를 확인하세요.' },
    ],
    tips: [
      '아고라에서 채택된 아이디어는 실제로 반영돼요!',
    ],
  },

  device: {
    title: '기기 관리',
    description: '연결된 측정 기기와 웨어러블을 관리하는 화면입니다.',
    features: [
      { name: '기기 연결', howTo: 'Bluetooth를 켜고 "기기 추가"를 탭하세요.' },
      { name: '펌웨어 업데이트', howTo: '새 버전이 있으면 업데이트 버튼이 표시돼요.' },
      { name: '배터리', howTo: '연결된 기기의 배터리 상태를 확인하세요.' },
      { name: '교정', howTo: '정확도를 위해 정기적으로 교정을 실행하세요.' },
    ],
    tips: [
      '펌웨어는 항상 최신 버전으로 유지하세요.',
      '연결이 불안정하면 기기를 재시작해보세요.',
    ],
  },

  wallet: {
    title: '지갑',
    description: 'MPS 포인트와 결제 수단을 관리하는 화면입니다.',
    features: [
      { name: '포인트 잔액', howTo: '현재 보유한 MPS 포인트를 확인하세요.' },
      { name: '포인트 적립 내역', howTo: '어떻게 포인트를 얻었는지 확인하세요.' },
      { name: '쿠폰', howTo: '사용 가능한 쿠폰과 유효기간을 확인하세요.' },
      { name: '결제 수단', howTo: '카드를 등록하거나 관리할 수 있어요.' },
    ],
    tips: [
      '매일 접속하면 출석 포인트를 받을 수 있어요.',
      '친구 초대로 보너스 포인트를 획득하세요.',
    ],
  },

  agora: {
    title: '아고라',
    description: '아이디어를 제안하고 투표하는 커뮤니티 공간입니다.',
    features: [
      { name: '아이디어 제출', howTo: '"새 아이디어" 버튼으로 기능을 제안하세요.' },
      { name: '투표하기', howTo: '마음에 드는 아이디어에 투표하세요.' },
      { name: '댓글', howTo: '아이디어에 의견을 남겨 토론에 참여하세요.' },
      { name: '펀딩', howTo: 'MPS 포인트로 아이디어 개발에 참여할 수 있어요.' },
    ],
    tips: [
      '채택된 아이디어 제안자는 보상을 받아요.',
      'AI가 아이디어의 구현 가능성을 분석해줘요.',
    ],
  },

  unknown: {
    title: '현재 화면',
    description: '만파식 앱의 화면입니다.',
    features: [
      { name: '도움말', howTo: '궁금한 점은 AI 코치에게 물어보세요.' },
    ],
    tips: [
      '화면 하단의 네비게이션 바로 다른 기능에 접근할 수 있어요.',
    ],
  },
};

// ============================================
// SCREEN INTERPRETER CLASS (강화 버전)
// ============================================

class ScreenInterpreterClass {
  private personality: PersonalityType = 'caregiver';
  private userName: string = '사용자';

  setPersonality(type: PersonalityType) {
    this.personality = type;
  }

  setUserName(name: string) {
    this.userName = name;
  }

  /**
   * Detect the current screen type from URL or page data
   */
  detectScreenType(pathname: string): ScreenType {
    if (pathname === '/' || pathname === '/dashboard') return 'dashboard';
    if (pathname.includes('/result')) return 'result';
    if (pathname.includes('/measure')) return 'measurement';
    if (pathname.includes('/store') || pathname.includes('/mall')) return 'store';
    if (pathname.includes('/telemedicine') || pathname.includes('/consult')) return 'telemedicine';
    if (pathname.includes('/settings')) return 'settings';
    if (pathname.includes('/school')) return 'school';
    if (pathname.includes('/analyze')) return 'analyze';
    if (pathname.includes('/profile')) return 'profile';
    if (pathname.includes('/me')) return 'me';
    if (pathname.includes('/records')) return 'records';
    if (pathname.includes('/analytics')) return 'analytics';
    if (pathname.includes('/care')) return 'care';
    if (pathname.includes('/world')) return 'world';
    if (pathname.includes('/device')) return 'device';
    if (pathname.includes('/wallet')) return 'wallet';
    if (pathname.includes('/agora')) return 'agora';
    if (pathname.includes('/v0-dashboard')) return 'dashboard';
    return 'unknown';
  }

  /**
   * Get time of day greeting
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Generate greeting based on time and personality
   */
  private getGreeting(): string {
    const timeOfDay = this.getTimeOfDay();
    const greetings: Record<PersonalityType, Record<string, string>> = {
      sergeant: {
        morning: `좋은 아침이야, ${this.userName}! 일어났으면 바로 스트레칭!`,
        afternoon: `${this.userName}, 오후 루틴 체크하자!`,
        evening: `저녁이다, ${this.userName}. 오늘 운동은 했어?`,
        night: `밤이 깊었어, ${this.userName}. 빨리 자야지!`,
      },
      caregiver: {
        morning: `좋은 아침이에요, ${this.userName}님 🌅 잘 주무셨나요?`,
        afternoon: `${this.userName}님, 점심 맛있게 드셨나요? ☀️`,
        evening: `${this.userName}님, 오늘 하루도 수고하셨어요 🌆`,
        night: `${this.userName}님, 좀 쉬셔야 할 것 같아요 🌙`,
      },
      analyst: {
        morning: `모닝 브리핑입니다, ${this.userName}님.`,
        afternoon: `오후 상태 분석을 시작합니다.`,
        evening: `일일 종합 리포트 준비 중입니다.`,
        night: `야간 건강 모니터링 모드입니다.`,
      },
    };
    return greetings[this.personality][timeOfDay];
  }

  /**
   * Generate Morning Briefing Script
   */
  generateMorningBriefing(context: ScreenContext): VoiceScript {
    const { metrics, schedules } = context;
    const lines: string[] = [];
    let emotion: EmotionalTone = 'neutral';

    // Greeting
    lines.push(this.getGreeting());

    // Sleep analysis
    if (metrics?.sleepHours !== undefined) {
      if (metrics.sleepHours < 6) {
        lines.push(this.personality === 'sergeant' 
          ? `어젯밤 ${metrics.sleepHours}시간밖에 못 잤네? 그러면 안 돼!`
          : `어젯밤 ${metrics.sleepHours}시간 주무셨네요. 조금 부족해요.`);
        emotion = 'concerned';
      } else if (metrics.sleepHours >= 7) {
        lines.push(`${metrics.sleepHours}시간 푹 주무셨네요! 좋아요!`);
        emotion = 'happy';
      }
    }

    // Immunity score
    if (metrics?.immunityScore !== undefined) {
      lines.push(`오늘의 면역력 점수는 ${metrics.immunityScore}점이에요.`);
      if (metrics.immunityScore < 70) {
        lines.push(this.personality === 'caregiver'
          ? '오늘은 좀 쉬시는 게 좋겠어요.'
          : '주의가 필요한 수준입니다.');
        emotion = 'concerned';
      }
    }

    // Schedule
    if (schedules && schedules.length > 0) {
      const nextSchedule = schedules[0];
      lines.push(`오늘 일정: ${nextSchedule.time}에 ${nextSchedule.title}이 있어요.`);
    }

    // Mission
    const missions = [
      '지금 바로 물 한 잔 마셔주세요! 기다릴게요.',
      '창문 열고 심호흡 한 번 해볼까요?',
      '어깨 스트레칭 10초만 해보세요!',
    ];
    lines.push(missions[Math.floor(Math.random() * missions.length)]);

    return {
      text: lines.join(' '),
      emotion,
    };
  }

  /**
   * Generate "Explain This Screen" Script (강화 버전)
   * 화면 설명 + 기능 사용법 통합 제공
   */
  generateScreenExplanation(context: ScreenContext): VoiceScript {
    const { type, metrics } = context;
    const guide = SCREEN_GUIDES[type] || SCREEN_GUIDES.unknown;
    
    let emotion: EmotionalTone = 'neutral';
    const highlights: VoiceScript['highlights'] = [];
    const parts: string[] = [];

    // 1. 화면 소개
    if (this.personality === 'caregiver') {
      parts.push(`지금 보시는 화면은 "${guide.title}" 입니다.`);
      parts.push(guide.description);
    } else if (this.personality === 'analyst') {
      parts.push(`${guide.title} 페이지 분석을 시작합니다.`);
      parts.push(guide.description);
    } else {
      parts.push(`여기는 ${guide.title}이야!`);
      parts.push(guide.description);
    }

    // 2. 특정 화면별 상태 기반 설명
    switch (type) {
      case 'dashboard':
        if (metrics?.healthScore !== undefined) {
          if (metrics.healthScore >= 80) {
            parts.push(`건강 점수가 ${metrics.healthScore}점으로 매우 좋아요!`);
            emotion = 'happy';
          } else if (metrics.healthScore >= 60) {
            parts.push(`건강 점수는 ${metrics.healthScore}점이에요. 양호한 편이지만 개선 여지가 있어요.`);
          } else {
            parts.push(`건강 점수가 ${metrics.healthScore}점으로 주의가 필요해요. AI 코치에게 조언을 받아보세요.`);
            emotion = 'concerned';
          }
        }
        if (metrics?.heartRate) {
          parts.push(`현재 심박수는 ${metrics.heartRate} BPM이에요.`);
        }
        break;

      case 'result':
        const result = this.explainResultPage(metrics);
        parts.push(result.text);
        emotion = result.emotion;
        highlights.push(...result.highlights);
        break;

      case 'analyze':
        if (context.measurementMode) {
          parts.push(`현재 ${context.measurementMode === 'liquid' ? '액체' : 
            context.measurementMode === 'gas' ? '기체' : 
            context.measurementMode === 'solid' ? '고체' : '비표적'} 측정 모드가 선택되어 있어요.`);
        }
        if (context.deviceConnected === false) {
          parts.push('측정 기기가 연결되어 있지 않아요. 먼저 기기를 연결해주세요.');
          emotion = 'concerned';
        }
        break;

      case 'store':
        if (context.pointsBalance !== undefined) {
          parts.push(`현재 ${context.pointsBalance.toLocaleString()} MPS 포인트가 있어요.`);
        }
        break;
    }

    // 3. 주요 기능 사용법 안내 (2-3개만 선택)
    const keyFeatures = guide.features.slice(0, 3);
    parts.push('주요 기능을 알려드릴게요.');
    keyFeatures.forEach(f => {
      parts.push(`${f.name}: ${f.howTo}`);
    });

    // 4. 유용한 팁 추가 (있을 경우)
    if (guide.tips && guide.tips.length > 0) {
      const tip = guide.tips[Math.floor(Math.random() * guide.tips.length)];
      parts.push(`팁: ${tip}`);
    }

    // 5. 추가 도움 안내
    parts.push('더 궁금한 점이 있으면 언제든 물어보세요!');

    return { 
      text: parts.join(' '), 
      emotion, 
      highlights 
    };
  }

  /**
   * 간단한 화면 요약만 제공 (빠른 설명)
   */
  generateQuickExplanation(pathname: string): VoiceScript {
    const type = this.detectScreenType(pathname);
    const guide = SCREEN_GUIDES[type] || SCREEN_GUIDES.unknown;

    return {
      text: `${guide.title} 화면이에요. ${guide.description}`,
      emotion: 'neutral',
    };
  }

  /**
   * 특정 기능 사용법 상세 안내
   */
  explainFeature(screenType: ScreenType, featureName: string): VoiceScript {
    const guide = SCREEN_GUIDES[screenType] || SCREEN_GUIDES.unknown;
    const feature = guide.features.find(f => f.name.includes(featureName));

    if (feature) {
      return {
        text: `"${feature.name}" 기능 사용법이에요. ${feature.howTo}`,
        emotion: 'neutral',
      };
    }

    return {
      text: `해당 기능에 대한 설명을 찾을 수 없어요. 다른 질문을 해주세요.`,
      emotion: 'neutral',
    };
  }

  /**
   * 화면의 모든 기능 목록 안내
   */
  listAllFeatures(screenType: ScreenType): VoiceScript {
    const guide = SCREEN_GUIDES[screenType] || SCREEN_GUIDES.unknown;
    const featureNames = guide.features.map(f => f.name).join(', ');

    return {
      text: `이 화면에서 사용할 수 있는 기능들이에요: ${featureNames}. 자세히 알고 싶은 기능이 있으면 말씀해주세요.`,
      emotion: 'neutral',
    };
  }

  private explainResultPage(metrics?: HealthMetrics): { 
    text: string; 
    emotion: EmotionalTone;
    highlights: { selector: string; message: string }[];
  } {
    const highlights: { selector: string; message: string }[] = [];
    const parts: string[] = [];
    let emotion: EmotionalTone = 'neutral';

    if (this.personality === 'caregiver') {
      parts.push('측정 결과를 살펴볼게요.');
    } else if (this.personality === 'analyst') {
      parts.push('88차원 바이오마커 분석 결과입니다.');
    } else {
      parts.push('결과 확인하자!');
    }

    // Lactate analysis
    if (metrics?.lactate !== undefined) {
      if (metrics.lactate > 4.0) {
        parts.push(`젖산 수치가 ${metrics.lactate.toFixed(1)} mmol/L로 높아요.`);
        parts.push(this.personality === 'caregiver'
          ? '어제 운동을 많이 하셨나 봐요. 오늘은 쉬어가세요.'
          : '근육 피로가 누적되었습니다. 회복이 필요합니다.');
        emotion = 'concerned';
        highlights.push({
          selector: '[data-metric="lactate"]',
          message: '젖산 수치 높음'
        });
      } else if (metrics.lactate < 1.0) {
        parts.push(`젖산 수치가 ${metrics.lactate.toFixed(1)} mmol/L로 매우 양호해요!`);
        emotion = 'happy';
      } else {
        parts.push(`젖산 수치는 ${metrics.lactate.toFixed(1)} mmol/L로 정상 범위예요.`);
      }
    }

    // Glucose analysis
    if (metrics?.glucose !== undefined) {
      if (metrics.glucose > 140) {
        parts.push(`혈당이 ${metrics.glucose}mg/dL로 높은 편이에요.`);
        parts.push('다음 식사에서는 탄수화물을 조금 줄여보세요.');
        emotion = 'concerned';
        highlights.push({
          selector: '[data-metric="glucose"]',
          message: '혈당 주의'
        });
      }
    }

    // Heart rate
    if (metrics?.heartRate) {
      const status = metrics.heartRate >= 60 && metrics.heartRate <= 100 ? '정상' : '주의 필요';
      parts.push(`심박수는 ${metrics.heartRate} BPM으로 ${status} 범위에요.`);
    }

    // Blood oxygen
    if (metrics?.bloodOxygen) {
      if (metrics.bloodOxygen < 95) {
        parts.push(`혈중 산소 포화도가 ${metrics.bloodOxygen}%로 낮아요. 심호흡을 해보세요.`);
        emotion = 'concerned';
      } else {
        parts.push(`혈중 산소 포화도는 ${metrics.bloodOxygen}%로 정상이에요.`);
      }
    }

    // Summary
    if (emotion === 'happy') {
      parts.push(this.personality === 'sergeant' 
        ? '잘하고 있어! 이 상태 유지해!'
        : '전반적으로 좋은 상태예요! 계속 이렇게 관리해주세요.');
    } else if (emotion === 'concerned') {
      parts.push(this.personality === 'caregiver'
        ? '걱정하지 마세요. 제가 도와드릴게요.'
        : '개선 방안을 안내해드리겠습니다.');
    }

    return { text: parts.join(' '), emotion, highlights };
  }

  /**
   * Generate Lunchtime Interceptor Script
   */
  generateLunchtimeAdvice(morningGlucose: number): VoiceScript {
    let text = '';
    let emotion: EmotionalTone = 'calm';

    if (morningGlucose > 120) {
      if (this.personality === 'sergeant') {
        text = `야! 점심 먹으러 가기 전에! 아침 혈당이 ${morningGlucose}이었잖아. 파스타는 꿈도 꾸지 마. 샐러드나 포케볼 어때? 근처에 좋은 데 찾아뒀어.`;
        emotion = 'stern';
      } else if (this.personality === 'caregiver') {
        text = `점심 시간이네요! 아침 혈당이 조금 높았어요. 오늘은 가벼운 메뉴 어떨까요? 근처에 맛있는 샐러드 가게가 있더라고요.`;
        emotion = 'calm';
      } else {
        text = `점심 식사 전 알림입니다. 아침 혈당 ${morningGlucose}mg/dL 기록됨. 저GI 식단 권장. 반경 300m 내 추천 식당 3곳을 표시합니다.`;
        emotion = 'neutral';
      }
    } else {
      text = this.personality === 'caregiver'
        ? '점심 맛있게 드세요! 오늘은 혈당도 괜찮으니 원하시는 거 드셔도 돼요.'
        : '점심 식사 시간입니다. 오늘의 식단 제한 사항은 없습니다.';
      emotion = 'happy';
    }

    return { text, emotion };
  }

  /**
   * Generate Cartridge Manager Script
   */
  generateCartridgeAlert(usesLeft: number, pointsBalance: number): VoiceScript {
    let text = '';
    let emotion: EmotionalTone = 'neutral';

    if (usesLeft <= 3) {
      if (this.personality === 'sergeant') {
        text = `카트리지 ${usesLeft}회 남았어! 교체 안 하면 다음 주 측정 못 해. 지금 바로 주문할까? 포인트 ${pointsBalance}점 있잖아.`;
        emotion = 'stern';
      } else if (this.personality === 'caregiver') {
        text = `센서 카트리지가 거의 다 됐어요. ${usesLeft}회 정도 남았네요. 새 카트리지를 주문해드릴까요? ${pointsBalance} 포인트로 구매 가능해요.`;
        emotion = 'concerned';
      } else {
        text = `카트리지 잔여 사용 횟수: ${usesLeft}회. 현재 포인트 잔액: ${pointsBalance}. 자동 주문을 권장합니다.`;
        emotion = 'neutral';
      }
    }

    return { text, emotion };
  }

  /**
   * 화면 가이드 객체 가져오기 (외부에서 접근용)
   */
  getScreenGuide(screenType: ScreenType): ScreenGuide {
    return SCREEN_GUIDES[screenType] || SCREEN_GUIDES.unknown;
  }
}

export const ScreenInterpreter = new ScreenInterpreterClass();
