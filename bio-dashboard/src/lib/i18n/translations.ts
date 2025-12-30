/**
 * Global Localization (I18n) System
 * 
 * Supported Languages: Korean, English, Japanese, Chinese, Spanish
 */

export type Locale = "ko" | "en" | "ja" | "zh" | "es";

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" }
];

export type TranslationKey = keyof typeof translations.ko;

export const translations = {
  ko: {
    // App
    "app.title": "만파식 헬스",
    "app.subtitle": "바이오 분석 AI 시스템",
    "app.secure": "보안",
    
    // Navigation - 5 Pillar System
    "nav.home": "홈",
    "nav.analyze": "분석",
    "nav.care": "케어",
    "nav.world": "월드",
    "nav.me": "나",
    "nav.analysis": "분석",
    "nav.consultation": "진료",
    "nav.coach": "코치",
    
    // 5 Pillar Descriptions
    "nav.home.desc": "오늘의 건강 리듬",
    "nav.analyze.desc": "측정 및 데이터",
    "nav.care.desc": "진료 및 쇼핑",
    "nav.world.desc": "교육 및 커뮤니티",
    "nav.me.desc": "프로필 및 설정",
    
    // Quick Actions
    "quick.measure": "빠른 측정",
    "quick.mate": "메이트와 대화",
    "quick.foodLens": "푸드 렌즈",
    "quick.emergency": "긴급 SOS",
    
    // Home (Dashboard)
    "home.greeting.morning": "좋은 아침이에요",
    "home.greeting.afternoon": "좋은 오후예요",
    "home.greeting.evening": "좋은 저녁이에요",
    "home.healthScore": "건강 점수",
    "home.excellent": "우수",
    "home.good": "양호",
    "home.attention": "주의",
    "home.todoTitle": "오늘의 할 일",
    "home.completed": "완료",
    "home.quickAction": "빠른 실행",
    "home.notifications": "알림",
    
    // Analyze (The Lab)
    "analyze.title": "분석 랩",
    "analyze.subtitle": "The Lab - 측정 및 데이터 분석",
    "analyze.quickMeasure": "빠른 측정",
    "analyze.lastMeasure": "마지막 측정",
    "analyze.selectMode": "측정 모드 선택",
    "analyze.liquid": "액체 분석",
    "analyze.liquidDesc": "혈액, 땀, 침 등 체액 바이오마커 측정",
    "analyze.gas": "가스 분석",
    "analyze.gasDesc": "호기 분석을 통한 대사 상태 확인",
    "analyze.solid": "고체 분석",
    "analyze.solidDesc": "음식물, 환경 샘플 분석",
    "analyze.nontarget": "비표적 분석",
    "analyze.nontargetDesc": "AI 기반 미지 물질 탐지",
    "analyze.recentMeasure": "최근 측정",
    "analyze.viewAll": "전체 보기",
    "analyze.weeklyTrend": "주간 트렌드",
    "analyze.history": "히스토리",
    "analyze.start": "시작하기",
    
    // Care (Hospital & Mall)
    "care.title": "케어 센터",
    "care.subtitle": "Hospital & Mall - 진료 및 건강식품",
    "care.experts": "전문가",
    "care.mall": "건강몰",
    "care.pharmacy": "처방전",
    "care.globalConnect": "Global Connect",
    "care.globalConnectDesc": "실시간 AI 번역으로 전 세계 전문가와 상담",
    "care.aiRecommend": "AI 맞춤 추천",
    "care.aiRecommendDesc": "당신의 88차원 바이오시그널 기반 추천",
    "care.bookNow": "예약하기",
    "care.available": "예약 가능",
    "care.unavailable": "예약 마감",
    "care.allProducts": "전체 상품 보기",
    "care.noPrescription": "아직 처방전이 없습니다",
    "care.noPrescriptionDesc": "원격 진료 후 처방전을 받으실 수 있습니다",
    "care.ePrescription": "E-처방전 관리",
    
    // World (Campus)
    "world.title": "만파식 월드",
    "world.subtitle": "The Campus - 교육 및 커뮤니티",
    "world.school": "학교",
    "world.agora": "아고라",
    "world.stories": "스토리",
    "world.learningPoints": "학습 포인트",
    "world.usePoints": "포인트 사용",
    "world.recommendedCourses": "추천 강의",
    "world.completed": "완료",
    "world.inProgress": "진행 중",
    "world.submitIdea": "아이디어 제안하기",
    "world.popularIdeas": "인기 아이디어",
    "world.voting": "투표 중",
    "world.funded": "펀딩 완료",
    "world.implemented": "구현됨",
    "world.successStories": "사용자 성공 스토리",
    "world.shareStory": "내 스토리 공유하기",
    
    // Me (Digital Twin)
    "me.title": "프로필",
    "me.wallet": "MPS 월렛",
    "me.points": "포인트",
    "me.coupons": "쿠폰",
    "me.chargePoints": "포인트 충전 / 쿠폰 등록",
    "me.digitalTwin": "디지털 트윈",
    "me.medicalRecords": "의료 기록",
    "me.medicalRecordsDesc": "진단 및 처방 이력",
    "me.dnaProfile": "DNA 프로필",
    "me.dnaProfileDesc": "유전자 분석 결과",
    "me.healthGoals": "건강 목표",
    "me.healthGoalsDesc": "체중 감량, 근육 증가 등",
    "me.connectedDevices": "연결된 기기",
    "me.addDevice": "기기 추가",
    "me.connected": "연결됨",
    "me.disconnected": "연결 끊김",
    "me.settings": "설정",
    "me.notifications": "알림 설정",
    "me.privacy": "개인정보 및 보안",
    "me.appSettings": "앱 설정",
    "me.help": "도움말 및 지원",
    "me.logout": "로그아웃",
    
    // AI Mate
    "mate.title": "만파식 메이트",
    "mate.morningBriefing": "모닝 브리핑",
    "mate.explainScreen": "화면 설명",
    "mate.dismiss": "닫기",
    
    // Common
    "common.today": "오늘",
    "common.yesterday": "어제",
    "common.now": "지금",
    "common.save": "저장",
    "common.cancel": "취소",
    "common.confirm": "확인",
    "common.close": "닫기",
    "common.loading": "로딩 중...",
    "common.error": "오류",
    "common.success": "성공",
    "common.normal": "정상",
    "common.warning": "주의",
    "common.alert": "경고",
    
    // Daily Vitals
    "vitals.title": "일일 건강 지표",
    "vitals.subtitle": "오늘의 건강 상태",
    "vitals.deepAnalysis": "심층 분석",
    "vitals.lactate": "젖산 농도",
    "vitals.heartRate": "심박수",
    "vitals.trend": "7일 추세",
    "vitals.normalRange": "정상 범위",
    "vitals.excellent": "우수",
    "vitals.good": "양호",
    "vitals.fair": "보통",
    "vitals.attention": "주의",
    
    // AI Coach
    "coach.title": "AI 헬스 코치",
    "coach.askQuestion": "AI 코치에게 질문하기",
    "coach.placeholder": "건강에 관한 질문을 입력하세요...",
    "coach.send": "전송",
    "coach.greeting.morning": "좋은 아침이에요",
    "coach.greeting.afternoon": "좋은 오후에요",
    "coach.greeting.evening": "좋은 저녁이에요",
    "coach.greeting.night": "새벽이에요",
    "coach.personality.gentle": "부드러운",
    "coach.personality.balanced": "균형잡힌",
    "coach.personality.serious": "진지한",
    
    // AI Responses
    "ai.stableStatus": "안정적인 상태입니다. 규칙적인 측정을 유지하세요.",
    "ai.lowScore": "건강 점수가 낮습니다. 의사 상담을 권장합니다.",
    "ai.moderateScore": "오늘은 무리하지 말고 충분히 휴식하세요.",
    "ai.highScore": "컨디션이 매우 좋습니다! 오늘도 좋은 하루 되세요.",
    "ai.highLactate": "젖산 수치가 높습니다. 가벼운 스트레칭을 추천합니다.",
    "ai.appointmentReminder": "오늘 {count}건의 진료 예약이 있습니다.",
    
    // Care Services
    "services.title": "케어 서비스",
    "services.subtitle": "헬스케어 서비스",
    "services.analyzeSmell": "냄새/맛 분석",
    "services.analyzeSubtitle": "전자 코/혀 분석",
    "services.bookDoctor": "의사 상담 예약",
    "services.bookSubtitle": "원격 진료 예약",
    "services.prescriptions": "내 처방전",
    "services.prescriptionSubtitle": "전자처방전 & 약국",
    "services.lowHealthWarning": "건강 점수가 낮습니다",
    
    // Analysis
    "analysis.title": "12채널 센서 분석",
    "analysis.clickHint": "차트 포인트를 클릭하면 AI 해석을 볼 수 있습니다",
    "analysis.noData": "분석 데이터가 없습니다. 센서 어레이를 실행해주세요.",
    "analysis.patternResult": "패턴 매칭 결과",
    "analysis.topMatch": "상위 매칭",
    "analysis.similarity": "유사도",
    "analysis.normal": "정상",
    "analysis.warning": "주의",
    "analysis.alert": "경고",
    
    // Telemedicine
    "telemedicine.title": "원격 진료 예약",
    "telemedicine.subtitle": "Telemedicine Booking System",
    "telemedicine.bookTab": "예약하기",
    "telemedicine.myAppointments": "내 예약",
    "telemedicine.selectRegion": "지역 선택",
    "telemedicine.selectSpecialty": "진료과 선택",
    "telemedicine.allRegions": "전체 지역",
    "telemedicine.allSpecialties": "전체 진료과",
    "telemedicine.searchResults": "검색 결과: {count}개 병원",
    "telemedicine.startConsultation": "화상 진료 시작",
    "telemedicine.backToDashboard": "대시보드로 돌아가기",
    
    // Prescription
    "prescription.title": "전자 처방전",
    "prescription.selectPharmacy": "약국 선택",
    "prescription.sendPrescription": "처방전 전송",
    "prescription.pickupCode": "수령 코드",
    "prescription.noPrescriptions": "처방전이 없습니다",
    "prescription.noPrescriptionsDesc": "의사 상담 후 처방전이 여기에 표시됩니다",
    
    // Diagnosis Modal
    "diagnosis.title": "AI 건강 분석 결과",
    "diagnosis.abnormalDetected": "비정상 패턴 감지",
    "diagnosis.recommendation": "권장 사항",
    "diagnosis.bookNow": "지금 예약하기",
    "diagnosis.dietChange": "식단 조절을 권장합니다",
    "diagnosis.restRecommended": "충분한 휴식이 필요합니다",
    "diagnosis.consultDoctor": "전문의 상담을 권장합니다",
    "diagnosis.close": "닫기",
    
    // System
    "system.status": "시스템",
    "system.checking": "확인 중...",
    "system.normal": "정상",
    "system.warning": "주의",
    "system.error": "오류",
    
    // Sensor Array - Electronic Nose/Tongue
    "sensor.title": "전자 코/혀 분석",
    "sensor.subtitle": "교차 반응 센서 어레이",
    "sensor.vector": "차원 벡터",
    "sensor.runAnalysis": "분석 실행",
    "sensor.analyzing": "분석 중...",
    "sensor.reset": "초기화",
    "sensor.radarChart": "레이더 차트",
    "sensor.patternMatching": "패턴 매칭",
    "sensor.selectPattern": "패턴을 선택하고 분석을 실행해주세요",
    "sensor.channelSimulation": "16채널 센서 어레이 시뮬레이션",
    "sensor.noResults": "분석 결과가 없습니다",
    "sensor.mainReaction": "주요 반응",
    "sensor.recommendations": "권장 사항",
    "sensor.arrayAnalyzing": "센서 어레이 분석 중...",
    
    // Pattern Types
    "pattern.random": "무작위",
    "pattern.randomDesc": "무작위 패턴",
    "pattern.healthy": "건강",
    "pattern.healthyDesc": "정상 호흡",
    "pattern.kidney": "신장",
    "pattern.kidneyDesc": "신장 질환 패턴",
    "pattern.diabetes": "당뇨",
    "pattern.diabetesDesc": "당뇨 패턴",
    "pattern.spoiled": "부패",
    "pattern.spoiledDesc": "부패 식품",
    
    // Daily Vitals
    "vitals.deepAnalysis": "심층 분석",
    "vitals.justNow": "방금 전",
    "vitals.minutesAgo": "분 전",
    "vitals.hoursAgo": "시간 전",
    "vitals.lactateLevel": "젖산 농도",
    "vitals.heartRateLabel": "심박수",
    "vitals.dayTrend": "7일 추세",
    
    // AI Coach Status
    "coach.active": "활성화",
    "coach.inactive": "비활성화",
    "coach.thinking": "생각 중",
    
    // Health Status
    "health.excellent": "우수",
    "health.good": "양호",
    "health.fair": "보통",
    "health.attention": "주의",
    "health.warning": "경고",
    "health.normal": "정상",
    "health.abnormal": "이상",
    
    // Predictive Health Widget
    "predict.title": "예측 건강 엔진",
    "predict.aiPowered": "AI 기반",
    "predict.immunityForecast": "면역력 예보",
    "predict.chronicDisease": "만성질환",
    "predict.simulator": "시뮬레이터",
    "predict.safe": "안전",
    "predict.danger": "위험",
    "predict.confidence": "신뢰도",
    "predict.analysisFactors": "분석 요인",
    "predict.temperature": "체온",
    "predict.fatigue": "피로도",
    "predict.sleepQuality": "수면 품질",
    "predict.localFlu": "지역 독감 현황",
    
    // Cartridge
    "cartridge.title": "카트리지 건강",
    "cartridge.insertScan": "카트리지를 삽입/스캔하여 수명 예측을 확인하세요",
    "cartridge.noActive": "활성 카트리지 없음",
    "cartridge.remaining": "잔여 수명",
    "cartridge.uses": "사용 횟수",
    "cartridge.expiry": "만료일",
    
    // Hardware Topology
    "hardware.title": "하드웨어 상태",
    "hardware.waiting": "대기",
    "hardware.connected": "연결됨",
    "hardware.disconnected": "연결 끊김",
    "hardware.uncalibrated": "미보정",
    "hardware.calibrated": "보정됨",
    
    // Weather Health
    "weather.title": "날씨-건강 AI",
    "weather.realtime": "실시간",
    "weather.fineDust": "미세먼지",
    "weather.healthImpact": "건강 영향 예측",
    "weather.jointHealth": "관절 건강",
    "weather.respiratory": "호흡기",
    "weather.high": "높음",
    "weather.medium": "중간",
    "weather.low": "낮음",
    "weather.caution": "주의",
    "weather.detailedAnalysis": "상세 분석 보기",
    
    // Trend Chart
    "trend.title": "7일 추세",
    "trend.lactateChange": "젖산 농도 변화",
    
    // Quick Actions
    "action.measure": "측정",
    "action.consultation": "진료",
    "action.shopping": "쇼핑",
    "action.analysis": "분석",
    
    // Misc
    "misc.viewDetails": "자세히 보기",
    "misc.viewAll": "전체 보기",
    "misc.active": "활성화",
    "misc.inactive": "비활성화",
    "misc.loading": "로딩 중...",
    "misc.noData": "데이터 없음",
    
    // Mall
    "mall.title": "만파식 몰",
    "mall.subtitle": "AI 추천 건강식품 스토어",
    "mall.searchPlaceholder": "제품명, 성분, 태그 검색...",
    "mall.allProducts": "전체 상품",
    "mall.featured": "추천 상품",
    "mall.filters": "필터",
    "mall.priceRange": "가격 범위",
    "mall.minRating": "최소 평점",
    "mall.all": "전체",
    "mall.applyFilters": "필터 적용",
    "mall.noProducts": "상품을 찾을 수 없습니다",
    "mall.viewAll": "전체 보기",
    "mall.addToCart": "장바구니",
    "mall.inCart": "담김",
    "mall.add": "담기",
    "mall.prescriptionRequired": "처방 필요",
    "mall.prescribed": "처방됨",
    "mall.prescribedBy": "처방:",
    "mall.recommendedForYou": "맞춤 추천",
    "mall.visitMall": "몰 방문하기",
    "mall.cart.title": "장바구니",
    "mall.cart.empty": "장바구니가 비어있습니다",
    "mall.cart.subtotal": "소계",
    "mall.cart.discount": "할인",
    "mall.cart.shipping": "배송비",
    "mall.cart.freeShipping": "무료 배송",
    "mall.cart.total": "총 결제금액",
    "mall.cart.checkout": "결제하기",
    "mall.checkout.title": "결제",
    "mall.checkout.description": "안전하게 결제를 완료하세요",
    "mall.checkout.shipping": "배송정보",
    "mall.checkout.payment": "결제수단",
    "mall.checkout.review": "주문확인",
    "mall.checkout.shippingAddress": "배송 주소",
    "mall.checkout.fullName": "이름",
    "mall.checkout.address": "주소",
    "mall.checkout.city": "도시",
    "mall.checkout.phone": "전화번호",
    "mall.checkout.freeShipping": "무료 배송",
    "mall.checkout.standardShipping": "일반 배송",
    "mall.checkout.estimatedDelivery": "예상 배송일: {days}일",
    "mall.checkout.paymentMethod": "결제 수단",
    "mall.checkout.securePayment": "SSL 암호화로 안전하게 결제됩니다",
    "mall.checkout.orderSummary": "주문 요약",
    "mall.checkout.qty": "수량",
    "mall.checkout.shipTo": "배송지",
    "mall.checkout.cancel": "취소",
    "mall.checkout.back": "뒤로",
    "mall.checkout.continue": "계속",
    "mall.checkout.placeOrder": "주문하기",
    "mall.checkout.processing": "처리 중...",
    "mall.checkout.orderConfirmed": "주문이 완료되었습니다!",
    "mall.checkout.orderNumber": "주문 번호",
    "mall.checkout.confirmationEmail": "확인 이메일이 발송되었습니다.",
    "mall.checkout.trackingAvailable": "배송 추적이 곧 가능합니다.",
    "mall.checkout.done": "완료"
  },
  
  en: {
    // App
    "app.title": "Manpasik Health",
    "app.subtitle": "Bio-Analysis AI System",
    "app.secure": "Secure",
    
    // Navigation - 5 Pillar System
    "nav.home": "Home",
    "nav.analyze": "Analyze",
    "nav.care": "Care",
    "nav.world": "World",
    "nav.me": "Me",
    "nav.analysis": "Analysis",
    "nav.consultation": "Consult",
    "nav.coach": "Coach",
    
    // 5 Pillar Descriptions
    "nav.home.desc": "My Daily Rhythm",
    "nav.analyze.desc": "Measurement & Data",
    "nav.care.desc": "Hospital & Mall",
    "nav.world.desc": "Education & Community",
    "nav.me.desc": "Profile & Settings",
    
    // Quick Actions
    "quick.measure": "Quick Measure",
    "quick.mate": "Talk to Mate",
    "quick.foodLens": "Food Lens",
    "quick.emergency": "Emergency SOS",
    
    // Home (Dashboard)
    "home.greeting.morning": "Good morning",
    "home.greeting.afternoon": "Good afternoon",
    "home.greeting.evening": "Good evening",
    "home.healthScore": "Health Score",
    "home.excellent": "Excellent",
    "home.good": "Good",
    "home.attention": "Attention",
    "home.todoTitle": "Today's Tasks",
    "home.completed": "Completed",
    "home.quickAction": "Quick Actions",
    "home.notifications": "Notifications",
    
    // Analyze (The Lab)
    "analyze.title": "The Lab",
    "analyze.subtitle": "Measurement & Data Analysis",
    "analyze.quickMeasure": "Quick Measure",
    "analyze.lastMeasure": "Last Measurement",
    "analyze.selectMode": "Select Measurement Mode",
    "analyze.liquid": "Liquid Analysis",
    "analyze.liquidDesc": "Blood, sweat, saliva biomarker measurement",
    "analyze.gas": "Gas Analysis",
    "analyze.gasDesc": "Breath analysis for metabolic state",
    "analyze.solid": "Solid Analysis",
    "analyze.solidDesc": "Food and environmental sample analysis",
    "analyze.nontarget": "Non-Target Analysis",
    "analyze.nontargetDesc": "AI-based unknown substance detection",
    "analyze.recentMeasure": "Recent Measurements",
    "analyze.viewAll": "View All",
    "analyze.weeklyTrend": "Weekly Trend",
    "analyze.history": "History",
    "analyze.start": "Start",
    
    // Care (Hospital & Mall)
    "care.title": "Care Center",
    "care.subtitle": "Hospital & Mall - Medical & Health Products",
    "care.experts": "Experts",
    "care.mall": "Health Mall",
    "care.pharmacy": "Prescriptions",
    "care.globalConnect": "Global Connect",
    "care.globalConnectDesc": "Consult with global experts via real-time AI translation",
    "care.aiRecommend": "AI Personalized Recommendations",
    "care.aiRecommendDesc": "Based on your 88-dimensional bio-signal",
    "care.bookNow": "Book Now",
    "care.available": "Available",
    "care.unavailable": "Unavailable",
    "care.allProducts": "View All Products",
    "care.noPrescription": "No prescriptions yet",
    "care.noPrescriptionDesc": "Prescriptions will appear after telemedicine consultations",
    "care.ePrescription": "E-Prescription Management",
    
    // World (Campus)
    "world.title": "Manpasik World",
    "world.subtitle": "The Campus - Education & Community",
    "world.school": "School",
    "world.agora": "Agora",
    "world.stories": "Stories",
    "world.learningPoints": "Learning Points",
    "world.usePoints": "Use Points",
    "world.recommendedCourses": "Recommended Courses",
    "world.completed": "Completed",
    "world.inProgress": "In Progress",
    "world.submitIdea": "Submit Idea",
    "world.popularIdeas": "Popular Ideas",
    "world.voting": "Voting",
    "world.funded": "Funded",
    "world.implemented": "Implemented",
    "world.successStories": "User Success Stories",
    "world.shareStory": "Share My Story",
    
    // Me (Digital Twin)
    "me.title": "Profile",
    "me.wallet": "MPS Wallet",
    "me.points": "Points",
    "me.coupons": "Coupons",
    "me.chargePoints": "Charge Points / Register Coupon",
    "me.digitalTwin": "Digital Twin",
    "me.medicalRecords": "Medical Records",
    "me.medicalRecordsDesc": "Diagnosis and prescription history",
    "me.dnaProfile": "DNA Profile",
    "me.dnaProfileDesc": "Genetic analysis results",
    "me.healthGoals": "Health Goals",
    "me.healthGoalsDesc": "Weight loss, muscle gain, etc.",
    "me.connectedDevices": "Connected Devices",
    "me.addDevice": "Add Device",
    "me.connected": "Connected",
    "me.disconnected": "Disconnected",
    "me.settings": "Settings",
    "me.notifications": "Notification Settings",
    "me.privacy": "Privacy & Security",
    "me.appSettings": "App Settings",
    "me.help": "Help & Support",
    "me.logout": "Logout",
    
    // AI Mate
    "mate.title": "Manpasik Mate",
    "mate.morningBriefing": "Morning Briefing",
    "mate.explainScreen": "Explain Screen",
    "mate.dismiss": "Dismiss",
    
    // Common
    "common.today": "Today",
    "common.yesterday": "Yesterday",
    "common.now": "Now",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.close": "Close",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.normal": "Normal",
    "common.warning": "Warning",
    "common.alert": "Alert",
    
    // Daily Vitals
    "vitals.title": "Daily Vitals",
    "vitals.subtitle": "Today's Health Status",
    "vitals.lactate": "Lactate Level",
    "vitals.heartRate": "Heart Rate",
    "vitals.trend": "7-Day Trend",
    "vitals.normalRange": "Normal Range",
    "vitals.excellent": "Excellent",
    "vitals.good": "Good",
    "vitals.fair": "Fair",
    "vitals.attention": "Attention",
    
    // AI Coach
    "coach.title": "AI Health Coach",
    "coach.askQuestion": "Ask AI Coach",
    "coach.placeholder": "Enter your health question...",
    "coach.send": "Send",
    "coach.greeting.morning": "Good morning",
    "coach.greeting.afternoon": "Good afternoon",
    "coach.greeting.evening": "Good evening",
    "coach.greeting.night": "Late night",
    "coach.personality.gentle": "Gentle",
    "coach.personality.balanced": "Balanced",
    "coach.personality.serious": "Serious",
    
    // AI Responses
    "ai.stableStatus": "You're in stable condition. Keep up regular measurements.",
    "ai.lowScore": "Your health score is low. Doctor consultation is recommended.",
    "ai.moderateScore": "Take it easy today and get plenty of rest.",
    "ai.highScore": "You're in great shape! Have a wonderful day.",
    "ai.highLactate": "Lactate levels are high. Light stretching is recommended.",
    "ai.appointmentReminder": "You have {count} appointment(s) today.",
    
    // Care Services
    "services.title": "Care Services",
    "services.subtitle": "Healthcare Services",
    "services.analyzeSmell": "Smell/Taste Analysis",
    "services.analyzeSubtitle": "Electronic Nose & Tongue",
    "services.bookDoctor": "Book Doctor",
    "services.bookSubtitle": "Telemedicine Booking",
    "services.prescriptions": "My Prescriptions",
    "services.prescriptionSubtitle": "E-Prescription & Pharmacy",
    "services.lowHealthWarning": "Health score is low",
    
    // Analysis
    "analysis.title": "12-Channel Sensor Analysis",
    "analysis.clickHint": "Click on chart points for AI interpretation",
    "analysis.noData": "No analysis data. Please run the sensor array.",
    "analysis.patternResult": "Pattern Matching Result",
    "analysis.topMatch": "Top Match",
    "analysis.similarity": "Similarity",
    "analysis.normal": "Normal",
    "analysis.warning": "Warning",
    "analysis.alert": "Alert",
    
    // Mall
    "mall.title": "Manpasik Mall",
    "mall.subtitle": "AI-Powered Health Store",
    "mall.searchPlaceholder": "Search products, ingredients, tags...",
    "mall.allProducts": "All Products",
    "mall.featured": "Featured",
    "mall.filters": "Filters",
    "mall.priceRange": "Price Range",
    "mall.minRating": "Min Rating",
    "mall.all": "All",
    "mall.applyFilters": "Apply Filters",
    "mall.noProducts": "No products found",
    "mall.viewAll": "View All",
    "mall.addToCart": "Add to Cart",
    "mall.inCart": "In Cart",
    "mall.add": "Add",
    "mall.prescriptionRequired": "Rx Required",
    "mall.prescribed": "Prescribed",
    "mall.prescribedBy": "Prescribed by",
    "mall.recommendedForYou": "Recommended for You",
    "mall.visitMall": "Visit Mall",
    "mall.cart.title": "Shopping Cart",
    "mall.cart.empty": "Your cart is empty",
    "mall.cart.subtotal": "Subtotal",
    "mall.cart.discount": "Discount",
    "mall.cart.shipping": "Shipping",
    "mall.cart.freeShipping": "Free Shipping",
    "mall.cart.total": "Total",
    "mall.cart.checkout": "Checkout",
    "mall.checkout.title": "Checkout",
    "mall.checkout.description": "Complete your order securely",
    "mall.checkout.shipping": "Shipping",
    "mall.checkout.payment": "Payment",
    "mall.checkout.review": "Review",
    "mall.checkout.shippingAddress": "Shipping Address",
    "mall.checkout.fullName": "Full Name",
    "mall.checkout.address": "Address",
    "mall.checkout.city": "City",
    "mall.checkout.phone": "Phone",
    "mall.checkout.freeShipping": "Free Shipping",
    "mall.checkout.standardShipping": "Standard Shipping",
    "mall.checkout.estimatedDelivery": "Estimated delivery: {days} days",
    "mall.checkout.paymentMethod": "Payment Method",
    "mall.checkout.securePayment": "Your payment is secured with SSL encryption",
    "mall.checkout.orderSummary": "Order Summary",
    "mall.checkout.qty": "Qty",
    "mall.checkout.shipTo": "Ship to",
    "mall.checkout.cancel": "Cancel",
    "mall.checkout.back": "Back",
    "mall.checkout.continue": "Continue",
    "mall.checkout.placeOrder": "Place Order",
    "mall.checkout.processing": "Processing...",
    "mall.checkout.orderConfirmed": "Order Confirmed!",
    "mall.checkout.orderNumber": "Order Number",
    "mall.checkout.confirmationEmail": "Confirmation email has been sent.",
    "mall.checkout.trackingAvailable": "Tracking will be available soon.",
    "mall.checkout.done": "Done",
    
    // Telemedicine
    "telemedicine.title": "Telemedicine Booking",
    "telemedicine.subtitle": "Telemedicine Booking System",
    "telemedicine.bookTab": "Book",
    "telemedicine.myAppointments": "My Appointments",
    "telemedicine.selectRegion": "Select Region",
    "telemedicine.selectSpecialty": "Select Specialty",
    "telemedicine.allRegions": "All Regions",
    "telemedicine.allSpecialties": "All Specialties",
    "telemedicine.searchResults": "Results: {count} hospitals",
    "telemedicine.startConsultation": "Start Video Consultation",
    "telemedicine.backToDashboard": "Back to Dashboard",
    
    // Prescription
    "prescription.title": "E-Prescription",
    "prescription.selectPharmacy": "Select Pharmacy",
    "prescription.sendPrescription": "Send Prescription",
    "prescription.pickupCode": "Pickup Code",
    "prescription.noPrescriptions": "No prescriptions",
    "prescription.noPrescriptionsDesc": "Prescriptions will appear here after doctor consultation",
    
    // Diagnosis Modal
    "diagnosis.title": "AI Health Analysis Result",
    "diagnosis.abnormalDetected": "Abnormal Pattern Detected",
    "diagnosis.recommendation": "Recommendations",
    "diagnosis.bookNow": "Book Now",
    "diagnosis.dietChange": "Diet adjustment is recommended",
    "diagnosis.restRecommended": "Rest is recommended",
    "diagnosis.consultDoctor": "Doctor consultation is recommended",
    "diagnosis.close": "Close",
    
    // System
    "system.status": "System",
    "system.checking": "Checking...",
    "system.normal": "Normal",
    "system.warning": "Warning",
    "system.error": "Error",
    
    // Sensor Array - Electronic Nose/Tongue
    "sensor.title": "Electronic Nose/Tongue",
    "sensor.subtitle": "Cross-reactive Sensor Array",
    "sensor.vector": "D Vector",
    "sensor.runAnalysis": "Run Analysis",
    "sensor.analyzing": "Analyzing...",
    "sensor.reset": "Reset",
    "sensor.radarChart": "Radar Chart",
    "sensor.patternMatching": "Pattern Matching",
    "sensor.selectPattern": "Select a pattern and run analysis",
    "sensor.channelSimulation": "16-Channel Sensor Array Simulation",
    "sensor.noResults": "No analysis results",
    "sensor.mainReaction": "Main Reaction",
    "sensor.recommendations": "Recommendations",
    "sensor.arrayAnalyzing": "Analyzing sensor array...",
    
    // Pattern Types
    "pattern.random": "Random",
    "pattern.randomDesc": "Random pattern",
    "pattern.healthy": "Healthy",
    "pattern.healthyDesc": "Normal breath",
    "pattern.kidney": "Kidney",
    "pattern.kidneyDesc": "Kidney disease pattern",
    "pattern.diabetes": "Diabetes",
    "pattern.diabetesDesc": "Diabetes pattern",
    "pattern.spoiled": "Spoiled",
    "pattern.spoiledDesc": "Spoiled food",
    
    // Daily Vitals
    "vitals.deepAnalysis": "Deep Analysis",
    "vitals.justNow": "Just now",
    "vitals.minutesAgo": "min ago",
    "vitals.hoursAgo": "hours ago",
    "vitals.lactateLevel": "Lactate Level",
    "vitals.heartRateLabel": "Heart Rate",
    "vitals.dayTrend": "7-Day Trend",
    
    // AI Coach Status
    "coach.active": "Active",
    "coach.inactive": "Inactive",
    "coach.thinking": "Thinking",
    
    // Health Status
    "health.excellent": "Excellent",
    "health.good": "Good",
    "health.fair": "Fair",
    "health.attention": "Attention",
    "health.warning": "Warning",
    "health.normal": "Normal",
    "health.abnormal": "Abnormal",
    
    // Predictive Health Widget
    "predict.title": "Predictive Health Engine",
    "predict.aiPowered": "AI Powered",
    "predict.immunityForecast": "Immunity Forecast",
    "predict.chronicDisease": "Chronic Disease",
    "predict.simulator": "Simulator",
    "predict.safe": "Safe",
    "predict.danger": "Danger",
    "predict.confidence": "Confidence",
    "predict.analysisFactors": "Analysis Factors",
    "predict.temperature": "Temperature",
    "predict.fatigue": "Fatigue",
    "predict.sleepQuality": "Sleep Quality",
    "predict.localFlu": "Local Flu Status",
    
    // Cartridge
    "cartridge.title": "Cartridge Health",
    "cartridge.insertScan": "Insert/scan a cartridge to see life prediction",
    "cartridge.noActive": "No active cartridge",
    "cartridge.remaining": "Remaining Life",
    "cartridge.uses": "Uses",
    "cartridge.expiry": "Expiry",
    
    // Hardware Topology
    "hardware.title": "Hardware Status",
    "hardware.waiting": "Waiting",
    "hardware.connected": "Connected",
    "hardware.disconnected": "Disconnected",
    "hardware.uncalibrated": "Uncalibrated",
    "hardware.calibrated": "Calibrated",
    
    // Weather Health
    "weather.title": "Weather-Health AI",
    "weather.realtime": "Real-time",
    "weather.fineDust": "Fine Dust",
    "weather.healthImpact": "Health Impact Prediction",
    "weather.jointHealth": "Joint Health",
    "weather.respiratory": "Respiratory",
    "weather.high": "High",
    "weather.medium": "Medium",
    "weather.low": "Low",
    "weather.caution": "Caution",
    "weather.detailedAnalysis": "View Detailed Analysis",
    
    // Trend Chart
    "trend.title": "7-Day Trend",
    "trend.lactateChange": "Lactate Level Change",
    
    // Quick Actions
    "action.measure": "Measure",
    "action.consultation": "Consult",
    "action.shopping": "Shop",
    "action.analysis": "Analyze",
    
    // Misc
    "misc.viewDetails": "View Details",
    "misc.viewAll": "View All",
    "misc.active": "Active",
    "misc.inactive": "Inactive",
    "misc.loading": "Loading...",
    "misc.noData": "No Data"
  },
  
  ja: {
    // App
    "app.title": "マンパシク ヘルス",
    "app.subtitle": "バイオ分析AIシステム",
    "app.secure": "セキュア",
    
    // Navigation
    "nav.home": "ホーム",
    "nav.analysis": "分析",
    "nav.consultation": "診療",
    "nav.coach": "コーチ",
    
    // Daily Vitals
    "vitals.title": "Daily Vitals",
    "vitals.subtitle": "今日の健康状態",
    "vitals.lactate": "乳酸値",
    "vitals.heartRate": "心拍数",
    "vitals.trend": "7日間推移",
    "vitals.normalRange": "正常範囲",
    "vitals.excellent": "優秀",
    "vitals.good": "良好",
    "vitals.fair": "普通",
    "vitals.attention": "注意",
    
    // AI Coach
    "coach.title": "AI ヘルスコーチ",
    "coach.askQuestion": "AIコーチに質問する",
    "coach.placeholder": "健康に関する質問を入力してください...",
    "coach.send": "送信",
    "coach.greeting.morning": "おはようございます",
    "coach.greeting.afternoon": "こんにちは",
    "coach.greeting.evening": "こんばんは",
    "coach.greeting.night": "深夜です",
    "coach.personality.gentle": "優しい",
    "coach.personality.balanced": "バランス",
    "coach.personality.serious": "真剣",
    
    // AI Responses
    "ai.stableStatus": "安定した状態です。定期的な測定を続けてください。",
    "ai.lowScore": "健康スコアが低いです。医師への相談をお勧めします。",
    "ai.moderateScore": "今日は無理をせず、十分に休息してください。",
    "ai.highScore": "コンディション最高です！素敵な一日を。",
    "ai.highLactate": "乳酸値が高いです。軽いストレッチをお勧めします。",
    "ai.appointmentReminder": "今日は{count}件の診療予約があります。",
    
    // Care Services
    "services.title": "ケアサービス",
    "services.subtitle": "ヘルスケアサービス",
    "services.analyzeSmell": "匂い・味分析",
    "services.analyzeSubtitle": "電子ノーズ&タン",
    "services.bookDoctor": "医師予約",
    "services.bookSubtitle": "遠隔診療予約",
    "services.prescriptions": "処方箋",
    "services.prescriptionSubtitle": "電子処方箋&薬局",
    "services.lowHealthWarning": "健康スコアが低いです",
    
    // Analysis
    "analysis.title": "12チャンネルセンサー分析",
    "analysis.clickHint": "チャートポイントをクリックするとAI解釈が表示されます",
    "analysis.noData": "分析データがありません。センサーアレイを実行してください。",
    "analysis.patternResult": "パターンマッチング結果",
    "analysis.topMatch": "最高一致",
    "analysis.similarity": "類似度",
    "analysis.normal": "正常",
    "analysis.warning": "注意",
    "analysis.alert": "警告",
    
    // Telemedicine
    "telemedicine.title": "遠隔診療予約",
    "telemedicine.subtitle": "テレメディシン予約システム",
    "telemedicine.bookTab": "予約する",
    "telemedicine.myAppointments": "予約一覧",
    "telemedicine.selectRegion": "地域選択",
    "telemedicine.selectSpecialty": "診療科選択",
    "telemedicine.allRegions": "すべての地域",
    "telemedicine.allSpecialties": "すべての診療科",
    "telemedicine.searchResults": "検索結果: {count}件の病院",
    "telemedicine.startConsultation": "ビデオ診療開始",
    "telemedicine.backToDashboard": "ダッシュボードに戻る",
    
    // Prescription
    "prescription.title": "電子処方箋",
    "prescription.selectPharmacy": "薬局選択",
    "prescription.sendPrescription": "処方箋送信",
    "prescription.pickupCode": "受取コード",
    "prescription.noPrescriptions": "処方箋がありません",
    "prescription.noPrescriptionsDesc": "診療後に処方箋がここに表示されます",
    
    // Diagnosis Modal
    "diagnosis.title": "AI健康分析結果",
    "diagnosis.abnormalDetected": "異常パターン検出",
    "diagnosis.recommendation": "推奨事項",
    "diagnosis.bookNow": "今すぐ予約",
    "diagnosis.dietChange": "食事調整をお勧めします",
    "diagnosis.restRecommended": "十分な休息が必要です",
    "diagnosis.consultDoctor": "専門医への相談をお勧めします",
    "diagnosis.close": "閉じる",
    
    // System
    "system.status": "システム",
    "system.checking": "確認中...",
    "system.normal": "正常",
    "system.warning": "注意",
    "system.error": "エラー"
  },
  
  zh: {
    // App
    "app.title": "万帕希克健康",
    "app.subtitle": "生物分析AI系统",
    "app.secure": "安全",
    
    // Navigation
    "nav.home": "首页",
    "nav.analysis": "分析",
    "nav.consultation": "问诊",
    "nav.coach": "教练",
    
    // Daily Vitals
    "vitals.title": "每日健康",
    "vitals.subtitle": "今日健康状态",
    "vitals.lactate": "乳酸浓度",
    "vitals.heartRate": "心率",
    "vitals.trend": "7天趋势",
    "vitals.normalRange": "正常范围",
    "vitals.excellent": "优秀",
    "vitals.good": "良好",
    "vitals.fair": "一般",
    "vitals.attention": "注意",
    
    // AI Coach
    "coach.title": "AI健康教练",
    "coach.askQuestion": "询问AI教练",
    "coach.placeholder": "输入您的健康问题...",
    "coach.send": "发送",
    "coach.greeting.morning": "早上好",
    "coach.greeting.afternoon": "下午好",
    "coach.greeting.evening": "晚上好",
    "coach.greeting.night": "深夜好",
    "coach.personality.gentle": "温和",
    "coach.personality.balanced": "平衡",
    "coach.personality.serious": "严肃",
    
    // AI Responses
    "ai.stableStatus": "状态稳定。请保持定期测量。",
    "ai.lowScore": "健康评分较低。建议咨询医生。",
    "ai.moderateScore": "今天别太累，好好休息。",
    "ai.highScore": "状态非常好！祝您愉快的一天。",
    "ai.highLactate": "乳酸水平较高。建议轻度拉伸。",
    "ai.appointmentReminder": "今天有{count}个预约。",
    
    // Care Services
    "services.title": "护理服务",
    "services.subtitle": "医疗保健服务",
    "services.analyzeSmell": "气味/味道分析",
    "services.analyzeSubtitle": "电子鼻舌",
    "services.bookDoctor": "预约医生",
    "services.bookSubtitle": "远程医疗预约",
    "services.prescriptions": "我的处方",
    "services.prescriptionSubtitle": "电子处方与药房",
    "services.lowHealthWarning": "健康评分较低",
    
    // Analysis
    "analysis.title": "12通道传感器分析",
    "analysis.clickHint": "点击图表点查看AI解读",
    "analysis.noData": "暂无分析数据。请运行传感器阵列。",
    "analysis.patternResult": "模式匹配结果",
    "analysis.topMatch": "最佳匹配",
    "analysis.similarity": "相似度",
    "analysis.normal": "正常",
    "analysis.warning": "警告",
    "analysis.alert": "警报",
    
    // Telemedicine
    "telemedicine.title": "远程医疗预约",
    "telemedicine.subtitle": "远程医疗预约系统",
    "telemedicine.bookTab": "预约",
    "telemedicine.myAppointments": "我的预约",
    "telemedicine.selectRegion": "选择地区",
    "telemedicine.selectSpecialty": "选择科室",
    "telemedicine.allRegions": "所有地区",
    "telemedicine.allSpecialties": "所有科室",
    "telemedicine.searchResults": "搜索结果：{count}家医院",
    "telemedicine.startConsultation": "开始视频问诊",
    "telemedicine.backToDashboard": "返回仪表板",
    
    // Prescription
    "prescription.title": "电子处方",
    "prescription.selectPharmacy": "选择药房",
    "prescription.sendPrescription": "发送处方",
    "prescription.pickupCode": "取药码",
    "prescription.noPrescriptions": "暂无处方",
    "prescription.noPrescriptionsDesc": "问诊后处方将显示在这里",
    
    // Diagnosis Modal
    "diagnosis.title": "AI健康分析结果",
    "diagnosis.abnormalDetected": "检测到异常模式",
    "diagnosis.recommendation": "建议",
    "diagnosis.bookNow": "立即预约",
    "diagnosis.dietChange": "建议调整饮食",
    "diagnosis.restRecommended": "建议充分休息",
    "diagnosis.consultDoctor": "建议咨询专科医生",
    "diagnosis.close": "关闭",
    
    // System
    "system.status": "系统",
    "system.checking": "检查中...",
    "system.normal": "正常",
    "system.warning": "警告",
    "system.error": "错误"
  },
  
  es: {
    // App
    "app.title": "Manpasik Salud",
    "app.subtitle": "Sistema de Bio-Análisis IA",
    "app.secure": "Seguro",
    
    // Navigation
    "nav.home": "Inicio",
    "nav.analysis": "Análisis",
    "nav.consultation": "Consulta",
    "nav.coach": "Coach",
    
    // Daily Vitals
    "vitals.title": "Signos Vitales",
    "vitals.subtitle": "Estado de Salud de Hoy",
    "vitals.lactate": "Nivel de Lactato",
    "vitals.heartRate": "Frecuencia Cardíaca",
    "vitals.trend": "Tendencia 7 Días",
    "vitals.normalRange": "Rango Normal",
    "vitals.excellent": "Excelente",
    "vitals.good": "Bueno",
    "vitals.fair": "Regular",
    "vitals.attention": "Atención",
    
    // AI Coach
    "coach.title": "Coach de Salud IA",
    "coach.askQuestion": "Preguntar al Coach IA",
    "coach.placeholder": "Ingrese su pregunta de salud...",
    "coach.send": "Enviar",
    "coach.greeting.morning": "Buenos días",
    "coach.greeting.afternoon": "Buenas tardes",
    "coach.greeting.evening": "Buenas noches",
    "coach.greeting.night": "Muy tarde",
    "coach.personality.gentle": "Suave",
    "coach.personality.balanced": "Equilibrado",
    "coach.personality.serious": "Serio",
    
    // AI Responses
    "ai.stableStatus": "Estás en condición estable. Mantén las mediciones regulares.",
    "ai.lowScore": "Tu puntuación de salud es baja. Se recomienda consulta médica.",
    "ai.moderateScore": "Tómatelo con calma hoy y descansa bien.",
    "ai.highScore": "¡Estás en excelente forma! Que tengas un gran día.",
    "ai.highLactate": "Los niveles de lactato están altos. Se recomienda estiramientos suaves.",
    "ai.appointmentReminder": "Tienes {count} cita(s) hoy.",
    
    // Care Services
    "services.title": "Servicios de Cuidado",
    "services.subtitle": "Servicios de Salud",
    "services.analyzeSmell": "Análisis de Olor/Sabor",
    "services.analyzeSubtitle": "Nariz y Lengua Electrónica",
    "services.bookDoctor": "Reservar Médico",
    "services.bookSubtitle": "Reserva de Telemedicina",
    "services.prescriptions": "Mis Recetas",
    "services.prescriptionSubtitle": "E-Receta y Farmacia",
    "services.lowHealthWarning": "Puntuación de salud baja",
    
    // Analysis
    "analysis.title": "Análisis de Sensor 12-Canales",
    "analysis.clickHint": "Haz clic en los puntos del gráfico para ver la interpretación IA",
    "analysis.noData": "Sin datos de análisis. Por favor ejecuta el array de sensores.",
    "analysis.patternResult": "Resultado de Coincidencia de Patrones",
    "analysis.topMatch": "Mejor Coincidencia",
    "analysis.similarity": "Similitud",
    "analysis.normal": "Normal",
    "analysis.warning": "Advertencia",
    "analysis.alert": "Alerta",
    
    // Telemedicine
    "telemedicine.title": "Reserva de Telemedicina",
    "telemedicine.subtitle": "Sistema de Reserva de Telemedicina",
    "telemedicine.bookTab": "Reservar",
    "telemedicine.myAppointments": "Mis Citas",
    "telemedicine.selectRegion": "Seleccionar Región",
    "telemedicine.selectSpecialty": "Seleccionar Especialidad",
    "telemedicine.allRegions": "Todas las Regiones",
    "telemedicine.allSpecialties": "Todas las Especialidades",
    "telemedicine.searchResults": "Resultados: {count} hospitales",
    "telemedicine.startConsultation": "Iniciar Video Consulta",
    "telemedicine.backToDashboard": "Volver al Panel",
    
    // Prescription
    "prescription.title": "E-Receta",
    "prescription.selectPharmacy": "Seleccionar Farmacia",
    "prescription.sendPrescription": "Enviar Receta",
    "prescription.pickupCode": "Código de Recogida",
    "prescription.noPrescriptions": "Sin recetas",
    "prescription.noPrescriptionsDesc": "Las recetas aparecerán aquí después de la consulta médica",
    
    // Diagnosis Modal
    "diagnosis.title": "Resultado de Análisis de Salud IA",
    "diagnosis.abnormalDetected": "Patrón Anormal Detectado",
    "diagnosis.recommendation": "Recomendaciones",
    "diagnosis.bookNow": "Reservar Ahora",
    "diagnosis.dietChange": "Se recomienda ajuste de dieta",
    "diagnosis.restRecommended": "Se recomienda descanso",
    "diagnosis.consultDoctor": "Se recomienda consulta médica",
    "diagnosis.close": "Cerrar",
    
    // System
    "system.status": "Sistema",
    "system.checking": "Verificando...",
    "system.normal": "Normal",
    "system.warning": "Advertencia",
    "system.error": "Error"
  }
};

/**
 * AI Coach System Prompts (Language-specific)
 */
export const AI_SYSTEM_PROMPTS: Record<Locale, string> = {
  ko: "당신은 한국어로 응답하는 건강 도우미 AI입니다. 사용자의 건강 데이터를 분석하고 친절하게 조언해주세요. 전문적이면서도 이해하기 쉬운 언어를 사용하세요.",
  
  en: "You are an English-speaking health assistant AI. Analyze user health data and provide friendly advice. Use professional yet easy-to-understand language.",
  
  ja: "あなたは日本語で応答するヘルスアシスタントAIです。ユーザーの健康データを分析し、親切にアドバイスしてください。専門的でありながら理解しやすい言葉を使用してください。",
  
  zh: "您是一位使用中文回复的健康助理AI。分析用户健康数据并提供友好的建议。使用专业但易于理解的语言。",
  
  es: "Eres un asistente de salud IA que responde en español. Analiza los datos de salud del usuario y proporciona consejos amables. Usa un lenguaje profesional pero fácil de entender."
};

/**
 * Get translation with interpolation
 */
export function getTranslation(
  locale: Locale, 
  key: TranslationKey, 
  params?: Record<string, string | number>
): string {
  const translation = translations[locale]?.[key] || translations.ko[key] || key;
  
  if (!params) return translation;
  
  // Replace {key} with value
  return Object.entries(params).reduce(
    (str, [key, value]) => str.replace(`{${key}}`, String(value)),
    translation
  );
}

