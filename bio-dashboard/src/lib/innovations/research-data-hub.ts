/**
 * ============================================================
 * INNOVATION #5: RESEARCH DATA HUB
 * 연구 데이터 허브 - 익명화 데이터셋 API
 * Proposed by: User 38 (AI 스타트업 CEO) + User 39 (AI 전공 학생)
 * ============================================================
 */

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ResearcherProfile {
  id: string;
  name: string;
  email: string;
  organization: string;
  organizationType: 'university' | 'hospital' | 'research_institute' | 'company' | 'government';
  country: string;
  researchField: ResearchField[];
  credentials: ResearchCredential[];
  apiKey?: string;
  tier: DataAccessTier;
  usageQuota: UsageQuota;
  ethicsApproval?: EthicsApproval;
}

export type ResearchField = 
  | 'diabetes'
  | 'cardiology'
  | 'oncology'
  | 'neurology'
  | 'immunology'
  | 'nutrition'
  | 'sports_medicine'
  | 'public_health'
  | 'bioinformatics'
  | 'machine_learning';

export interface ResearchCredential {
  type: 'phd' | 'md' | 'professor' | 'postdoc' | 'researcher' | 'student';
  institution: string;
  verifiedAt?: Date;
  expiresAt?: Date;
}

export type DataAccessTier = 
  | 'free'        // 기본 통계, 1000건/월
  | 'academic'    // 익명화 개인 데이터, 10000건/월
  | 'enterprise'  // 전체 데이터셋, 무제한
  | 'partner';    // 실시간 스트림, 공동연구

export interface UsageQuota {
  tier: DataAccessTier;
  monthlyLimit: number;
  usedThisMonth: number;
  resetDate: Date;
}

export interface EthicsApproval {
  irb: string;
  institution: string;
  approvalNumber: string;
  approvalDate: Date;
  expiryDate: Date;
  scope: string;
  documentUrl: string;
}

export interface AnonymizedDataset {
  id: string;
  name: string;
  description: string;
  category: DataCategory;
  recordCount: number;
  timeRange: {
    start: Date;
    end: Date;
  };
  features: DataFeature[];
  anonymizationLevel: 'k-anonymity' | 'l-diversity' | 'differential_privacy';
  accessTier: DataAccessTier;
  citation: string;
  downloadSize: string;
  format: 'csv' | 'json' | 'parquet' | 'hdf5';
}

export type DataCategory = 
  | 'glucose_monitoring'
  | 'lactate_analysis'
  | 'inflammation_markers'
  | 'stress_hormones'
  | 'multi_biomarker'
  | 'longitudinal_health'
  | 'intervention_outcomes';

export interface DataFeature {
  name: string;
  type: 'numeric' | 'categorical' | 'timestamp' | 'array';
  description: string;
  unit?: string;
  range?: { min: number; max: number };
  categories?: string[];
  nullable: boolean;
}

export interface DataQuery {
  datasetId: string;
  filters?: DataFilter[];
  aggregation?: AggregationType;
  groupBy?: string[];
  limit?: number;
  offset?: number;
  format?: 'json' | 'csv';
}

export interface DataFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';
  value: unknown;
}

export type AggregationType = 
  | 'count'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'stddev'
  | 'percentile';

export interface QueryResult {
  queryId: string;
  dataset: string;
  recordCount: number;
  executionTime: number; // ms
  data: Record<string, unknown>[];
  metadata: {
    anonymizationApplied: string[];
    dataQuality: number; // 0-100
    lastUpdated: Date;
  };
}

export interface DataRequest {
  id: string;
  researcherId: string;
  datasetId: string;
  purpose: string;
  methodology: string;
  ethicsApproval: EthicsApproval;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestDate: Date;
  reviewDate?: Date;
  expiryDate?: Date;
  reviewNotes?: string;
}

// ============================================
// AVAILABLE DATASETS
// ============================================

export const AVAILABLE_DATASETS: AnonymizedDataset[] = [
  {
    id: 'ds_glucose_2024',
    name: 'Continuous Glucose Monitoring Dataset 2024',
    description: '100,000명의 연속 혈당 모니터링 데이터 (평균 30일)',
    category: 'glucose_monitoring',
    recordCount: 3000000,
    timeRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31'),
    },
    features: [
      { name: 'glucose_level', type: 'numeric', description: '혈당 수치', unit: 'mg/dL', range: { min: 40, max: 400 }, nullable: false },
      { name: 'measurement_time', type: 'timestamp', description: '측정 시간', nullable: false },
      { name: 'age_group', type: 'categorical', description: '연령대', categories: ['20s', '30s', '40s', '50s', '60s+'], nullable: false },
      { name: 'bmi_category', type: 'categorical', description: 'BMI 분류', categories: ['underweight', 'normal', 'overweight', 'obese'], nullable: true },
      { name: 'meal_flag', type: 'categorical', description: '식사 여부', categories: ['fasting', 'postprandial_1h', 'postprandial_2h'], nullable: true },
    ],
    anonymizationLevel: 'k-anonymity',
    accessTier: 'academic',
    citation: 'Manpasik Research Consortium (2024). Continuous Glucose Monitoring Dataset. Manpasik Data Hub.',
    downloadSize: '2.3 GB',
    format: 'parquet',
  },
  {
    id: 'ds_lactate_athletes',
    name: 'Athletic Performance Lactate Dataset',
    description: '프로 운동선수 5,000명의 운동 중 젖산 데이터',
    category: 'lactate_analysis',
    recordCount: 500000,
    timeRange: {
      start: new Date('2023-01-01'),
      end: new Date('2024-12-31'),
    },
    features: [
      { name: 'lactate_mmol', type: 'numeric', description: '젖산 농도', unit: 'mmol/L', range: { min: 0.5, max: 25 }, nullable: false },
      { name: 'heart_rate', type: 'numeric', description: '심박수', unit: 'bpm', range: { min: 40, max: 220 }, nullable: false },
      { name: 'exercise_intensity', type: 'numeric', description: '운동 강도', unit: '%VO2max', range: { min: 0, max: 100 }, nullable: false },
      { name: 'sport_type', type: 'categorical', description: '종목', categories: ['running', 'cycling', 'swimming', 'soccer', 'basketball'], nullable: false },
      { name: 'recovery_time', type: 'numeric', description: '회복 시간', unit: 'minutes', range: { min: 0, max: 60 }, nullable: true },
    ],
    anonymizationLevel: 'differential_privacy',
    accessTier: 'academic',
    citation: 'Manpasik Sports Science Lab (2024). Athletic Lactate Performance Dataset.',
    downloadSize: '450 MB',
    format: 'parquet',
  },
  {
    id: 'ds_multi_biomarker',
    name: 'Multi-Biomarker Health Panel',
    description: '88차원 바이오마커 패널 종합 데이터셋',
    category: 'multi_biomarker',
    recordCount: 1000000,
    timeRange: {
      start: new Date('2023-06-01'),
      end: new Date('2024-12-31'),
    },
    features: [
      { name: 'biomarker_vector', type: 'array', description: '88차원 바이오마커 벡터', nullable: false },
      { name: 'health_score', type: 'numeric', description: '종합 건강 점수', range: { min: 0, max: 100 }, nullable: false },
      { name: 'chronic_conditions', type: 'categorical', description: '만성질환', categories: ['none', 'diabetes', 'hypertension', 'hyperlipidemia', 'multiple'], nullable: false },
      { name: 'intervention_type', type: 'categorical', description: '개입 유형', categories: ['none', 'diet', 'exercise', 'medication', 'supplement'], nullable: true },
      { name: 'outcome_3month', type: 'numeric', description: '3개월 후 건강 점수 변화', range: { min: -50, max: 50 }, nullable: true },
    ],
    anonymizationLevel: 'l-diversity',
    accessTier: 'enterprise',
    citation: 'Manpasik Omni-Brain Consortium (2024). Multi-Biomarker Health Panel Dataset.',
    downloadSize: '15 GB',
    format: 'hdf5',
  },
  {
    id: 'ds_public_stats',
    name: 'Public Health Statistics Summary',
    description: '익명화된 집계 통계 데이터 (무료)',
    category: 'public_health',
    recordCount: 10000,
    timeRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31'),
    },
    features: [
      { name: 'region', type: 'categorical', description: '지역 (시/도)', categories: ['서울', '경기', '부산', '인천', '기타'], nullable: false },
      { name: 'age_group', type: 'categorical', description: '연령대', categories: ['20s', '30s', '40s', '50s', '60s+'], nullable: false },
      { name: 'avg_glucose', type: 'numeric', description: '평균 혈당', unit: 'mg/dL', range: { min: 70, max: 150 }, nullable: false },
      { name: 'avg_health_score', type: 'numeric', description: '평균 건강 점수', range: { min: 0, max: 100 }, nullable: false },
      { name: 'sample_count', type: 'numeric', description: '샘플 수', nullable: false },
    ],
    anonymizationLevel: 'k-anonymity',
    accessTier: 'free',
    citation: 'Manpasik Public Health Report (2024).',
    downloadSize: '5 MB',
    format: 'csv',
  },
];

// ============================================
// RESEARCH DATA HUB CLASS
// ============================================

export class ResearchDataHub {
  private researchers: Map<string, ResearcherProfile> = new Map();
  private dataRequests: Map<string, DataRequest> = new Map();
  private queryLog: { researcherId: string; queryId: string; timestamp: Date; dataset: string }[] = [];

  /**
   * Register new researcher
   */
  async registerResearcher(
    profile: Omit<ResearcherProfile, 'id' | 'apiKey' | 'tier' | 'usageQuota'>
  ): Promise<ResearcherProfile> {
    const id = `researcher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const apiKey = this.generateApiKey();
    
    const researcher: ResearcherProfile = {
      ...profile,
      id,
      apiKey,
      tier: 'free', // Start with free tier
      usageQuota: {
        tier: 'free',
        monthlyLimit: 1000,
        usedThisMonth: 0,
        resetDate: this.getNextMonthStart(),
      },
    };

    this.researchers.set(id, researcher);
    return researcher;
  }

  /**
   * Upgrade researcher tier
   */
  upgradeTier(researcherId: string, newTier: DataAccessTier, ethicsApproval?: EthicsApproval): boolean {
    const researcher = this.researchers.get(researcherId);
    if (!researcher) return false;

    // Academic and above require ethics approval
    if ((newTier === 'academic' || newTier === 'enterprise') && !ethicsApproval) {
      return false;
    }

    const limits: Record<DataAccessTier, number> = {
      free: 1000,
      academic: 10000,
      enterprise: -1, // unlimited
      partner: -1,
    };

    researcher.tier = newTier;
    researcher.usageQuota = {
      tier: newTier,
      monthlyLimit: limits[newTier],
      usedThisMonth: 0,
      resetDate: this.getNextMonthStart(),
    };
    
    if (ethicsApproval) {
      researcher.ethicsApproval = ethicsApproval;
    }

    return true;
  }

  /**
   * List available datasets for researcher's tier
   */
  listDatasets(researcherId: string): AnonymizedDataset[] {
    const researcher = this.researchers.get(researcherId);
    if (!researcher) return [];

    const tierRank: Record<DataAccessTier, number> = {
      free: 0,
      academic: 1,
      enterprise: 2,
      partner: 3,
    };

    const userRank = tierRank[researcher.tier];
    
    return AVAILABLE_DATASETS.filter(ds => tierRank[ds.accessTier] <= userRank);
  }

  /**
   * Query dataset
   */
  async queryData(researcherId: string, query: DataQuery): Promise<QueryResult | { error: string }> {
    const researcher = this.researchers.get(researcherId);
    if (!researcher) {
      return { error: 'Researcher not found' };
    }

    // Check quota
    if (researcher.usageQuota.monthlyLimit !== -1 && 
        researcher.usageQuota.usedThisMonth >= researcher.usageQuota.monthlyLimit) {
      return { error: 'Monthly quota exceeded' };
    }

    // Check dataset access
    const dataset = AVAILABLE_DATASETS.find(ds => ds.id === query.datasetId);
    if (!dataset) {
      return { error: 'Dataset not found' };
    }

    const tierRank: Record<DataAccessTier, number> = {
      free: 0, academic: 1, enterprise: 2, partner: 3,
    };
    if (tierRank[dataset.accessTier] > tierRank[researcher.tier]) {
      return { error: 'Insufficient access tier' };
    }

    // Execute query (mock)
    const startTime = Date.now();
    const result = await this.executeQuery(dataset, query);
    const executionTime = Date.now() - startTime;

    // Update quota
    researcher.usageQuota.usedThisMonth += result.length;

    // Log query
    const queryId = `query_${Date.now()}`;
    this.queryLog.push({
      researcherId,
      queryId,
      timestamp: new Date(),
      dataset: query.datasetId,
    });

    return {
      queryId,
      dataset: dataset.name,
      recordCount: result.length,
      executionTime,
      data: result,
      metadata: {
        anonymizationApplied: [dataset.anonymizationLevel],
        dataQuality: 95,
        lastUpdated: dataset.timeRange.end,
      },
    };
  }

  /**
   * Submit data access request (for higher tiers)
   */
  submitDataRequest(
    researcherId: string,
    datasetId: string,
    purpose: string,
    methodology: string,
    ethicsApproval: EthicsApproval
  ): DataRequest {
    const request: DataRequest = {
      id: `req_${Date.now()}`,
      researcherId,
      datasetId,
      purpose,
      methodology,
      ethicsApproval,
      status: 'pending',
      requestDate: new Date(),
    };

    this.dataRequests.set(request.id, request);
    return request;
  }

  /**
   * Get API documentation
   */
  getApiDocumentation(): object {
    return {
      baseUrl: 'https://api.manpasik.com/research/v1',
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization: Bearer {api_key}',
      },
      endpoints: [
        {
          method: 'GET',
          path: '/datasets',
          description: '사용 가능한 데이터셋 목록 조회',
          response: 'Array<AnonymizedDataset>',
        },
        {
          method: 'GET',
          path: '/datasets/{id}/schema',
          description: '데이터셋 스키마 조회',
          response: 'DataFeature[]',
        },
        {
          method: 'POST',
          path: '/datasets/{id}/query',
          description: '데이터 쿼리 실행',
          body: 'DataQuery',
          response: 'QueryResult',
        },
        {
          method: 'GET',
          path: '/datasets/{id}/download',
          description: '전체 데이터셋 다운로드 (Enterprise+)',
          response: 'Binary File',
        },
        {
          method: 'GET',
          path: '/usage',
          description: '사용량 조회',
          response: 'UsageQuota',
        },
      ],
      rateLimits: {
        free: '100 requests/hour',
        academic: '1000 requests/hour',
        enterprise: '10000 requests/hour',
        partner: 'unlimited',
      },
      dataFormat: {
        timestamps: 'ISO 8601',
        encoding: 'UTF-8',
        compression: 'gzip (optional)',
      },
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'mps_';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  private getNextMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  private async executeQuery(
    dataset: AnonymizedDataset,
    query: DataQuery
  ): Promise<Record<string, unknown>[]> {
    // Mock query execution
    const limit = Math.min(query.limit || 100, 1000);
    const results: Record<string, unknown>[] = [];

    for (let i = 0; i < limit; i++) {
      const record: Record<string, unknown> = { _id: `rec_${i}` };
      
      for (const feature of dataset.features) {
        switch (feature.type) {
          case 'numeric':
            const range = feature.range || { min: 0, max: 100 };
            record[feature.name] = range.min + Math.random() * (range.max - range.min);
            break;
          case 'categorical':
            const categories = feature.categories || ['A', 'B', 'C'];
            record[feature.name] = categories[Math.floor(Math.random() * categories.length)];
            break;
          case 'timestamp':
            record[feature.name] = new Date(
              dataset.timeRange.start.getTime() + 
              Math.random() * (dataset.timeRange.end.getTime() - dataset.timeRange.start.getTime())
            ).toISOString();
            break;
          case 'array':
            record[feature.name] = Array.from({ length: 88 }, () => Math.random());
            break;
        }
      }
      
      results.push(record);
    }

    return results;
  }
}

// Singleton instance
export const researchDataHub = new ResearchDataHub();




