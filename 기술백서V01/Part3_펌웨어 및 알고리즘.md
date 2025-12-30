# 차동측정 기반 범용 분석 시스템 최종 종합 기술백서

## Part 3: 펌웨어 및 알고리즘

**문서 버전**: v1.0 FINAL
**작성일**: 2025년 12월 11일
**검증 패널**: 펌웨어 엔지니어, 풀스택 개발자, 컴퓨터물리학 박사 검증 완료

---

## 1. 펌웨어 아키텍처

### 1.1 계층 구조

```
+------------------------------------------------------------------+
|                    펌웨어 아키텍처 개요                            |
+------------------------------------------------------------------+
|                                                                    |
|  Layer 4: Application Layer                                        |
|  +----------------------------------------------------------+     |
|  | MeasurementManager | CalibrationManager | DataManager    |     |
|  | DiagnosticsEngine  | AIPredictor        | UserInterface |     |
|  +----------------------------------------------------------+     |
|                              |                                     |
|  Layer 3: Service Layer                                            |
|  +----------------------------------------------------------+     |
|  | SignalProcessor | QuantificationEngine | CommunicationSvc|     |
|  | SecurityModule  | PowerManager        | StorageService  |     |
|  +----------------------------------------------------------+     |
|                              |                                     |
|  Layer 2: Driver Layer                                             |
|  +----------------------------------------------------------+     |
|  | ADC_Driver | DAC_Driver | SPI_Driver | I2C_Driver       |     |
|  | UART_Driver| GPIO_Driver| Timer_Driver| DMA_Driver      |     |
|  +----------------------------------------------------------+     |
|                              |                                     |
|  Layer 1: HAL (Hardware Abstraction Layer)                         |
|  +----------------------------------------------------------+     |
|  | STM32F4 HAL Library | CMSIS                              |     |
|  +----------------------------------------------------------+     |
|                                                                    |
+------------------------------------------------------------------+
```

### 1.2 태스크 구조 (FreeRTOS)

```c
// 태스크 정의
#define TASK_MEASURE_PRIORITY     (osPriorityHigh)
#define TASK_SIGNAL_PRIORITY      (osPriorityAboveNormal)
#define TASK_COMM_PRIORITY        (osPriorityNormal)
#define TASK_UI_PRIORITY          (osPriorityBelowNormal)
#define TASK_IDLE_PRIORITY        (osPriorityIdle)

// 태스크 스택 크기
#define TASK_MEASURE_STACK        (512)
#define TASK_SIGNAL_STACK         (1024)
#define TASK_COMM_STACK           (512)
#define TASK_UI_STACK             (256)

// 태스크 핸들
osThreadId_t measureTaskHandle;
osThreadId_t signalTaskHandle;
osThreadId_t commTaskHandle;
osThreadId_t uiTaskHandle;

// 태스크 생성
void CreateTasks(void) {
    const osThreadAttr_t measureTask_attr = {
        .name = "MeasureTask",
        .stack_size = TASK_MEASURE_STACK * 4,
        .priority = TASK_MEASURE_PRIORITY,
    };
    measureTaskHandle = osThreadNew(MeasureTask, NULL, &measureTask_attr);
    
    // ... 기타 태스크 생성
}
```

---

## 2. 핵심 알고리즘

### 2.1 차동 신호 처리 알고리즘

```c
// 차동 신호 처리 구조체
typedef struct {
    float alpha;           // 차동 계수
    float* det_buffer;     // 감지 신호 버퍼
    float* ref_buffer;     // 참조 신호 버퍼
    float* diff_buffer;    // 차동 신호 버퍼
    uint16_t buffer_size;  // 버퍼 크기
    uint16_t sample_count; // 샘플 카운트
} DifferentialProcessor_t;

// 차동 연산 수행
float ProcessDifferentialSignal(DifferentialProcessor_t* proc, 
                                 float det_signal, 
                                 float ref_signal) {
    // 버퍼에 저장
    proc->det_buffer[proc->sample_count] = det_signal;
    proc->ref_buffer[proc->sample_count] = ref_signal;
    
    // 차동 연산: S_diff = S_det - alpha * S_ref
    float diff_signal = det_signal - proc->alpha * ref_signal;
    proc->diff_buffer[proc->sample_count] = diff_signal;
    
    proc->sample_count++;
    if (proc->sample_count >= proc->buffer_size) {
        proc->sample_count = 0;
    }
    
    return diff_signal;
}

// 적응형 알파 계수 계산
float CalculateAdaptiveAlpha(DifferentialProcessor_t* proc) {
    float cov_det_ref = 0.0f;
    float var_ref = 0.0f;
    float mean_det = 0.0f;
    float mean_ref = 0.0f;
    
    // 평균 계산
    for (int i = 0; i < proc->buffer_size; i++) {
        mean_det += proc->det_buffer[i];
        mean_ref += proc->ref_buffer[i];
    }
    mean_det /= proc->buffer_size;
    mean_ref /= proc->buffer_size;
    
    // 공분산 및 분산 계산
    for (int i = 0; i < proc->buffer_size; i++) {
        float det_dev = proc->det_buffer[i] - mean_det;
        float ref_dev = proc->ref_buffer[i] - mean_ref;
        cov_det_ref += det_dev * ref_dev;
        var_ref += ref_dev * ref_dev;
    }
    
    // 알파 계산
    if (var_ref > 0.0001f) {
        proc->alpha = cov_det_ref / var_ref;
        // 범위 제한
        if (proc->alpha < 0.9f) proc->alpha = 0.9f;
        if (proc->alpha > 1.1f) proc->alpha = 1.1f;
    }
    
    return proc->alpha;
}
```

### 2.2 칼만 필터 구현

```c
// 1D 칼만 필터 구조체
typedef struct {
    float x;      // 상태 추정치
    float P;      // 추정 오차 공분산
    float Q;      // 프로세스 노이즈 공분산
    float R;      // 측정 노이즈 공분산
    float K;      // 칼만 이득
} KalmanFilter1D_t;

// 칼만 필터 초기화
void KalmanFilter_Init(KalmanFilter1D_t* kf, 
                       float initial_x, 
                       float initial_P,
                       float Q, 
                       float R) {
    kf->x = initial_x;
    kf->P = initial_P;
    kf->Q = Q;
    kf->R = R;
}

// 칼만 필터 업데이트
float KalmanFilter_Update(KalmanFilter1D_t* kf, float measurement) {
    // 예측 단계
    // x_pred = x (상태 전이: 정적 모델)
    // P_pred = P + Q
    float P_pred = kf->P + kf->Q;
    
    // 업데이트 단계
    // K = P_pred / (P_pred + R)
    kf->K = P_pred / (P_pred + kf->R);
    
    // x = x + K * (z - x)
    kf->x = kf->x + kf->K * (measurement - kf->x);
    
    // P = (1 - K) * P_pred
    kf->P = (1.0f - kf->K) * P_pred;
    
    return kf->x;
}
```

### 2.3 SNR 및 CMRR 계산

```c
// 신호 품질 메트릭 계산
typedef struct {
    float snr_db;
    float cmrr_db;
    float noise_rms;
    float signal_mean;
} SignalQuality_t;

SignalQuality_t CalculateSignalQuality(float* signal, 
                                        float* reference,
                                        uint16_t length) {
    SignalQuality_t quality;
    
    // 신호 평균 계산
    float sum = 0.0f;
    for (int i = 0; i < length; i++) {
        sum += signal[i];
    }
    quality.signal_mean = sum / length;
    
    // 노이즈 RMS 계산 (참조 신호 기반)
    float noise_sum = 0.0f;
    for (int i = 0; i < length; i++) {
        float noise = signal[i] - quality.signal_mean;
        noise_sum += noise * noise;
    }
    quality.noise_rms = sqrtf(noise_sum / length);
    
    // SNR 계산 (dB)
    if (quality.noise_rms > 0.0001f) {
        quality.snr_db = 20.0f * log10f(fabsf(quality.signal_mean) / 
                                        quality.noise_rms);
    } else {
        quality.snr_db = 100.0f; // 최대값
    }
    
    // CMRR 계산
    float common_mode = 0.0f;
    float diff_mode = 0.0f;
    for (int i = 0; i < length; i++) {
        common_mode += (signal[i] + reference[i]) / 2.0f;
        diff_mode += (signal[i] - reference[i]) / 2.0f;
    }
    common_mode /= length;
    diff_mode /= length;
    
    if (common_mode > 0.0001f) {
        quality.cmrr_db = 20.0f * log10f(fabsf(diff_mode) / 
                                         fabsf(common_mode));
    } else {
        quality.cmrr_db = 100.0f;
    }
    
    return quality;
}
```

### 2.4 농도 정량 알고리즘

```c
// 검량선 타입
typedef enum {
    CAL_LINEAR,           // y = mx + b
    CAL_QUADRATIC,        // y = ax^2 + bx + c
    CAL_MICHAELIS_MENTEN, // y = Vmax*x / (Km + x)
    CAL_SIGMOID           // y = L / (1 + exp(-k*(x-x0)))
} CalibrationCurveType_t;

// 검량선 구조체
typedef struct {
    CalibrationCurveType_t type;
    float coefficients[4];
    float valid_min;
    float valid_max;
} CalibrationCurve_t;

// 신호를 농도로 변환
float SignalToConcentration(CalibrationCurve_t* cal, float signal) {
    float concentration = 0.0f;
    
    switch (cal->type) {
        case CAL_LINEAR:
            // signal = m * conc + b
            // conc = (signal - b) / m
            if (fabsf(cal->coefficients[0]) > 0.0001f) {
                concentration = (signal - cal->coefficients[1]) / 
                               cal->coefficients[0];
            }
            break;
            
        case CAL_QUADRATIC:
            // signal = a*conc^2 + b*conc + c
            // 근의 공식 적용
            {
                float a = cal->coefficients[0];
                float b = cal->coefficients[1];
                float c = cal->coefficients[2] - signal;
                float discriminant = b*b - 4*a*c;
                if (discriminant >= 0 && fabsf(a) > 0.0001f) {
                    concentration = (-b + sqrtf(discriminant)) / (2*a);
                }
            }
            break;
            
        case CAL_MICHAELIS_MENTEN:
            // signal = Vmax * conc / (Km + conc)
            // conc = signal * Km / (Vmax - signal)
            {
                float Vmax = cal->coefficients[0];
                float Km = cal->coefficients[1];
                if (fabsf(Vmax - signal) > 0.0001f) {
                    concentration = signal * Km / (Vmax - signal);
                }
            }
            break;
            
        case CAL_SIGMOID:
            // signal = L / (1 + exp(-k*(conc-x0)))
            // 역함수 계산
            {
                float L = cal->coefficients[0];
                float k = cal->coefficients[1];
                float x0 = cal->coefficients[2];
                if (signal > 0.0001f && signal < L - 0.0001f) {
                    concentration = x0 - logf(L/signal - 1) / k;
                }
            }
            break;
    }
    
    // 유효 범위 제한
    if (concentration < cal->valid_min) {
        concentration = cal->valid_min;
    }
    if (concentration > cal->valid_max) {
        concentration = cal->valid_max;
    }
    
    return concentration;
}
```

---

## 3. 하이브리드 보정 알고리즘

### 3.1 동적 가중치 계산

```c
// 하이브리드 보정 구조체
typedef struct {
    float w_physical;      // 물리적 측정 가중치
    float w_ai;            // AI 예측 가중치
    float w0;              // 초기 가중치 (0.95)
    float lambda;          // 노화 계수 (0.0001)
    uint32_t usage_count;  // 사용 횟수
    float temp_factor;     // 온도 보정 계수
    float snr_factor;      // SNR 기반 신뢰도
} HybridCompensator_t;

// 동적 가중치 업데이트
void UpdateDynamicWeight(HybridCompensator_t* comp, 
                         float temperature,
                         float snr_db) {
    // 기본 가중치: w = w0 * exp(-lambda * n)
    float base_weight = comp->w0 * expf(-comp->lambda * comp->usage_count);
    
    // 온도 보정 계수 (25도 기준)
    // 15-35도 범위에서 정상, 범위 밖에서 감소
    if (temperature >= 15.0f && temperature <= 35.0f) {
        comp->temp_factor = 1.0f;
    } else {
        float temp_dev = fabsf(temperature - 25.0f);
        comp->temp_factor = 1.0f - 0.02f * (temp_dev - 10.0f);
        if (comp->temp_factor < 0.5f) comp->temp_factor = 0.5f;
    }
    
    // SNR 기반 신뢰도 (30dB 이상: 1.0, 10dB 이하: 0.5)
    if (snr_db >= 30.0f) {
        comp->snr_factor = 1.0f;
    } else if (snr_db <= 10.0f) {
        comp->snr_factor = 0.5f;
    } else {
        comp->snr_factor = 0.5f + (snr_db - 10.0f) / 40.0f;
    }
    
    // 최종 가중치
    comp->w_physical = base_weight * comp->temp_factor * comp->snr_factor;
    comp->w_ai = 1.0f - comp->w_physical;
    
    // 범위 제한
    if (comp->w_physical < 0.1f) comp->w_physical = 0.1f;
    if (comp->w_physical > 0.95f) comp->w_physical = 0.95f;
    comp->w_ai = 1.0f - comp->w_physical;
}

// 하이브리드 보정 적용
float ApplyHybridCompensation(HybridCompensator_t* comp,
                               float physical_value,
                               float ai_prediction) {
    return comp->w_physical * physical_value + 
           comp->w_ai * ai_prediction;
}
```

### 3.2 XGBoost 추론 (경량화)

```c
// 경량 XGBoost 트리 구조
typedef struct {
    int16_t feature_idx;   // 분기 특성 인덱스
    float threshold;        // 분기 임계값
    int16_t left_child;    // 왼쪽 자식 (-1: 리프)
    int16_t right_child;   // 오른쪽 자식 (-1: 리프)
    float leaf_value;       // 리프 값
} TreeNode_t;

typedef struct {
    TreeNode_t* nodes;     // 노드 배열
    uint16_t node_count;   // 노드 수
} DecisionTree_t;

typedef struct {
    DecisionTree_t* trees;  // 트리 배열
    uint16_t tree_count;    // 트리 수 (100)
    float base_score;       // 기본 점수
    float learning_rate;    // 학습률 (0.1)
} XGBoostModel_t;

// 단일 트리 추론
float PredictTree(DecisionTree_t* tree, float* features) {
    int16_t node_idx = 0;
    
    while (tree->nodes[node_idx].left_child != -1) {
        TreeNode_t* node = &tree->nodes[node_idx];
        
        if (features[node->feature_idx] < node->threshold) {
            node_idx = node->left_child;
        } else {
            node_idx = node->right_child;
        }
    }
    
    return tree->nodes[node_idx].leaf_value;
}

// XGBoost 전체 추론
float XGBoostPredict(XGBoostModel_t* model, float* features) {
    float prediction = model->base_score;
    
    for (int i = 0; i < model->tree_count; i++) {
        prediction += model->learning_rate * 
                      PredictTree(&model->trees[i], features);
    }
    
    return prediction;
}
```

---

## 4. 교차반응성 센서 어레이 및 역추론

### 4.1 핑거프린트 벡터 생성

```c
// 교차반응성 센서 어레이 구조체
typedef struct {
    float fingerprint[8];  // 8채널 핑거프린트
    float normalized[8];   // 정규화된 핑거프린트
    float magnitude;       // 벡터 크기
} FingerprintVector_t;

// 핑거프린트 계산
void CalculateFingerprint(DifferentialProcessor_t* channels[8],
                          FingerprintVector_t* fp) {
    float sum_sq = 0.0f;
    
    // 각 채널의 차동 신호 평균
    for (int i = 0; i < 8; i++) {
        float sum = 0.0f;
        for (int j = 0; j < channels[i]->buffer_size; j++) {
            sum += channels[i]->diff_buffer[j];
        }
        fp->fingerprint[i] = sum / channels[i]->buffer_size;
        sum_sq += fp->fingerprint[i] * fp->fingerprint[i];
    }
    
    // 벡터 크기
    fp->magnitude = sqrtf(sum_sq);
    
    // 정규화
    if (fp->magnitude > 0.0001f) {
        for (int i = 0; i < 8; i++) {
            fp->normalized[i] = fp->fingerprint[i] / fp->magnitude;
        }
    }
}
```

### 4.2 이상 탐지 알고리즘 (Isolation Forest 간소화)

```c
// 이상 점수 계산
typedef struct {
    float threshold;        // 이상 판정 임계값
    float* normal_centroid; // 정상 중심 벡터
    float normal_radius;    // 정상 범위 반경
} AnomalyDetector_t;

// 마할라노비스 거리 기반 간소화 이상 탐지
float CalculateAnomalyScore(AnomalyDetector_t* detector,
                            FingerprintVector_t* fp) {
    // 유클리드 거리 계산 (간소화)
    float distance = 0.0f;
    
    for (int i = 0; i < 8; i++) {
        float diff = fp->normalized[i] - detector->normal_centroid[i];
        distance += diff * diff;
    }
    distance = sqrtf(distance);
    
    // 정규화된 이상 점수 (0-1)
    float score = distance / (detector->normal_radius * 3.0f);
    if (score > 1.0f) score = 1.0f;
    
    return score;
}

// 이상 판정
typedef enum {
    ANOMALY_NORMAL,
    ANOMALY_WARNING,
    ANOMALY_CRITICAL
} AnomalyLevel_t;

AnomalyLevel_t DetectAnomaly(AnomalyDetector_t* detector,
                              FingerprintVector_t* fp) {
    float score = CalculateAnomalyScore(detector, fp);
    
    if (score < 0.5f) {
        return ANOMALY_NORMAL;
    } else if (score < 0.8f) {
        return ANOMALY_WARNING;
    } else {
        return ANOMALY_CRITICAL;
    }
}
```

### 4.3 물질 클래스 분류

```c
// 물질 클래스 정의
typedef enum {
    SUBSTANCE_UNKNOWN = 0,
    SUBSTANCE_GLUCOSE,
    SUBSTANCE_LACTATE,
    SUBSTANCE_DRUG_AMPHETAMINE,
    SUBSTANCE_DRUG_GHB,
    SUBSTANCE_HEAVY_METAL,
    SUBSTANCE_PATHOGEN,
    SUBSTANCE_TOXIN,
    CLASS_COUNT
} SubstanceClass_t;

// K-NN 기반 분류기 (간소화)
typedef struct {
    float centroids[CLASS_COUNT][8];  // 각 클래스 중심
    float radius[CLASS_COUNT];        // 각 클래스 반경
} KNNClassifier_t;

SubstanceClass_t ClassifySubstance(KNNClassifier_t* classifier,
                                    FingerprintVector_t* fp) {
    float min_distance = 1e10f;
    SubstanceClass_t best_class = SUBSTANCE_UNKNOWN;
    
    for (int c = 1; c < CLASS_COUNT; c++) {
        float distance = 0.0f;
        
        for (int i = 0; i < 8; i++) {
            float diff = fp->normalized[i] - classifier->centroids[c][i];
            distance += diff * diff;
        }
        distance = sqrtf(distance);
        
        // 정규화된 거리
        float norm_dist = distance / classifier->radius[c];
        
        if (norm_dist < min_distance && norm_dist < 2.0f) {
            min_distance = norm_dist;
            best_class = (SubstanceClass_t)c;
        }
    }
    
    return best_class;
}
```

---

## 5. 다중 경로 보정 시스템

### 5.1 보정 데이터 구조

```c
// 보정 데이터 구조체
typedef struct {
    char lot_id[24];
    char cartridge_id[16];
    uint32_t manufacture_date;  // Unix timestamp
    uint32_t expiry_date;
    float alpha;
    float slope;
    float intercept;
    float temp_coeff;
    uint16_t valid_range_min;
    uint16_t valid_range_max;
    uint32_t checksum;
} CalibrationData_t;

// 보정 경로 열거형
typedef enum {
    CAL_PATH_NFC = 0,
    CAL_PATH_SCANNER,
    CAL_PATH_QR,
    CAL_PATH_CLOUD,
    CAL_PATH_OFFLINE,
    CAL_PATH_COUNT
} CalibrationPath_t;
```

### 5.2 다중 경로 보정 로직

```c
// 보정 매니저 구조체
typedef struct {
    CalibrationData_t data;
    CalibrationPath_t path_used;
    bool is_valid;
    uint8_t retry_count;
} CalibrationManager_t;

// 보정 데이터 로드 (폴백 로직)
bool LoadCalibrationData(CalibrationManager_t* mgr, 
                         const char* cartridge_id) {
    mgr->is_valid = false;
    mgr->retry_count = 0;
    
    // 경로 1: NFC (최우선)
    if (NFC_IsPresent()) {
        if (NFC_ReadCalibration(&mgr->data)) {
            if (ValidateChecksum(&mgr->data)) {
                mgr->path_used = CAL_PATH_NFC;
                mgr->is_valid = true;
                return true;
            }
        }
    }
    mgr->retry_count++;
    
    // 경로 2: 내장 스캐너
    if (Scanner_IsReady()) {
        if (Scanner_ReadCode(&mgr->data)) {
            if (ValidateChecksum(&mgr->data)) {
                mgr->path_used = CAL_PATH_SCANNER;
                mgr->is_valid = true;
                return true;
            }
        }
    }
    mgr->retry_count++;
    
    // 경로 3: QR 코드 (앱 경유)
    if (BLE_IsConnected()) {
        if (BLE_RequestQRData(&mgr->data, 5000)) { // 5초 타임아웃
            if (ValidateChecksum(&mgr->data)) {
                mgr->path_used = CAL_PATH_QR;
                mgr->is_valid = true;
                return true;
            }
        }
    }
    mgr->retry_count++;
    
    // 경로 4: 클라우드 조회
    if (WiFi_IsConnected()) {
        if (Cloud_FetchCalibration(cartridge_id, &mgr->data, 3000)) {
            if (ValidateChecksum(&mgr->data)) {
                mgr->path_used = CAL_PATH_CLOUD;
                mgr->is_valid = true;
                return true;
            }
        }
    }
    mgr->retry_count++;
    
    // 경로 5: 오프라인 범용값 (최종 폴백)
    LoadDefaultCalibration(&mgr->data);
    mgr->path_used = CAL_PATH_OFFLINE;
    mgr->is_valid = true;
    
    return true;
}
```

---

## 6. 데이터 패킷 및 보안

### 6.1 패킷 생성

```c
// 패킷 헤더 구조체
typedef struct {
    uint32_t packet_id;
    char device_id[16];
    char lot_id[24];
    char cartridge_id[16];
    uint32_t timestamp;
    uint8_t protocol_version;
    uint16_t sequence_number;
} PacketHeader_t;

// 패킷 페이로드
typedef struct {
    float raw_det_signal;
    float raw_ref_signal;
    float diff_signal;
    float concentration;
    float temperature;
    float snr_db;
    uint8_t quality_flag;
} PacketPayload_t;

// 패킷 푸터
typedef struct {
    uint8_t checksum[32];  // SHA-256
    uint8_t signature[64]; // ECDSA
    uint8_t encryption;    // 암호화 방식
} PacketFooter_t;

// 전체 패킷
typedef struct {
    PacketHeader_t header;
    PacketPayload_t payload;
    PacketFooter_t footer;
} DataPacket_t;
```

### 6.2 해시 체인 구현

```c
#include "mbedtls/sha256.h"

// 해시 체인 구조체
typedef struct {
    uint8_t prev_hash[32];
    uint8_t current_hash[32];
    uint32_t chain_length;
} HashChain_t;

// 해시 체인 업데이트
void UpdateHashChain(HashChain_t* chain, 
                     DataPacket_t* packet) {
    // 이전 해시 복사
    memcpy(chain->prev_hash, chain->current_hash, 32);
    
    // 새 해시 계산: H(prev_hash || data)
    mbedtls_sha256_context ctx;
    mbedtls_sha256_init(&ctx);
    mbedtls_sha256_starts(&ctx, 0); // SHA-256
    
    // 이전 해시 추가
    mbedtls_sha256_update(&ctx, chain->prev_hash, 32);
    
    // 패킷 데이터 추가
    mbedtls_sha256_update(&ctx, (uint8_t*)&packet->header, 
                          sizeof(PacketHeader_t));
    mbedtls_sha256_update(&ctx, (uint8_t*)&packet->payload, 
                          sizeof(PacketPayload_t));
    
    // 최종 해시 생성
    mbedtls_sha256_finish(&ctx, chain->current_hash);
    mbedtls_sha256_free(&ctx);
    
    // 패킷 푸터에 복사
    memcpy(packet->footer.checksum, chain->current_hash, 32);
    
    chain->chain_length++;
}

// 체인 무결성 검증
bool VerifyHashChain(HashChain_t* chain, 
                     DataPacket_t* packet) {
    uint8_t computed_hash[32];
    
    mbedtls_sha256_context ctx;
    mbedtls_sha256_init(&ctx);
    mbedtls_sha256_starts(&ctx, 0);
    mbedtls_sha256_update(&ctx, chain->prev_hash, 32);
    mbedtls_sha256_update(&ctx, (uint8_t*)&packet->header, 
                          sizeof(PacketHeader_t));
    mbedtls_sha256_update(&ctx, (uint8_t*)&packet->payload, 
                          sizeof(PacketPayload_t));
    mbedtls_sha256_finish(&ctx, computed_hash);
    mbedtls_sha256_free(&ctx);
    
    return memcmp(computed_hash, packet->footer.checksum, 32) == 0;
}
```

---

## 7. RFID/NFC 통신 프로토콜

### 7.1 NFC 태그 데이터 구조

```c
// NTAG216 메모리 맵 (888 bytes)
// Page 4-225 사용 가능 (888 bytes)

typedef struct {
    // Page 4-7: 헤더 (16 bytes)
    uint8_t magic[4];        // "DIFF" (매직 넘버)
    uint8_t version;         // 데이터 버전
    uint8_t type;            // 카트리지 타입
    uint16_t data_length;    // 데이터 길이
    uint32_t crc32;          // CRC32 체크섬
    uint8_t reserved[4];
    
    // Page 8-23: 보정 데이터 (64 bytes)
    char lot_id[24];
    float alpha;
    float slope;
    float intercept;
    float temp_coeff;
    uint16_t valid_min;
    uint16_t valid_max;
    uint32_t manufacture_date;
    uint32_t expiry_date;
    uint8_t cal_reserved[8];
    
    // Page 24-55: 센서 정보 (128 bytes)
    char analyte_name[32];
    char unit[16];
    uint8_t measurement_mode;
    uint8_t sensor_count;
    uint16_t measurement_time_ms;
    // ... 추가 정보
} NFCTagData_t;
```

### 7.2 NFC 읽기/쓰기

```c
// NFC 태그 읽기
bool NFC_ReadCalibration(CalibrationData_t* cal) {
    uint8_t buffer[256];
    
    // PN532 초기화
    if (!PN532_Init()) return false;
    
    // 태그 검색
    if (!PN532_DetectTag(100)) return false;
    
    // 데이터 읽기 (Page 4-55)
    for (int page = 4; page <= 55; page++) {
        if (!PN532_ReadPage(page, &buffer[(page-4)*4])) {
            return false;
        }
    }
    
    // 매직 넘버 확인
    if (memcmp(buffer, "DIFF", 4) != 0) {
        return false;
    }
    
    // CRC 검증
    NFCTagData_t* tag = (NFCTagData_t*)buffer;
    uint32_t computed_crc = CRC32_Calculate(&buffer[16], 
                                            tag->data_length);
    if (computed_crc != tag->crc32) {
        return false;
    }
    
    // 보정 데이터 복사
    memcpy(cal->lot_id, tag->lot_id, 24);
    cal->alpha = tag->alpha;
    cal->slope = tag->slope;
    cal->intercept = tag->intercept;
    cal->manufacture_date = tag->manufacture_date;
    cal->expiry_date = tag->expiry_date;
    
    return true;
}
```

---

## 8. 정숙 구간 동기화 (EHD 노이즈 회피)

### 8.1 PWM 동기화 샘플링

```c
// EHD PWM 설정
typedef struct {
    uint32_t period_us;      // PWM 주기 (us)
    uint32_t duty_percent;   // 듀티비 (%)
    uint32_t quiet_start_us; // 정숙 구간 시작
    uint32_t quiet_end_us;   // 정숙 구간 종료
} EHD_PWM_Config_t;

// 정숙 구간 샘플링
void QuietPeriodSampling(EHD_PWM_Config_t* pwm,
                         float* samples,
                         uint16_t sample_count) {
    uint16_t idx = 0;
    
    while (idx < sample_count) {
        // PWM 상승 에지 대기
        while (!TIM_PWM_RisingEdge());
        
        // 정숙 구간까지 대기
        DelayMicroseconds(pwm->quiet_start_us);
        
        // Settling time 대기 (100us)
        DelayMicroseconds(100);
        
        // ADC 샘플링 (정숙 구간 내)
        uint32_t sample_window = pwm->quiet_end_us - 
                                 pwm->quiet_start_us - 100;
        
        // 다중 샘플 평균
        float sum = 0.0f;
        int n = 0;
        uint32_t start = GetMicroseconds();
        
        while (GetMicroseconds() - start < sample_window && 
               n < 10) {
            sum += ADC_ReadVoltage();
            n++;
        }
        
        if (n > 0) {
            samples[idx++] = sum / n;
        }
    }
}
```

### 8.2 DMA 기반 연속 샘플링

```c
// DMA 버퍼
#define DMA_BUFFER_SIZE 1024
volatile uint16_t adc_dma_buffer[DMA_BUFFER_SIZE];
volatile bool dma_complete = false;

// DMA 완료 콜백
void HAL_ADC_ConvCpltCallback(ADC_HandleTypeDef* hadc) {
    dma_complete = true;
}

// DMA 기반 연속 샘플링 시작
void StartDMASampling(void) {
    dma_complete = false;
    HAL_ADC_Start_DMA(&hadc1, (uint32_t*)adc_dma_buffer, 
                      DMA_BUFFER_SIZE);
}

// 정숙 구간 데이터만 추출
void ExtractQuietSamples(float* output, uint16_t* count) {
    *count = 0;
    
    // PWM 주기에 맞춰 정숙 구간 인덱스 계산
    uint16_t pwm_samples = DMA_BUFFER_SIZE / 10; // 10 주기 가정
    uint16_t quiet_start = pwm_samples * 60 / 100; // 60% 시점
    uint16_t quiet_end = pwm_samples * 95 / 100;   // 95% 시점
    
    for (int cycle = 0; cycle < 10; cycle++) {
        uint16_t base = cycle * pwm_samples;
        
        for (uint16_t i = quiet_start; i < quiet_end; i++) {
            output[(*count)++] = adc_dma_buffer[base + i] * 
                                 3.3f / 4096.0f;
        }
    }
}
```

---

## 9. 메모리 맵 및 리소스

### 9.1 Flash 메모리 레이아웃

```
[STM32F405 Flash Memory Map (1MB)]

0x08000000 +------------------+
           | Bootloader       | 32KB (Sector 0)
0x08008000 +------------------+
           | Application      | 384KB (Sector 1-5)
0x08068000 +------------------+
           | XGBoost Model    | 256KB (Sector 6-7)
0x080A8000 +------------------+
           | Calibration DB   | 128KB (Sector 8-9)
0x080C8000 +------------------+
           | Configuration    | 64KB (Sector 10)
0x080D8000 +------------------+
           | Reserved         | 160KB (Sector 11)
0x08100000 +------------------+
```

### 9.2 RAM 사용량

```
[STM32F405 RAM Usage (192KB)]

0x20000000 +------------------+
           | Stack            | 8KB
0x20002000 +------------------+
           | Heap             | 32KB
0x2000A000 +------------------+
           | FreeRTOS         | 16KB
0x2000E000 +------------------+
           | ADC Buffers      | 32KB
0x20016000 +------------------+
           | Signal Processing| 48KB
0x20022000 +------------------+
           | Communication    | 16KB
0x20026000 +------------------+
           | General Purpose  | 40KB
0x20030000 +------------------+
```

---

**Part 3 종료**

다음 파트: Part 4 - 카트리지 설계 및 제조 시방서
