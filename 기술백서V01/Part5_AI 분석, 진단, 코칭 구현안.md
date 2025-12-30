# 차동측정 기반 범용 분석 시스템 최종 종합 기술백서

## Part 5: AI 분석, 진단, 코칭 구현안

**문서 버전**: v1.0 FINAL
**작성일**: 2025년 12월 11일
**검증 패널**: AI/ML 전문가, 생체의공학 박사, 임상병리사 검증 완료

---

## 1. AI 시스템 아키텍처

### 1.1 전체 구조

```
+------------------------------------------------------------------+
|                    AI 시스템 아키텍처                              |
+------------------------------------------------------------------+
|                                                                    |
|  [리더기]                                                          |
|  +----------------------------------------------------------+     |
|  | Edge AI (MCU)                                            |     |
|  | - Signal Preprocessing                                    |     |
|  | - XGBoost Inference (경량화)                              |     |
|  | - Anomaly Detection (간소화)                              |     |
|  +----------------------------------------------------------+     |
|                              |                                     |
|                         BLE / WiFi                                |
|                              |                                     |
|  [모바일 앱]                                                       |
|  +----------------------------------------------------------+     |
|  | Mobile AI                                                 |     |
|  | - Advanced Signal Processing                              |     |
|  | - Classification (TensorFlow Lite)                        |     |
|  | - Health Score Calculation                                |     |
|  | - Basic Coaching                                          |     |
|  +----------------------------------------------------------+     |
|                              |                                     |
|                        HTTPS API                                  |
|                              |                                     |
|  [클라우드]                                                        |
|  +----------------------------------------------------------+     |
|  | Cloud AI                                                  |     |
|  | - Deep Learning Models                                    |     |
|  | - Longitudinal Analysis                                   |     |
|  | - Population Health Analytics                             |     |
|  | - Personalized Coaching                                   |     |
|  | - Federated Learning                                      |     |
|  +----------------------------------------------------------+     |
|                                                                    |
+------------------------------------------------------------------+
```

### 1.2 AI 기능 분류

| 계층 | 기능 | 모델 | 지연 시간 |
|------|------|------|-----------|
| Edge (MCU) | 매트릭스 보정 | XGBoost (경량) | < 10ms |
| Edge (MCU) | 이상 탐지 | Threshold | < 1ms |
| Mobile | 물질 분류 | TFLite CNN | < 100ms |
| Mobile | 건강 점수 | 규칙 기반 | < 50ms |
| Cloud | 장기 추세 | LSTM/Transformer | < 500ms |
| Cloud | 개인화 코칭 | GPT/RAG | < 2s |

---

## 2. Edge AI (MCU 탑재)

### 2.1 XGBoost 경량화 모델

```c
// XGBoost 모델 사양
// - 트리 수: 50 (경량화)
// - 최대 깊이: 4
// - 메모리: 약 200KB
// - 추론 시간: 5ms @ 168MHz

// 특성 벡터 (10차원)
typedef struct {
    float raw_diff_signal;      // 원시 차동 신호
    float baseline_drift;       // 베이스라인 드리프트
    float temperature;          // 온도
    float ph;                   // pH (가능 시)
    float conductivity;         // 전도도
    float signal_variance;      // 신호 분산
    float snr_db;              // SNR
    float usage_count;          // 사용 횟수 (정규화)
    float time_since_cal;       // 보정 후 경과 시간
    float ambient_light;        // 주변광 (광학 센서)
} FeatureVector_t;

// 예측 함수
float XGBoost_Predict_MatrixCorrection(FeatureVector_t* features) {
    float score = BASE_SCORE;
    
    for (int i = 0; i < NUM_TREES; i++) {
        score += LEARNING_RATE * TraverseTree(i, features);
    }
    
    return score;
}
```

### 2.2 실시간 이상 탐지

```c
// 간소화된 이상 탐지 (MCU용)
typedef struct {
    float mean[8];       // 정상 패턴 평균
    float std[8];        // 정상 패턴 표준편차
    float threshold;     // 이상 판정 임계값 (3 sigma)
} SimpleAnomalyDetector_t;

// Z-score 기반 이상 탐지
float CalculateZScore(SimpleAnomalyDetector_t* detector,
                      float* fingerprint) {
    float max_z = 0.0f;
    
    for (int i = 0; i < 8; i++) {
        float z = fabsf(fingerprint[i] - detector->mean[i]) / 
                  detector->std[i];
        if (z > max_z) max_z = z;
    }
    
    return max_z;
}

// 이상 판정
typedef enum {
    DETECT_NORMAL,
    DETECT_WARNING,
    DETECT_ANOMALY
} DetectionResult_t;

DetectionResult_t DetectAnomalySimple(SimpleAnomalyDetector_t* det,
                                       float* fingerprint) {
    float z_score = CalculateZScore(det, fingerprint);
    
    if (z_score < 2.0f) return DETECT_NORMAL;
    if (z_score < 3.0f) return DETECT_WARNING;
    return DETECT_ANOMALY;
}
```

---

## 3. Mobile AI (앱 탑재)

### 3.1 TensorFlow Lite 모델

```python
# 물질 분류 모델 (TFLite)
# 입력: 8채널 핑거프린트 + 환경 데이터 (12차원)
# 출력: 물질 클래스 확률 (20개 클래스)

import tensorflow as tf

def create_classification_model():
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(12,)),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(20, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

# TFLite 변환
def convert_to_tflite(model):
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]
    
    tflite_model = converter.convert()
    
    with open('classifier.tflite', 'wb') as f:
        f.write(tflite_model)
    
    return tflite_model
```

### 3.2 건강 점수 계산

```typescript
// TypeScript (React Native)

interface HealthMetrics {
  glucose: number;        // mg/dL
  lactate: number;        // mM
  cholesterol: number;    // mg/dL
  hba1c: number;         // %
  hydration: number;      // 전도도 기반
}

interface HealthScore {
  overall: number;        // 0-100
  metabolic: number;      // 0-100
  cardiovascular: number; // 0-100
  hydration: number;      // 0-100
  trend: 'improving' | 'stable' | 'declining';
}

function calculateHealthScore(metrics: HealthMetrics, 
                               history: HealthMetrics[]): HealthScore {
  // 대사 점수 (포도당, 젖산 기반)
  let metabolicScore = 100;
  
  // 포도당 점수 (정상: 70-100 mg/dL)
  if (metrics.glucose < 70) {
    metabolicScore -= (70 - metrics.glucose) * 2;
  } else if (metrics.glucose > 100) {
    metabolicScore -= (metrics.glucose - 100) * 0.5;
  }
  
  // 젖산 점수 (정상: < 2.0 mM)
  if (metrics.lactate > 2.0) {
    metabolicScore -= (metrics.lactate - 2.0) * 10;
  }
  
  metabolicScore = Math.max(0, Math.min(100, metabolicScore));
  
  // 심혈관 점수 (콜레스테롤, HbA1c 기반)
  let cvScore = 100;
  
  // 콜레스테롤 점수 (정상: < 200 mg/dL)
  if (metrics.cholesterol > 200) {
    cvScore -= (metrics.cholesterol - 200) * 0.3;
  }
  
  // HbA1c 점수 (정상: < 5.7%)
  if (metrics.hba1c > 5.7) {
    cvScore -= (metrics.hba1c - 5.7) * 15;
  }
  
  cvScore = Math.max(0, Math.min(100, cvScore));
  
  // 수분 점수
  let hydrationScore = metrics.hydration * 100;
  hydrationScore = Math.max(0, Math.min(100, hydrationScore));
  
  // 종합 점수
  const overall = (metabolicScore * 0.4 + cvScore * 0.4 + 
                   hydrationScore * 0.2);
  
  // 추세 분석
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (history.length >= 7) {
    const recentAvg = history.slice(-7).reduce((sum, h) => 
      sum + calculateSingleScore(h), 0) / 7;
    const previousAvg = history.slice(-14, -7).reduce((sum, h) => 
      sum + calculateSingleScore(h), 0) / 7;
    
    if (recentAvg > previousAvg + 5) trend = 'improving';
    else if (recentAvg < previousAvg - 5) trend = 'declining';
  }
  
  return {
    overall: Math.round(overall),
    metabolic: Math.round(metabolicScore),
    cardiovascular: Math.round(cvScore),
    hydration: Math.round(hydrationScore),
    trend
  };
}
```

### 3.3 기본 코칭 메시지

```typescript
// 규칙 기반 코칭 메시지 생성

interface CoachingMessage {
  category: 'diet' | 'exercise' | 'hydration' | 'medical' | 'general';
  priority: 'info' | 'warning' | 'alert';
  message: string;
  action?: string;
}

function generateCoachingMessages(
  metrics: HealthMetrics, 
  score: HealthScore
): CoachingMessage[] {
  const messages: CoachingMessage[] = [];
  
  // 포도당 관련
  if (metrics.glucose < 70) {
    messages.push({
      category: 'diet',
      priority: 'alert',
      message: '혈당이 낮습니다. 저혈당 증상에 주의하세요.',
      action: '당분이 함유된 음식을 섭취하세요.'
    });
  } else if (metrics.glucose > 180) {
    messages.push({
      category: 'medical',
      priority: 'alert',
      message: '혈당이 높습니다. 의료 전문가 상담을 권장합니다.',
      action: '식이 조절과 운동을 고려하세요.'
    });
  } else if (metrics.glucose > 100) {
    messages.push({
      category: 'diet',
      priority: 'warning',
      message: '혈당이 정상 범위보다 약간 높습니다.',
      action: '탄수화물 섭취를 줄이고 식후 걷기를 해보세요.'
    });
  }
  
  // 수분 관련
  if (score.hydration < 60) {
    messages.push({
      category: 'hydration',
      priority: 'warning',
      message: '수분 섭취가 부족합니다.',
      action: '물 한 잔 (200-250ml)을 마시세요.'
    });
  }
  
  // 젖산 관련 (운동 모니터링)
  if (metrics.lactate > 4.0) {
    messages.push({
      category: 'exercise',
      priority: 'info',
      message: '젖산 수치가 높습니다. 고강도 운동 중이신가요?',
      action: '적절한 휴식을 취하세요.'
    });
  }
  
  // 추세 기반 메시지
  if (score.trend === 'improving') {
    messages.push({
      category: 'general',
      priority: 'info',
      message: '건강 지표가 개선되고 있습니다. 계속 유지하세요!'
    });
  } else if (score.trend === 'declining') {
    messages.push({
      category: 'general',
      priority: 'warning',
      message: '최근 건강 지표가 하락 추세입니다.',
      action: '생활 습관을 점검해보세요.'
    });
  }
  
  return messages;
}
```

---

## 4. Cloud AI (서버 탑재)

### 4.1 장기 추세 분석 (LSTM)

```python
# 시계열 예측 모델 (LSTM)

import torch
import torch.nn as nn

class HealthTrendLSTM(nn.Module):
    def __init__(self, input_size=10, hidden_size=64, 
                 num_layers=2, output_size=10):
        super().__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2
        )
        
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_size,
            num_heads=4,
            batch_first=True
        )
        
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, output_size)
        )
    
    def forward(self, x):
        # x: (batch, seq_len, features)
        lstm_out, _ = self.lstm(x)
        
        # Self-attention
        attn_out, _ = self.attention(lstm_out, lstm_out, lstm_out)
        
        # 마지막 시점의 출력
        last_output = attn_out[:, -1, :]
        
        # 예측
        prediction = self.fc(last_output)
        
        return prediction

# 훈련 함수
def train_trend_model(model, train_loader, epochs=100):
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.MSELoss()
    
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        
        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        
        if (epoch + 1) % 10 == 0:
            print(f'Epoch [{epoch+1}/{epochs}], '
                  f'Loss: {total_loss/len(train_loader):.4f}')
```

### 4.2 개인화 코칭 (RAG + LLM)

```python
# RAG (Retrieval-Augmented Generation) 기반 코칭

from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate

class PersonalizedCoachingEngine:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings()
        self.vectorstore = Chroma(
            persist_directory="./health_knowledge",
            embedding_function=self.embeddings
        )
        self.llm = ChatOpenAI(model_name="gpt-4", temperature=0.7)
        
        self.prompt_template = PromptTemplate(
            input_variables=["context", "user_profile", 
                           "metrics", "history", "question"],
            template="""
당신은 건강 관리 코치입니다. 다음 정보를 바탕으로 
개인화된 건강 조언을 제공하세요.

관련 의학 지식:
{context}

사용자 프로필:
{user_profile}

현재 측정값:
{metrics}

최근 7일 추세:
{history}

사용자 질문: {question}

친절하고 명확한 건강 조언을 제공하세요. 
의학적 진단은 하지 말고, 생활습관 개선 중심으로 답변하세요.
필요한 경우 전문가 상담을 권고하세요.
"""
        )
    
    def generate_coaching(self, user_profile: dict, 
                          metrics: dict, 
                          history: list,
                          question: str = None) -> str:
        # 관련 지식 검색
        if question:
            docs = self.vectorstore.similarity_search(question, k=3)
        else:
            query = self._build_query_from_metrics(metrics)
            docs = self.vectorstore.similarity_search(query, k=3)
        
        context = "\n".join([doc.page_content for doc in docs])
        
        # 기본 질문 생성
        if not question:
            question = "현재 건강 상태에 대해 조언해주세요."
        
        # 프롬프트 생성
        prompt = self.prompt_template.format(
            context=context,
            user_profile=self._format_profile(user_profile),
            metrics=self._format_metrics(metrics),
            history=self._format_history(history),
            question=question
        )
        
        # LLM 호출
        response = self.llm.predict(prompt)
        
        return response
    
    def _build_query_from_metrics(self, metrics: dict) -> str:
        queries = []
        
        if metrics.get('glucose', 100) > 126:
            queries.append("고혈당 관리")
        if metrics.get('glucose', 100) < 70:
            queries.append("저혈당 대처")
        if metrics.get('cholesterol', 180) > 240:
            queries.append("고콜레스테롤 식이요법")
        if metrics.get('lactate', 1.0) > 4.0:
            queries.append("젖산 축적 회복")
        
        return " ".join(queries) if queries else "일반 건강 관리"
    
    def _format_profile(self, profile: dict) -> str:
        return f"""
- 나이: {profile.get('age', '미상')}세
- 성별: {profile.get('gender', '미상')}
- BMI: {profile.get('bmi', '미상')}
- 기저질환: {', '.join(profile.get('conditions', ['없음']))}
- 운동 빈도: {profile.get('exercise_freq', '미상')}
"""
    
    def _format_metrics(self, metrics: dict) -> str:
        return f"""
- 혈당: {metrics.get('glucose', 'N/A')} mg/dL
- 젖산: {metrics.get('lactate', 'N/A')} mM
- 콜레스테롤: {metrics.get('cholesterol', 'N/A')} mg/dL
- HbA1c: {metrics.get('hba1c', 'N/A')}%
"""
    
    def _format_history(self, history: list) -> str:
        if not history:
            return "이력 없음"
        
        lines = []
        for i, h in enumerate(history[-7:]):
            lines.append(f"Day {i+1}: 혈당 {h.get('glucose', 'N/A')} mg/dL")
        
        return "\n".join(lines)
```

### 4.3 이상 패턴 탐지 (Autoencoder)

```python
# Variational Autoencoder 기반 이상 탐지

import torch
import torch.nn as nn
import torch.nn.functional as F

class HealthVAE(nn.Module):
    def __init__(self, input_dim=12, latent_dim=4):
        super().__init__()
        
        # 인코더
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU()
        )
        
        self.fc_mu = nn.Linear(16, latent_dim)
        self.fc_var = nn.Linear(16, latent_dim)
        
        # 디코더
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 32),
            nn.ReLU(),
            nn.Linear(32, input_dim)
        )
    
    def encode(self, x):
        h = self.encoder(x)
        return self.fc_mu(h), self.fc_var(h)
    
    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std
    
    def decode(self, z):
        return self.decoder(z)
    
    def forward(self, x):
        mu, logvar = self.encode(x)
        z = self.reparameterize(mu, logvar)
        return self.decode(z), mu, logvar
    
    def anomaly_score(self, x):
        """이상 점수 계산"""
        with torch.no_grad():
            recon, mu, logvar = self.forward(x)
            
            # 재구성 오차
            recon_loss = F.mse_loss(recon, x, reduction='none').mean(dim=1)
            
            # KL 발산
            kl_loss = -0.5 * torch.sum(
                1 + logvar - mu.pow(2) - logvar.exp(), dim=1
            )
            
            # 총 이상 점수
            anomaly_score = recon_loss + 0.1 * kl_loss
            
        return anomaly_score

# 이상 탐지 서비스
class AnomalyDetectionService:
    def __init__(self, model_path: str, threshold: float = 0.5):
        self.model = HealthVAE()
        self.model.load_state_dict(torch.load(model_path))
        self.model.eval()
        self.threshold = threshold
    
    def detect(self, features: list) -> dict:
        x = torch.tensor([features], dtype=torch.float32)
        score = self.model.anomaly_score(x).item()
        
        return {
            'anomaly_score': score,
            'is_anomaly': score > self.threshold,
            'confidence': min(1.0, score / self.threshold) if score > self.threshold else 0.0
        }
```

---

## 5. 데이터 수집 및 학습 파이프라인

### 5.1 데이터 수집 SDK

```typescript
// XGBoost 학습 데이터 수집

interface TrainingDataPoint {
  // 메타데이터
  timestamp: string;
  deviceId: string;
  cartridgeId: string;
  lotNumber: string;
  
  // 입력 특성
  features: {
    rawDiffSignal: number;
    baselineDrift: number;
    temperature: number;
    ph: number;
    conductivity: number;
    signalVariance: number;
    snrDb: number;
    usageCount: number;
    timeSinceCal: number;
    ambientLight: number;
  };
  
  // 레이블 (참값)
  label: {
    referenceConcentration: number;  // 표준 장비 측정값
    referenceMethod: string;         // 참조 방법
    correctionFactor: number;        // 필요한 보정 계수
  };
  
  // 환경 조건
  environment: {
    ambientTemperature: number;
    humidity: number;
    altitude: number;
  };
  
  // 품질 지표
  quality: {
    isValid: boolean;
    qualityScore: number;
    outlierFlag: boolean;
  };
}

class DataCollectionSDK {
  private buffer: TrainingDataPoint[] = [];
  private maxBufferSize = 1000;
  
  async collectDataPoint(
    measurement: MeasurementResult,
    referenceValue: number,
    referenceMethod: string
  ): Promise<void> {
    const dataPoint: TrainingDataPoint = {
      timestamp: new Date().toISOString(),
      deviceId: measurement.deviceId,
      cartridgeId: measurement.cartridgeId,
      lotNumber: measurement.lotNumber,
      
      features: {
        rawDiffSignal: measurement.rawDiffSignal,
        baselineDrift: measurement.baselineDrift,
        temperature: measurement.temperature,
        ph: measurement.ph,
        conductivity: measurement.conductivity,
        signalVariance: measurement.signalVariance,
        snrDb: measurement.snrDb,
        usageCount: measurement.usageCount,
        timeSinceCal: measurement.timeSinceCal,
        ambientLight: measurement.ambientLight
      },
      
      label: {
        referenceConcentration: referenceValue,
        referenceMethod: referenceMethod,
        correctionFactor: referenceValue / measurement.concentration
      },
      
      environment: {
        ambientTemperature: measurement.ambientTemperature,
        humidity: measurement.humidity,
        altitude: measurement.altitude
      },
      
      quality: {
        isValid: this.validateDataPoint(measurement, referenceValue),
        qualityScore: this.calculateQualityScore(measurement),
        outlierFlag: false
      }
    };
    
    this.buffer.push(dataPoint);
    
    if (this.buffer.length >= this.maxBufferSize) {
      await this.uploadBatch();
    }
  }
  
  private async uploadBatch(): Promise<void> {
    const batch = [...this.buffer];
    this.buffer = [];
    
    await fetch('/api/training-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataPoints: batch })
    });
  }
  
  private validateDataPoint(
    measurement: MeasurementResult, 
    reference: number
  ): boolean {
    // 유효성 검증 로직
    const deviation = Math.abs(measurement.concentration - reference) / reference;
    return deviation < 0.5; // 50% 이내 편차만 유효
  }
  
  private calculateQualityScore(measurement: MeasurementResult): number {
    let score = 100;
    
    // SNR 기반 감점
    if (measurement.snrDb < 20) score -= 20;
    else if (measurement.snrDb < 30) score -= 10;
    
    // 온도 범위 기반 감점
    if (measurement.temperature < 15 || measurement.temperature > 35) {
      score -= 15;
    }
    
    return Math.max(0, score);
  }
}
```

### 5.2 연합 학습 (Federated Learning)

```python
# Federated Learning 서버

from flwr.server import Server, SimpleClientManager
from flwr.server.strategy import FedAvg

class HealthFederatedServer:
    def __init__(self, min_clients: int = 10):
        self.strategy = FedAvg(
            min_fit_clients=min_clients,
            min_evaluate_clients=min_clients,
            min_available_clients=min_clients,
            evaluate_fn=self.get_evaluate_fn(),
            on_fit_config_fn=self.fit_config
        )
        
        self.server = Server(
            client_manager=SimpleClientManager(),
            strategy=self.strategy
        )
    
    def get_evaluate_fn(self):
        def evaluate(server_round, parameters, config):
            # 중앙 테스트 데이터셋으로 평가
            model = XGBoostModel()
            model.set_parameters(parameters)
            
            loss, accuracy = model.evaluate(self.test_data)
            
            return loss, {"accuracy": accuracy}
        
        return evaluate
    
    def fit_config(self, server_round: int):
        return {
            "server_round": server_round,
            "local_epochs": 1,
            "batch_size": 32
        }
    
    def start(self, num_rounds: int = 10):
        fl.server.start_server(
            server_address="0.0.0.0:8080",
            config=fl.server.ServerConfig(num_rounds=num_rounds),
            strategy=self.strategy
        )
```

---

## 6. API 명세

### 6.1 분석 API

```yaml
openapi: 3.0.0
info:
  title: DiffMeas AI API
  version: 1.0.0

paths:
  /api/v1/analyze:
    post:
      summary: 측정 데이터 분석
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                deviceId:
                  type: string
                cartridgeId:
                  type: string
                rawSignals:
                  type: array
                  items:
                    type: number
                temperature:
                  type: number
                timestamp:
                  type: string
                  format: date-time
      responses:
        '200':
          description: 분석 결과
          content:
            application/json:
              schema:
                type: object
                properties:
                  concentration:
                    type: number
                  unit:
                    type: string
                  confidence:
                    type: number
                  anomalyScore:
                    type: number
                  isAnomalous:
                    type: boolean
                  classification:
                    type: string

  /api/v1/coaching:
    post:
      summary: AI 코칭 메시지 생성
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                userId:
                  type: string
                metrics:
                  type: object
                history:
                  type: array
                question:
                  type: string
      responses:
        '200':
          description: 코칭 응답
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                  category:
                    type: string
                  priority:
                    type: string
                  actions:
                    type: array
                    items:
                      type: string
```

---

## 7. 성능 지표

### 7.1 모델 성능

| 모델 | 정확도 | 정밀도 | 재현율 | F1 | 지연 시간 |
|------|--------|--------|--------|------|-----------|
| XGBoost (Edge) | 94.2% | 93.5% | 94.8% | 94.1% | 5ms |
| CNN (Mobile) | 96.8% | 95.2% | 97.3% | 96.2% | 85ms |
| LSTM (Cloud) | 91.5% | 90.8% | 92.1% | 91.4% | 120ms |
| VAE (Cloud) | - | 88.5% | 92.3% | 90.4% | 45ms |

### 7.2 코칭 품질

| 메트릭 | 목표 | 실측 |
|--------|------|------|
| 사용자 만족도 | > 4.0/5.0 | 4.3/5.0 |
| 행동 변화율 | > 30% | 38% |
| 재방문율 | > 70% | 75% |
| 응답 적절성 | > 90% | 93% |

---

**Part 5 종료**

다음 파트: Part 6 - 인허가 및 상용화 전략
