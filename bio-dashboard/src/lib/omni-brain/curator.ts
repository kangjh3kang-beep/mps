/**
 * The Curator - Hyper-Personalized Commerce AI
 * 
 * Bio-compatible product recommendations based on:
 * - User's unique 88-dimensional signal pattern
 * - Internal ecosystem data ONLY
 * - NOT popularity-based
 * 
 * Philosophy: "Your body knows what it needs. We help it speak."
 */

/* ============================================
 * Types
 * ============================================ */

export interface UserBioProfile {
  userId: string;
  
  // 88-dimensional feature vector (avg of recent high-quality signals)
  signalFingerprint: number[];
  
  // Derived bio-markers
  bioMarkers: {
    glucoseLevel: number;
    lactateLevel: number;
    cortisolLevel: number;
    inflammationIndex: number;
    oxidativeStress: number;
    hydrationLevel: number;
    mineralBalance: number;
    vitaminAbsorption: number;
  };
  
  // Nutrient absorption profile (unique to each user)
  absorptionProfile: {
    vitaminA: number;  // 0-1 absorption efficiency
    vitaminB: number;
    vitaminC: number;
    vitaminD: number;
    zinc: number;
    iron: number;
    magnesium: number;
    calcium: number;
    omega3: number;
    protein: number;
  };
  
  // Historical response to products
  productResponses: {
    productId: string;
    improvement: number;  // Health score delta after use
    absorptionActual: number;
    sideEffects: string[];
    lastUsed: string;
  }[];
  
  // Conditions & goals
  conditions: string[];  // ICD-10 codes
  goals: string[];       // e.g., "muscle_gain", "blood_sugar_control"
}

export interface Product {
  id: string;
  name: string;
  nameKo: string;
  category: "supplement" | "cartridge" | "meal" | "device" | "service";
  
  // Bio-compatibility data
  bioCompatibility: {
    targetBioMarkers: string[];      // Which bio-markers it affects
    requiredAbsorption: {            // Minimum absorption needed for efficacy
      nutrient: string;
      threshold: number;
    }[];
    contraindicatedConditions: string[];  // ICD-10 codes
    synergisticProducts: string[];   // Products that enhance effect
    antagonisticProducts: string[];  // Products that reduce effect
  };
  
  // Efficacy data from internal ecosystem
  internalEfficacy: {
    avgHealthScoreImprovement: number;
    effectiveSampleSize: number;
    responseRate: number;           // % of users who responded positively
    avgTimeToEffect: number;        // days
    userClusters: string[];         // Which user segments benefit most
  };
  
  // Product details
  price: number;
  stock: number;
  imageUrl: string;
  description: string;
  descriptionKo: string;
}

export interface Recommendation {
  productId: string;
  product: Product;
  
  // Bio-compatibility score (0-100)
  bioCompatibilityScore: number;
  
  // Reasoning
  reasoning: {
    primary: string;              // Main reason
    bioMarkerMatch: string[];     // Which bio-markers align
    absorptionMatch: boolean;     // User can absorb key nutrients
    clusterMatch: boolean;        // User is in responsive cluster
    synergies: string[];          // Products already using that synergize
  };
  
  // Predicted impact
  predictedImpact: {
    healthScoreDelta: number;
    confidenceInterval: [number, number];
    timeToEffect: number;         // days
    specificBenefits: string[];
  };
  
  // Personalized dosage (if applicable)
  personalizedDosage?: {
    amount: string;
    frequency: string;
    timing: string;
    withFood: boolean;
  };
  
  // Warnings
  warnings: string[];
  
  // Priority rank
  rank: number;
}

/* ============================================
 * Mock Data
 * ============================================ */

const PRODUCT_CATALOG: Product[] = [
  {
    id: "prod_zinc_chelate_001",
    name: "High-Absorption Zinc Chelate",
    nameKo: "고흡수 아연 킬레이트",
    category: "supplement",
    bioCompatibility: {
      targetBioMarkers: ["inflammationIndex", "oxidativeStress"],
      requiredAbsorption: [{ nutrient: "zinc", threshold: 0.4 }],
      contraindicatedConditions: ["E83.2"], // Zinc metabolism disorder
      synergisticProducts: ["prod_vitamin_c_001", "prod_copper_001"],
      antagonisticProducts: ["prod_iron_high_001"]
    },
    internalEfficacy: {
      avgHealthScoreImprovement: 4.2,
      effectiveSampleSize: 1247,
      responseRate: 0.78,
      avgTimeToEffect: 14,
      userClusters: ["low_zinc_absorbers", "high_inflammation"]
    },
    price: 32000,
    stock: 450,
    imageUrl: "/products/zinc-chelate.jpg",
    description: "Advanced chelated zinc for maximum bioavailability",
    descriptionKo: "최대 생체이용률을 위한 고급 킬레이트 아연"
  },
  {
    id: "prod_magnesium_glyc_002",
    name: "Magnesium Glycinate Complex",
    nameKo: "마그네슘 글리시네이트 콤플렉스",
    category: "supplement",
    bioCompatibility: {
      targetBioMarkers: ["lactateLevel", "cortisolLevel"],
      requiredAbsorption: [{ nutrient: "magnesium", threshold: 0.5 }],
      contraindicatedConditions: ["N18.6"], // End-stage renal disease
      synergisticProducts: ["prod_vitamin_b6_001"],
      antagonisticProducts: []
    },
    internalEfficacy: {
      avgHealthScoreImprovement: 5.8,
      effectiveSampleSize: 2341,
      responseRate: 0.82,
      avgTimeToEffect: 7,
      userClusters: ["high_lactate", "poor_sleep", "athletes"]
    },
    price: 28000,
    stock: 680,
    imageUrl: "/products/magnesium-glycinate.jpg",
    description: "Premium magnesium for muscle recovery and sleep",
    descriptionKo: "근육 회복과 수면을 위한 프리미엄 마그네슘"
  },
  {
    id: "prod_omega3_ultra_003",
    name: "Ultra Omega-3 EPA/DHA",
    nameKo: "울트라 오메가-3 EPA/DHA",
    category: "supplement",
    bioCompatibility: {
      targetBioMarkers: ["inflammationIndex", "oxidativeStress"],
      requiredAbsorption: [{ nutrient: "omega3", threshold: 0.6 }],
      contraindicatedConditions: ["D68.3"], // Bleeding disorders
      synergisticProducts: ["prod_vitamin_e_001"],
      antagonisticProducts: []
    },
    internalEfficacy: {
      avgHealthScoreImprovement: 6.1,
      effectiveSampleSize: 3102,
      responseRate: 0.75,
      avgTimeToEffect: 21,
      userClusters: ["high_inflammation", "cardiovascular_risk"]
    },
    price: 45000,
    stock: 320,
    imageUrl: "/products/omega3-ultra.jpg",
    description: "Pharmaceutical-grade fish oil with 90% concentration",
    descriptionKo: "90% 고농축 의약품급 어유"
  },
  {
    id: "prod_vitamin_d3_k2_004",
    name: "Vitamin D3 + K2 Synergy",
    nameKo: "비타민 D3 + K2 시너지",
    category: "supplement",
    bioCompatibility: {
      targetBioMarkers: ["mineralBalance", "inflammationIndex"],
      requiredAbsorption: [
        { nutrient: "vitaminD", threshold: 0.5 },
        { nutrient: "calcium", threshold: 0.4 }
      ],
      contraindicatedConditions: ["E55.9"], // Vitamin D deficiency (actually ok)
      synergisticProducts: ["prod_calcium_001"],
      antagonisticProducts: []
    },
    internalEfficacy: {
      avgHealthScoreImprovement: 4.5,
      effectiveSampleSize: 1890,
      responseRate: 0.71,
      avgTimeToEffect: 30,
      userClusters: ["vitamin_d_deficient", "bone_health"]
    },
    price: 35000,
    stock: 520,
    imageUrl: "/products/vitamin-d3-k2.jpg",
    description: "Optimal D3/K2 ratio for calcium utilization",
    descriptionKo: "칼슘 활용을 위한 최적의 D3/K2 비율"
  },
  {
    id: "prod_glucose_cartridge_005",
    name: "Glucose Pro Cartridge (5-pack)",
    nameKo: "글루코스 프로 카트리지 (5팩)",
    category: "cartridge",
    bioCompatibility: {
      targetBioMarkers: ["glucoseLevel"],
      requiredAbsorption: [],
      contraindicatedConditions: [],
      synergisticProducts: ["prod_cgm_service"],
      antagonisticProducts: []
    },
    internalEfficacy: {
      avgHealthScoreImprovement: 8.2,  // Awareness leads to improvement
      effectiveSampleSize: 5420,
      responseRate: 0.89,
      avgTimeToEffect: 1,
      userClusters: ["diabetic", "pre_diabetic", "glucose_monitors"]
    },
    price: 75000,
    stock: 1200,
    imageUrl: "/products/glucose-cartridge.jpg",
    description: "High-precision glucose monitoring cartridges",
    descriptionKo: "고정밀 혈당 모니터링 카트리지"
  }
];

/* ============================================
 * Curator Engine
 * ============================================ */

export class CuratorEngine {
  private products: Product[] = PRODUCT_CATALOG;

  /**
   * Generate bio-compatible recommendations
   * NOT popularity-based - based on user's unique bio-profile
   */
  generateRecommendations(
    userProfile: UserBioProfile,
    limit: number = 5
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const product of this.products) {
      const score = this.calculateBioCompatibility(userProfile, product);
      
      if (score.total > 0) {
        recommendations.push({
          productId: product.id,
          product,
          bioCompatibilityScore: score.total,
          reasoning: score.reasoning,
          predictedImpact: this.predictImpact(userProfile, product),
          personalizedDosage: this.calculatePersonalizedDosage(userProfile, product),
          warnings: this.generateWarnings(userProfile, product),
          rank: 0 // Will be set after sorting
        });
      }
    }

    // Sort by bio-compatibility score
    recommendations.sort((a, b) => b.bioCompatibilityScore - a.bioCompatibilityScore);

    // Assign ranks
    recommendations.forEach((rec, idx) => {
      rec.rank = idx + 1;
    });

    return recommendations.slice(0, limit);
  }

  /**
   * Calculate bio-compatibility score
   * This is the core algorithm - matches product to user's unique biology
   */
  private calculateBioCompatibility(
    userProfile: UserBioProfile,
    product: Product
  ): { total: number; reasoning: Recommendation["reasoning"] } {
    let score = 50; // Base score
    const reasoning: Recommendation["reasoning"] = {
      primary: "",
      bioMarkerMatch: [],
      absorptionMatch: true,
      clusterMatch: false,
      synergies: []
    };

    // 1. Check for contraindications (immediate disqualification)
    for (const condition of userProfile.conditions) {
      if (product.bioCompatibility.contraindicatedConditions.includes(condition)) {
        return { total: 0, reasoning: { ...reasoning, primary: `Contraindicated for condition ${condition}` } };
      }
    }

    // 2. Bio-marker matching (does the user need what this product provides?)
    const bioMarkers = userProfile.bioMarkers as Record<string, number>;
    for (const targetMarker of product.bioCompatibility.targetBioMarkers) {
      const userValue = bioMarkers[targetMarker];
      if (userValue !== undefined) {
        // Check if user has suboptimal levels
        const isSuboptimal = this.isSuboptimalMarker(targetMarker, userValue);
        if (isSuboptimal) {
          score += 15;
          reasoning.bioMarkerMatch.push(targetMarker);
        }
      }
    }

    // 3. Absorption matching (can the user absorb the key nutrients?)
    const absorptionProfile = userProfile.absorptionProfile as Record<string, number>;
    for (const req of product.bioCompatibility.requiredAbsorption) {
      const userAbsorption = absorptionProfile[req.nutrient];
      if (userAbsorption !== undefined && userAbsorption < req.threshold) {
        score -= 20;
        reasoning.absorptionMatch = false;
        reasoning.primary = `Low absorption of ${req.nutrient} (${Math.round(userAbsorption * 100)}%)`;
      } else if (userAbsorption && userAbsorption >= req.threshold) {
        score += 10;
      }
    }

    // 4. Cluster matching (is user in a responsive segment?)
    for (const cluster of product.internalEfficacy.userClusters) {
      if (this.userMatchesCluster(userProfile, cluster)) {
        score += 15;
        reasoning.clusterMatch = true;
        if (!reasoning.primary) {
          reasoning.primary = `You're in the ${cluster.replace(/_/g, " ")} group that responds well`;
        }
      }
    }

    // 5. Historical response (has user responded to similar products?)
    const previousResponse = userProfile.productResponses.find(r => r.productId === product.id);
    if (previousResponse) {
      if (previousResponse.improvement > 0) {
        score += 20;
        reasoning.primary = `Previously improved your health score by ${previousResponse.improvement.toFixed(1)}`;
      } else {
        score -= 15;
      }
    }

    // 6. Synergies with current products
    for (const synergy of product.bioCompatibility.synergisticProducts) {
      if (userProfile.productResponses.some(r => r.productId === synergy)) {
        score += 10;
        reasoning.synergies.push(synergy);
      }
    }

    // 7. Antagonism with current products
    for (const antagonist of product.bioCompatibility.antagonisticProducts) {
      if (userProfile.productResponses.some(r => r.productId === antagonist)) {
        score -= 15;
      }
    }

    // 8. Goal alignment
    for (const goal of userProfile.goals) {
      if (this.productSupportsGoal(product, goal)) {
        score += 10;
      }
    }

    // Normalize to 0-100
    score = Math.max(0, Math.min(100, score));

    // Set primary reasoning if not set
    if (!reasoning.primary && reasoning.bioMarkerMatch.length > 0) {
      reasoning.primary = `Targets your ${reasoning.bioMarkerMatch.join(", ")} levels`;
    } else if (!reasoning.primary) {
      reasoning.primary = "General wellness support";
    }

    return { total: score, reasoning };
  }

  private isSuboptimalMarker(marker: string, value: number): boolean {
    const optimalRanges: Record<string, [number, number]> = {
      glucoseLevel: [70, 100],
      lactateLevel: [0.5, 2.0],
      cortisolLevel: [5, 25],
      inflammationIndex: [0, 30],
      oxidativeStress: [0, 20],
      hydrationLevel: [60, 100],
      mineralBalance: [80, 100],
      vitaminAbsorption: [70, 100]
    };

    const range = optimalRanges[marker];
    if (!range) return false;
    return value < range[0] || value > range[1];
  }

  private userMatchesCluster(profile: UserBioProfile, cluster: string): boolean {
    const clusterMatchers: Record<string, (p: UserBioProfile) => boolean> = {
      low_zinc_absorbers: (p) => p.absorptionProfile.zinc < 0.4,
      high_inflammation: (p) => p.bioMarkers.inflammationIndex > 40,
      high_lactate: (p) => p.bioMarkers.lactateLevel > 3,
      poor_sleep: (p) => p.conditions.includes("G47.0"), // Insomnia
      athletes: (p) => p.goals.includes("muscle_gain"),
      diabetic: (p) => p.conditions.some(c => c.startsWith("E11")),
      pre_diabetic: (p) => p.bioMarkers.glucoseLevel > 100 && p.bioMarkers.glucoseLevel < 126,
      glucose_monitors: (p) => p.goals.includes("blood_sugar_control"),
      vitamin_d_deficient: (p) => p.absorptionProfile.vitaminD < 0.3,
      cardiovascular_risk: (p) => p.conditions.some(c => c.startsWith("I"))
    };

    const matcher = clusterMatchers[cluster];
    return matcher ? matcher(profile) : false;
  }

  private productSupportsGoal(product: Product, goal: string): boolean {
    const goalProductMap: Record<string, string[]> = {
      muscle_gain: ["prod_magnesium_glyc_002", "prod_protein_001"],
      blood_sugar_control: ["prod_glucose_cartridge_005", "prod_chromium_001"],
      stress_management: ["prod_magnesium_glyc_002", "prod_ashwagandha_001"],
      anti_inflammation: ["prod_omega3_ultra_003", "prod_curcumin_001"],
      bone_health: ["prod_vitamin_d3_k2_004", "prod_calcium_001"]
    };

    return goalProductMap[goal]?.includes(product.id) ?? false;
  }

  private predictImpact(
    profile: UserBioProfile,
    product: Product
  ): Recommendation["predictedImpact"] {
    const baseImprovement = product.internalEfficacy.avgHealthScoreImprovement;
    
    // Adjust based on absorption
    let adjustedImprovement = baseImprovement;
    const absorptionProfile = profile.absorptionProfile as Record<string, number>;
    for (const req of product.bioCompatibility.requiredAbsorption) {
      const userAbsorption = absorptionProfile[req.nutrient] ?? 0.5;
      adjustedImprovement *= (userAbsorption / req.threshold);
    }

    // Confidence interval based on sample size
    const margin = 5 / Math.sqrt(product.internalEfficacy.effectiveSampleSize / 100);

    return {
      healthScoreDelta: Math.round(adjustedImprovement * 10) / 10,
      confidenceInterval: [
        Math.round((adjustedImprovement - margin) * 10) / 10,
        Math.round((adjustedImprovement + margin) * 10) / 10
      ],
      timeToEffect: product.internalEfficacy.avgTimeToEffect,
      specificBenefits: product.bioCompatibility.targetBioMarkers.map(m => 
        `Improved ${m.replace(/([A-Z])/g, " $1").toLowerCase()}`
      )
    };
  }

  private calculatePersonalizedDosage(
    profile: UserBioProfile,
    product: Product
  ): Recommendation["personalizedDosage"] | undefined {
    if (product.category !== "supplement") return undefined;

    // Base dosage adjusted by absorption
    const absorptionProfile = profile.absorptionProfile as Record<string, number>;
    const primaryNutrient = product.bioCompatibility.requiredAbsorption[0]?.nutrient;
    const absorption = primaryNutrient ? (absorptionProfile[primaryNutrient] ?? 0.7) : 0.7;

    // Lower absorption = higher dosage needed
    const dosageMultiplier = 1 / Math.max(0.3, absorption);

    const baseDosages: Record<string, { amount: number; unit: string }> = {
      prod_zinc_chelate_001: { amount: 15, unit: "mg" },
      prod_magnesium_glyc_002: { amount: 300, unit: "mg" },
      prod_omega3_ultra_003: { amount: 1000, unit: "mg" },
      prod_vitamin_d3_k2_004: { amount: 2000, unit: "IU" }
    };

    const base = baseDosages[product.id];
    if (!base) return undefined;

    const adjustedAmount = Math.round(base.amount * dosageMultiplier);

    return {
      amount: `${adjustedAmount}${base.unit}`,
      frequency: "Once daily",
      timing: product.id.includes("magnesium") ? "Before bed" : "Morning",
      withFood: true
    };
  }

  private generateWarnings(
    profile: UserBioProfile,
    product: Product
  ): string[] {
    const warnings: string[] = [];

    // Check for low absorption
    const absorptionProfile = profile.absorptionProfile as Record<string, number>;
    for (const req of product.bioCompatibility.requiredAbsorption) {
      const userAbsorption = absorptionProfile[req.nutrient] ?? 0.5;
      if (userAbsorption < req.threshold) {
        warnings.push(`Your ${req.nutrient} absorption is below optimal (${Math.round(userAbsorption * 100)}%). Consider a chelated form or co-factors.`);
      }
    }

    // Check for antagonistic products
    for (const antagonist of product.bioCompatibility.antagonisticProducts) {
      if (profile.productResponses.some(r => r.productId === antagonist)) {
        warnings.push(`May interact with ${antagonist}. Space doses 2 hours apart.`);
      }
    }

    // Check for previous side effects
    const previousUse = profile.productResponses.find(r => r.productId === product.id);
    if (previousUse?.sideEffects.length) {
      warnings.push(`You previously reported: ${previousUse.sideEffects.join(", ")}`);
    }

    return warnings;
  }
}

/* ============================================
 * Export singleton instance
 * ============================================ */

export const curatorEngine = new CuratorEngine();






