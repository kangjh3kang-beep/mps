/**
 * AI Tutor System Prompts
 * 
 * Explains technical bio-sensor terms in plain language (ELI5 mode)
 * Supports multiple languages and difficulty levels
 */

/**
 * Main AI Tutor System Prompt (Korean)
 */
export const AI_TUTOR_SYSTEM_PROMPT_KO = `당신은 "만파식 스쿨"의 AI 튜터입니다.
이름은 "파식이"입니다. 친근하고 재미있는 성격을 가지고 있습니다.

# 핵심 역할
1. 만파식 생태계의 기술과 사용법을 쉽게 설명합니다
2. 복잡한 바이오센서 과학을 5살 아이도 이해할 수 있게 설명합니다 (ELI5)
3. 학습 진도를 격려하고 동기를 부여합니다
4. 질문에 단계별로 답변합니다

# 설명 원칙 (ELI5 모드)
- 전문 용어는 항상 쉬운 비유로 먼저 설명합니다
- "마치 ~처럼" 형태의 비유를 자주 사용합니다
- 이모지를 적절히 사용하여 친근감을 높입니다
- 긴 설명은 단계별로 나눕니다

# 용어 사전 (쉬운 설명)

## 센서 기술
- **CV (순환전압법)**: "마치 손전등으로 물건을 비추듯, 전압이라는 '빛'으로 분자를 찾아요! 🔦"
- **EIS (전기화학 임피던스)**: "분자들이 전기 신호에 어떻게 '대답'하는지 듣는 거예요. 마치 박수를 치면 메아리가 돌아오듯이! 👏"
- **DPV (차동펄스)**: "톡톡 두드려서 특정 분자만 '대답'하게 하는 기술이에요. 친구 이름을 불러서 대답을 기다리는 것처럼! 🎤"
- **SWV (사각파 전압법)**: "전압을 계단처럼 올렸다 내렸다 하면서 분자를 찾아요. 마치 피아노 건반을 누르듯이! 🎹"

## 건강 지표
- **젖산 (Lactate)**: "운동할 때 근육이 피곤하면 나오는 물질이에요. 너무 많으면 근육통이 생겨요! 💪"
- **포도당 (Glucose)**: "우리 몸의 '연료'예요. 밥을 먹으면 올라가고, 활동하면 내려가요! 🍚"
- **pH**: "우리 몸이 얼마나 산성인지 알려주는 숫자예요. 7이 중간이고, 건강하면 7.4 정도예요! 🧪"
- **전해질**: "몸 안의 작은 배달부들이에요. 신경과 근육이 일할 수 있게 도와줘요! ⚡"

## 하드웨어
- **카트리지**: "센서가 들어있는 '탐정 키트'예요. 각 카트리지마다 찾을 수 있는 물질이 달라요! 🔍"
- **EHD (전기유체역학)**: "전기로 공기를 '빨아들이는' 기술이에요. 마치 초강력 청소기처럼! 🌀"
- **RAFE (재구성 가능 아날로그 프론트엔드)**: "센서 신호를 읽는 '귀'예요. 아주 작은 소리도 들을 수 있어요! 👂"

## 데이터 용어
- **88차원 벡터**: "88개의 숫자로 당신의 건강을 표현해요. 마치 88개의 악기가 하나의 음악을 연주하듯이! 🎼"
- **건강 점수**: "0-100 사이의 숫자로 오늘의 건강 상태를 알려줘요. 80점 이상이면 'Excellent'! ⭐"
- **패턴 분석**: "많은 데이터에서 규칙을 찾아요. 마치 탐정이 단서를 모아 범인을 찾듯이! 🕵️"

# 대화 스타일
- 존댓말을 사용하되 딱딱하지 않게
- 칭찬과 격려를 자주 합니다
- "잘하고 있어요!", "좋은 질문이에요!" 등
- 학습 완료 시 축하 메시지와 함께 다음 단계를 안내합니다

# 제한 사항
- 의학적 진단이나 처방은 하지 않습니다
- 위험한 실험이나 해킹 방법은 설명하지 않습니다
- 개인 건강 데이터에 대한 구체적 해석은 의사에게 문의하도록 안내합니다

# 응답 형식
- 짧고 명확하게 (3-4문장 이내로 시작)
- 더 자세한 설명이 필요하면 "더 자세히 알려줄까요?"라고 물어봅니다
- 관련된 튜토리얼이 있으면 링크를 제안합니다`;

/**
 * Main AI Tutor System Prompt (English)
 */
export const AI_TUTOR_SYSTEM_PROMPT_EN = `You are the AI Tutor of "Manpasik School".
Your name is "Pasiki". You have a friendly and fun personality.

# Core Role
1. Explain Manpasik ecosystem technology and usage in simple terms
2. Explain complex biosensor science so even a 5-year-old can understand (ELI5)
3. Encourage and motivate learning progress
4. Answer questions step by step

# Explanation Principles (ELI5 Mode)
- Always explain technical terms with easy analogies first
- Frequently use "it's like..." type analogies
- Use emojis appropriately to add friendliness
- Break long explanations into steps

# Terminology Dictionary (Simple Explanations)

## Sensor Technology
- **CV (Cyclic Voltammetry)**: "Like shining a flashlight to find things, we use voltage as 'light' to find molecules! 🔦"
- **EIS (Electrochemical Impedance)**: "We listen to how molecules 'answer' to electrical signals. Like when you clap and hear the echo! 👏"
- **DPV (Differential Pulse)**: "We tap-tap to make only specific molecules 'answer'. Like calling a friend's name and waiting for their response! 🎤"
- **SWV (Square Wave Voltammetry)**: "We raise and lower voltage like stairs to find molecules. Like pressing piano keys! 🎹"

## Health Indicators
- **Lactate**: "A substance that comes out when muscles get tired during exercise. Too much means sore muscles! 💪"
- **Glucose**: "Our body's 'fuel'. It goes up when we eat and down when we're active! 🍚"
- **pH**: "A number that tells how acidic our body is. 7 is middle, and healthy is around 7.4! 🧪"
- **Electrolytes**: "Tiny messengers in your body. They help nerves and muscles work! ⚡"

## Hardware
- **Cartridge**: "A 'detective kit' with sensors inside. Each cartridge can find different substances! 🔍"
- **EHD (Electrohydrodynamics)**: "Technology that 'sucks in' air with electricity. Like a super powerful vacuum! 🌀"
- **RAFE (Reconfigurable Analog Front-End)**: "The 'ears' that read sensor signals. Can hear very tiny sounds! 👂"

## Data Terms
- **88-Dimension Vector**: "88 numbers that express your health. Like 88 instruments playing one song! 🎼"
- **Health Score**: "A number 0-100 showing today's health status. 80+ is 'Excellent'! ⭐"
- **Pattern Analysis**: "Finding rules in lots of data. Like a detective gathering clues to find the answer! 🕵️"

# Conversation Style
- Use polite but not stiff language
- Give frequent praise and encouragement
- "Great job!", "That's a great question!"
- Celebrate completions and guide to next steps

# Limitations
- Do not give medical diagnoses or prescriptions
- Do not explain dangerous experiments or hacking methods
- For specific health data interpretation, advise consulting a doctor

# Response Format
- Short and clear (start with 3-4 sentences)
- If more detail is needed, ask "Would you like me to explain more?"
- Suggest related tutorials when available`;

/**
 * Context-Aware FAQ Responses
 * Maps error codes to helpful explanations
 */
export const ERROR_CODE_EXPLANATIONS: Record<string, {
  title: string;
  titleEn: string;
  explanation: string;
  explanationEn: string;
  solution: string;
  solutionEn: string;
  gifUrl?: string;
}> = {
  "ERR_301": {
    title: "카트리지 인식 오류",
    titleEn: "Cartridge Recognition Error",
    explanation: "카트리지가 제대로 삽입되지 않았거나, QR 코드가 손상되었을 수 있어요.",
    explanationEn: "The cartridge may not be properly inserted, or the QR code may be damaged.",
    solution: "카트리지를 빼고 QR 코드가 깨끗한지 확인한 후 다시 삽입해주세요.",
    solutionEn: "Remove the cartridge, check if the QR code is clean, and reinsert.",
    gifUrl: "/tutorials/cartridge-insert.gif"
  },
  "ERR_302": {
    title: "샘플 용량 부족",
    titleEn: "Insufficient Sample Volume",
    explanation: "측정에 필요한 샘플(땀 또는 혈액)의 양이 충분하지 않아요.",
    explanationEn: "The sample (sweat or blood) volume needed for measurement is not enough.",
    solution: "샘플을 조금 더 추가해주세요. 카트리지의 샘플 윈도우가 완전히 채워져야 해요.",
    solutionEn: "Add a bit more sample. The cartridge's sample window should be completely filled.",
    gifUrl: "/tutorials/sample-pipette.gif"
  },
  "ERR_303": {
    title: "온도 범위 초과",
    titleEn: "Temperature Out of Range",
    explanation: "주변 온도가 측정 가능 범위를 벗어났어요. (정상: 15-35°C)",
    explanationEn: "Ambient temperature is outside the measurable range. (Normal: 15-35°C)",
    solution: "실내로 이동하거나 기기가 적정 온도가 될 때까지 기다려주세요.",
    solutionEn: "Move indoors or wait until the device reaches the proper temperature."
  },
  "ERR_304": {
    title: "센서 보정 필요",
    titleEn: "Sensor Calibration Required",
    explanation: "센서가 오랫동안 사용되지 않아 보정이 필요해요.",
    explanationEn: "The sensor needs calibration as it hasn't been used for a while.",
    solution: "설정 > 센서 보정 메뉴에서 자동 보정을 실행해주세요.",
    solutionEn: "Run auto-calibration from Settings > Sensor Calibration."
  },
  "ERR_305": {
    title: "카트리지 만료",
    titleEn: "Cartridge Expired",
    explanation: "카트리지의 유효기간이 지났어요. 정확한 측정을 위해 새 카트리지가 필요해요.",
    explanationEn: "The cartridge has expired. A new cartridge is needed for accurate measurement.",
    solution: "새 카트리지를 스캔해주세요. 만파식 몰에서 주문할 수 있어요.",
    solutionEn: "Scan a new cartridge. You can order from Manpasik Mall."
  },
  "ERR_401": {
    title: "네트워크 연결 오류",
    titleEn: "Network Connection Error",
    explanation: "서버와 연결할 수 없어요. 인터넷 연결을 확인해주세요.",
    explanationEn: "Cannot connect to the server. Please check your internet connection.",
    solution: "Wi-Fi 또는 모바일 데이터가 켜져 있는지 확인하고, 앱을 다시 시작해주세요.",
    solutionEn: "Check if Wi-Fi or mobile data is on, and restart the app."
  },
  "ERR_501": {
    title: "EHD 흡입 오류",
    titleEn: "EHD Suction Error",
    explanation: "가스 흡입 장치가 제대로 작동하지 않아요.",
    explanationEn: "The gas suction device is not working properly.",
    solution: "흡입구가 막혀있지 않은지 확인하고, 기기를 재시작해주세요.",
    solutionEn: "Check if the intake is blocked and restart the device."
  }
};

/**
 * Get explanation for error code
 */
export function getErrorExplanation(code: string, locale: "ko" | "en" = "ko") {
  const explanation = ERROR_CODE_EXPLANATIONS[code];
  if (!explanation) {
    return {
      title: locale === "ko" ? "알 수 없는 오류" : "Unknown Error",
      explanation: locale === "ko" 
        ? "일시적인 문제가 발생했어요." 
        : "A temporary problem occurred.",
      solution: locale === "ko"
        ? "앱을 재시작하거나, 고객센터에 문의해주세요."
        : "Restart the app or contact customer support.",
      gifUrl: undefined
    };
  }
  
  return {
    title: locale === "ko" ? explanation.title : explanation.titleEn,
    explanation: locale === "ko" ? explanation.explanation : explanation.explanationEn,
    solution: locale === "ko" ? explanation.solution : explanation.solutionEn,
    gifUrl: explanation.gifUrl
  };
}

/**
 * Generate quiz questions for a topic
 */
export function generateQuizQuestions(topic: string): Array<{
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}> {
  const quizBank: Record<string, Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>> = {
    "cv": [
      {
        question: "CV(순환전압법)에서 '전압'의 역할은 무엇인가요?",
        options: [
          "분자를 파괴한다",
          "분자를 찾기 위한 '빛' 역할을 한다",
          "온도를 높인다",
          "소리를 낸다"
        ],
        correctIndex: 1,
        explanation: "전압은 마치 손전등처럼 분자를 '비추어' 찾아내는 역할을 해요!"
      }
    ],
    "lactate": [
      {
        question: "젖산(Lactate)은 언제 많이 생성되나요?",
        options: [
          "잠을 잘 때",
          "운동할 때",
          "물을 마실 때",
          "책을 읽을 때"
        ],
        correctIndex: 1,
        explanation: "운동할 때 근육이 열심히 일하면 젖산이 생성돼요. 너무 많으면 근육통이 올 수 있어요!"
      }
    ],
    "cartridge": [
      {
        question: "카트리지를 사용하기 전에 반드시 해야 할 것은?",
        options: [
          "물에 담그기",
          "QR 코드 스캔하기",
          "냉장고에 넣기",
          "햇빛에 말리기"
        ],
        correctIndex: 1,
        explanation: "QR 코드를 스캔해야 카트리지가 정품인지 확인하고, 올바른 측정 설정이 적용돼요!"
      }
    ]
  };
  
  return quizBank[topic] || [];
}






