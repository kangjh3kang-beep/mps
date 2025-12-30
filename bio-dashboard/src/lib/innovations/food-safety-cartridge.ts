/**
 * ============================================================
 * INNOVATION #1: FOOD SAFETY CARTRIDGE SYSTEM
 * 식품 안전 카트리지 - 농약/중금속 검출
 * Proposed by: User 26 (주부) + User 18 (생화학자)
 * ============================================================
 */

// ============================================
// TYPES & INTERFACES
// ============================================

export interface FoodSample {
  id: string;
  name: string;
  category: FoodCategory;
  origin?: string;
  purchaseDate?: Date;
  imageUrl?: string;
}

export type FoodCategory = 
  | 'vegetable'   // 채소
  | 'fruit'       // 과일
  | 'grain'       // 곡물
  | 'seafood'     // 해산물
  | 'meat'        // 육류
  | 'dairy'       // 유제품
  | 'processed'   // 가공식품
  | 'water';      // 음용수

export interface PesticideResult {
  name: string;
  koreanName: string;
  detected: number;        // ppb (parts per billion)
  limit: number;           // Legal limit (ppb)
  status: 'safe' | 'warning' | 'danger';
  healthRisk: string;
}

export interface HeavyMetalResult {
  element: string;
  symbol: string;
  detected: number;        // ppb
  limit: number;           // Legal limit (ppb)
  status: 'safe' | 'warning' | 'danger';
  source: string;          // 오염 원인
}

export interface MicrobeResult {
  name: string;
  detected: boolean;
  cfu: number;             // Colony Forming Units
  limit: number;
  status: 'safe' | 'warning' | 'danger';
}

export interface FoodSafetyResult {
  id: string;
  sampleId: string;
  sample: FoodSample;
  timestamp: Date;
  overallSafetyScore: number;  // 0-100
  overallStatus: 'safe' | 'warning' | 'danger';
  
  pesticides: PesticideResult[];
  heavyMetals: HeavyMetalResult[];
  microbes: MicrobeResult[];
  
  recommendations: string[];
  alternativeProducts?: AlternativeProduct[];
}

export interface AlternativeProduct {
  name: string;
  brand: string;
  safetyScore: number;
  price: number;
  mallUrl: string;
}

// ============================================
// PESTICIDE DATABASE (주요 농약)
// ============================================

export const PESTICIDE_DATABASE: Record<string, { 
  koreanName: string; 
  limits: Record<FoodCategory, number>; 
  healthRisk: string;
}> = {
  'chlorpyrifos': {
    koreanName: '클로르피리포스',
    limits: { vegetable: 50, fruit: 100, grain: 100, seafood: 0, meat: 0, dairy: 0, processed: 50, water: 10 },
    healthRisk: '신경계 영향, 어린이 발달 장애 가능성',
  },
  'imidacloprid': {
    koreanName: '이미다클로프리드',
    limits: { vegetable: 500, fruit: 500, grain: 100, seafood: 0, meat: 0, dairy: 0, processed: 100, water: 50 },
    healthRisk: '내분비계 교란 가능성',
  },
  'carbendazim': {
    koreanName: '카벤다짐',
    limits: { vegetable: 100, fruit: 200, grain: 50, seafood: 0, meat: 0, dairy: 0, processed: 100, water: 20 },
    healthRisk: '발암 가능성, 생식 독성',
  },
  'acetamiprid': {
    koreanName: '아세타미프리드',
    limits: { vegetable: 200, fruit: 300, grain: 100, seafood: 0, meat: 0, dairy: 0, processed: 150, water: 30 },
    healthRisk: '신경계 영향',
  },
  'glyphosate': {
    koreanName: '글리포세이트',
    limits: { vegetable: 100, fruit: 100, grain: 30000, seafood: 0, meat: 0, dairy: 0, processed: 1000, water: 700 },
    healthRisk: 'WHO 발암 가능 물질 (2A등급)',
  },
};

// ============================================
// HEAVY METAL DATABASE (중금속)
// ============================================

export const HEAVY_METAL_DATABASE: Record<string, {
  symbol: string;
  limits: Record<FoodCategory, number>;
  source: string;
}> = {
  'lead': {
    symbol: 'Pb',
    limits: { vegetable: 100, fruit: 100, grain: 200, seafood: 500, meat: 100, dairy: 20, processed: 100, water: 10 },
    source: '토양 오염, 오래된 배관, 산업 폐수',
  },
  'cadmium': {
    symbol: 'Cd',
    limits: { vegetable: 50, fruit: 50, grain: 100, seafood: 500, meat: 50, dairy: 10, processed: 50, water: 3 },
    source: '비료 오염, 산업 폐수, 담배 연기',
  },
  'mercury': {
    symbol: 'Hg',
    limits: { vegetable: 10, fruit: 10, grain: 20, seafood: 500, meat: 10, dairy: 5, processed: 20, water: 1 },
    source: '해양 오염, 금광 채굴, 화력발전소',
  },
  'arsenic': {
    symbol: 'As',
    limits: { vegetable: 100, fruit: 100, grain: 200, seafood: 1000, meat: 100, dairy: 50, processed: 100, water: 10 },
    source: '지하수 오염, 제초제, 목재 방부제',
  },
  'chromium': {
    symbol: 'Cr',
    limits: { vegetable: 500, fruit: 500, grain: 1000, seafood: 1000, meat: 500, dairy: 100, processed: 500, water: 50 },
    source: '산업 폐수, 도금 공장, 염색 공장',
  },
};

// ============================================
// FOOD SAFETY ANALYZER
// ============================================

export class FoodSafetyAnalyzer {
  /**
   * Analyze food sample using electrochemical signals
   */
  async analyze(
    sample: FoodSample,
    rawSignal: number[]  // 88-dimensional CV/EIS signal
  ): Promise<FoodSafetyResult> {
    const id = `fsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Analyze pesticides
    const pesticides = this.analyzePesticides(rawSignal, sample.category);
    
    // Analyze heavy metals
    const heavyMetals = this.analyzeHeavyMetals(rawSignal, sample.category);
    
    // Analyze microbes
    const microbes = this.analyzeMicrobes(rawSignal, sample.category);
    
    // Calculate overall score
    const overallSafetyScore = this.calculateOverallScore(pesticides, heavyMetals, microbes);
    const overallStatus = overallSafetyScore >= 80 ? 'safe' : overallSafetyScore >= 50 ? 'warning' : 'danger';
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(pesticides, heavyMetals, microbes, sample);
    
    // Find alternative products if unsafe
    const alternativeProducts = overallStatus !== 'safe' 
      ? await this.findAlternatives(sample) 
      : undefined;

    return {
      id,
      sampleId: sample.id,
      sample,
      timestamp: new Date(),
      overallSafetyScore,
      overallStatus,
      pesticides,
      heavyMetals,
      microbes,
      recommendations,
      alternativeProducts,
    };
  }

  /**
   * Analyze pesticide levels from electrochemical signal
   */
  private analyzePesticides(signal: number[], category: FoodCategory): PesticideResult[] {
    const results: PesticideResult[] = [];
    
    // Simulate pesticide detection from signal peaks
    // In reality, this would use trained ML model on CV curves
    Object.entries(PESTICIDE_DATABASE).forEach(([name, data], index) => {
      const limit = data.limits[category];
      if (limit === 0) return; // Not applicable for this category
      
      // Simulate detection based on signal features
      const signalFeature = signal[index * 10] || 0;
      const detected = Math.abs(signalFeature * 100) % (limit * 2);
      
      const status = detected <= limit * 0.5 ? 'safe' : detected <= limit ? 'warning' : 'danger';
      
      results.push({
        name,
        koreanName: data.koreanName,
        detected: Math.round(detected * 10) / 10,
        limit,
        status,
        healthRisk: data.healthRisk,
      });
    });
    
    return results;
  }

  /**
   * Analyze heavy metal levels from electrochemical signal
   */
  private analyzeHeavyMetals(signal: number[], category: FoodCategory): HeavyMetalResult[] {
    const results: HeavyMetalResult[] = [];
    
    Object.entries(HEAVY_METAL_DATABASE).forEach(([element, data], index) => {
      const limit = data.limits[category];
      
      // Simulate detection using SWV peak analysis
      const signalFeature = signal[50 + index * 5] || 0;
      const detected = Math.abs(signalFeature * 50) % (limit * 1.5);
      
      const status = detected <= limit * 0.3 ? 'safe' : detected <= limit ? 'warning' : 'danger';
      
      results.push({
        element,
        symbol: data.symbol,
        detected: Math.round(detected * 10) / 10,
        limit,
        status,
        source: data.source,
      });
    });
    
    return results;
  }

  /**
   * Analyze microbial contamination
   */
  private analyzeMicrobes(signal: number[], category: FoodCategory): MicrobeResult[] {
    // Simplified microbe detection
    const microbes: { name: string; limit: number }[] = [
      { name: '대장균 (E. coli)', limit: 10 },
      { name: '살모넬라 (Salmonella)', limit: 0 },
      { name: '리스테리아 (Listeria)', limit: 0 },
    ];
    
    return microbes.map((microbe, index) => {
      const signalFeature = signal[70 + index] || 0;
      const detected = Math.abs(signalFeature) > 0.5;
      const cfu = detected ? Math.abs(Math.round(signalFeature * 100)) : 0;
      
      return {
        name: microbe.name,
        detected,
        cfu,
        limit: microbe.limit,
        status: !detected || cfu <= microbe.limit ? 'safe' : 'danger',
      };
    });
  }

  /**
   * Calculate overall safety score
   */
  private calculateOverallScore(
    pesticides: PesticideResult[],
    heavyMetals: HeavyMetalResult[],
    microbes: MicrobeResult[]
  ): number {
    let score = 100;
    
    // Deduct for pesticides
    pesticides.forEach(p => {
      if (p.status === 'warning') score -= 5;
      if (p.status === 'danger') score -= 15;
    });
    
    // Deduct for heavy metals
    heavyMetals.forEach(h => {
      if (h.status === 'warning') score -= 8;
      if (h.status === 'danger') score -= 20;
    });
    
    // Deduct for microbes
    microbes.forEach(m => {
      if (m.detected && m.status === 'danger') score -= 25;
    });
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(
    pesticides: PesticideResult[],
    heavyMetals: HeavyMetalResult[],
    microbes: MicrobeResult[],
    sample: FoodSample
  ): string[] {
    const recommendations: string[] = [];
    
    // Pesticide recommendations
    const dangerousPesticides = pesticides.filter(p => p.status === 'danger');
    if (dangerousPesticides.length > 0) {
      recommendations.push(`⚠️ ${dangerousPesticides.map(p => p.koreanName).join(', ')} 잔류 수치가 기준치를 초과했습니다. 섭취를 피하세요.`);
      recommendations.push('🧼 철저한 세척 후에도 농약 잔류가 남을 수 있습니다. 유기농 제품으로 교체를 권장합니다.');
    }
    
    // Heavy metal recommendations
    const dangerousMetals = heavyMetals.filter(h => h.status === 'danger');
    if (dangerousMetals.length > 0) {
      recommendations.push(`☢️ ${dangerousMetals.map(h => `${h.element}(${h.symbol})`).join(', ')} 수치가 위험 수준입니다.`);
      recommendations.push('🏭 해당 제품의 원산지를 확인하고, 신뢰할 수 있는 공급처로 변경하세요.');
    }
    
    // Microbe recommendations
    const detectedMicrobes = microbes.filter(m => m.detected && m.status === 'danger');
    if (detectedMicrobes.length > 0) {
      recommendations.push(`🦠 ${detectedMicrobes.map(m => m.name).join(', ')}이(가) 검출되었습니다. 즉시 폐기하세요.`);
      recommendations.push('🌡️ 식품 보관 온도를 확인하고, 유통기한을 철저히 관리하세요.');
    }
    
    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('✅ 이 식품은 안전한 것으로 판단됩니다.');
      recommendations.push('💡 신선도 유지를 위해 적정 온도에서 보관하세요.');
    }
    
    // Category-specific tips
    switch (sample.category) {
      case 'vegetable':
      case 'fruit':
        recommendations.push('🥬 채소와 과일은 흐르는 물에 30초 이상 세척 후 섭취하세요.');
        break;
      case 'seafood':
        recommendations.push('🐟 해산물은 -18°C 이하에서 보관하고, 해동 후 재냉동은 피하세요.');
        break;
      case 'meat':
        recommendations.push('🥩 육류는 내부 온도 75°C 이상으로 충분히 익혀 섭취하세요.');
        break;
    }
    
    return recommendations;
  }

  /**
   * Find alternative safe products from Manpasik Mall
   */
  private async findAlternatives(sample: FoodSample): Promise<AlternativeProduct[]> {
    // Mock alternative products from Manpasik Mall
    const alternatives: AlternativeProduct[] = [
      {
        name: `유기농 ${sample.name}`,
        brand: '만파식 프리미엄',
        safetyScore: 98,
        price: 15000,
        mallUrl: '/mall/organic-premium',
      },
      {
        name: `친환경 ${sample.name}`,
        brand: '그린팜',
        safetyScore: 95,
        price: 12000,
        mallUrl: '/mall/green-farm',
      },
      {
        name: `GAP 인증 ${sample.name}`,
        brand: '안심농장',
        safetyScore: 92,
        price: 10000,
        mallUrl: '/mall/gap-certified',
      },
    ];
    
    return alternatives;
  }
}

// Singleton instance
export const foodSafetyAnalyzer = new FoodSafetyAnalyzer();




