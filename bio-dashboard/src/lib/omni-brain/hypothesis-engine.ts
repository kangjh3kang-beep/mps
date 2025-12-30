/**
 * Manpasik Hypothesis Generation Engine
 * ======================================
 * 
 * Automatically runs "Virtual Clinical Trials" on historical data
 * and proposes interventions to the admin.
 * 
 * Example Output:
 * "Admin, I found a strong correlation between 'Air Quality in Gangnam'
 *  and 'Respiratory Signal Noise' in 5,000 users.
 *  Propose pushing a 'Mask Alert' to users in that region."
 */

/* ============================================
 * Types
 * ============================================ */

export interface DataVariable {
  name: string;
  source: "signal" | "environment" | "external" | "behavioral" | "medical";
  description: string;
  unit?: string;
}

export interface Correlation {
  id: string;
  independentVar: DataVariable;
  dependentVar: DataVariable;
  
  // Statistical measures
  correlation: number;      // Pearson correlation coefficient
  pValue: number;           // Statistical significance
  rSquared: number;         // Variance explained
  sampleSize: number;
  
  // Effect size
  effectSize: "negligible" | "small" | "medium" | "large";
  direction: "positive" | "negative";
  
  // Temporal relationship
  lagDays: number;          // How many days before effect shows
  causalConfidence: number; // How confident are we this is causal
}

export interface Hypothesis {
  id: string;
  generatedAt: string;
  
  // The hypothesis statement
  statement: string;
  statementKo: string;
  
  // Supporting data
  correlations: Correlation[];
  
  // Evidence strength
  evidenceLevel: "weak" | "moderate" | "strong" | "very_strong";
  confidenceScore: number;  // 0-100
  
  // Proposed action
  proposedAction: {
    type: "alert" | "recommendation" | "product" | "study" | "feature";
    target: string;
    description: string;
    estimatedImpact: string;
    implementationCost: "low" | "medium" | "high";
  };
  
  // Review status
  status: "proposed" | "under_review" | "approved" | "rejected" | "implemented";
  reviewedBy?: string;
  reviewNotes?: string;
  implementedAt?: string;
}

export interface VirtualTrialResult {
  trialId: string;
  hypothesis: Hypothesis;
  
  // Trial parameters
  cohortSize: number;
  treatmentGroup: number;
  controlGroup: number;
  durationDays: number;
  
  // Results
  treatmentOutcome: {
    meanHealthScore: number;
    stdDev: number;
  };
  controlOutcome: {
    meanHealthScore: number;
    stdDev: number;
  };
  
  // Statistical tests
  tStatistic: number;
  pValue: number;
  effectSize: number;  // Cohen's d
  
  // Conclusion
  significantDifference: boolean;
  recommendApproval: boolean;
}

/* ============================================
 * Hypothesis Engine
 * ============================================ */

export class HypothesisEngine {
  private hypotheses: Hypothesis[] = [];
  private correlationThreshold = 0.5;
  private pValueThreshold = 0.05;
  
  /**
   * Analyze a dataset to discover correlations
   */
  analyzeCorrelations(
    signalData: Record<string, number[]>,
    externalData: Record<string, number[]>,
    metadata: {
      startDate: string;
      endDate: string;
      userCount: number;
    }
  ): Correlation[] {
    const correlations: Correlation[] = [];
    
    // Compare each signal feature with each external variable
    for (const [signalName, signalValues] of Object.entries(signalData)) {
      for (const [externalName, externalValues] of Object.entries(externalData)) {
        if (signalValues.length !== externalValues.length) continue;
        if (signalValues.length < 30) continue; // Minimum sample size
        
        // Calculate Pearson correlation
        const correlation = this.pearsonCorrelation(signalValues, externalValues);
        const pValue = this.calculatePValue(correlation, signalValues.length);
        
        if (Math.abs(correlation) >= this.correlationThreshold && pValue < this.pValueThreshold) {
          correlations.push({
            id: `corr_${signalName}_${externalName}`,
            independentVar: {
              name: externalName,
              source: "external",
              description: `External variable: ${externalName}`
            },
            dependentVar: {
              name: signalName,
              source: "signal",
              description: `Signal feature: ${signalName}`
            },
            correlation: Math.round(correlation * 1000) / 1000,
            pValue: Math.round(pValue * 10000) / 10000,
            rSquared: Math.round(correlation * correlation * 1000) / 1000,
            sampleSize: signalValues.length,
            effectSize: this.getEffectSize(correlation),
            direction: correlation > 0 ? "positive" : "negative",
            lagDays: 0,
            causalConfidence: this.estimateCausalConfidence(correlation, signalValues.length)
          });
        }
      }
    }
    
    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }
  
  /**
   * Generate hypotheses from discovered correlations
   */
  generateHypotheses(correlations: Correlation[]): Hypothesis[] {
    const newHypotheses: Hypothesis[] = [];
    
    for (const corr of correlations) {
      const hypothesis = this.correlationToHypothesis(corr);
      newHypotheses.push(hypothesis);
      this.hypotheses.push(hypothesis);
    }
    
    return newHypotheses;
  }
  
  /**
   * Run a virtual clinical trial to test a hypothesis
   */
  runVirtualTrial(
    hypothesis: Hypothesis,
    historicalData: {
      userIds: string[];
      hadIntervention: boolean[];
      healthScoresBefore: number[];
      healthScoresAfter: number[];
    }
  ): VirtualTrialResult {
    const trialId = `trial_${hypothesis.id}_${Date.now()}`;
    
    // Split into treatment and control groups
    const treatmentGroup: number[] = [];
    const controlGroup: number[] = [];
    
    for (let i = 0; i < historicalData.userIds.length; i++) {
      const delta = historicalData.healthScoresAfter[i] - historicalData.healthScoresBefore[i];
      if (historicalData.hadIntervention[i]) {
        treatmentGroup.push(delta);
      } else {
        controlGroup.push(delta);
      }
    }
    
    // Calculate statistics
    const treatmentMean = this.mean(treatmentGroup);
    const controlMean = this.mean(controlGroup);
    const treatmentStd = this.std(treatmentGroup);
    const controlStd = this.std(controlGroup);
    
    // T-test
    const pooledStd = Math.sqrt(
      ((treatmentGroup.length - 1) * treatmentStd ** 2 + (controlGroup.length - 1) * controlStd ** 2) /
      (treatmentGroup.length + controlGroup.length - 2)
    );
    const tStatistic = (treatmentMean - controlMean) / 
      (pooledStd * Math.sqrt(1 / treatmentGroup.length + 1 / controlGroup.length));
    
    // Cohen's d
    const cohenD = (treatmentMean - controlMean) / pooledStd;
    
    // P-value approximation
    const df = treatmentGroup.length + controlGroup.length - 2;
    const pValue = this.tDistributionPValue(Math.abs(tStatistic), df);
    
    return {
      trialId,
      hypothesis,
      cohortSize: historicalData.userIds.length,
      treatmentGroup: treatmentGroup.length,
      controlGroup: controlGroup.length,
      durationDays: 30, // Mock
      treatmentOutcome: {
        meanHealthScore: treatmentMean,
        stdDev: treatmentStd
      },
      controlOutcome: {
        meanHealthScore: controlMean,
        stdDev: controlStd
      },
      tStatistic: Math.round(tStatistic * 100) / 100,
      pValue: Math.round(pValue * 10000) / 10000,
      effectSize: Math.round(cohenD * 100) / 100,
      significantDifference: pValue < 0.05 && Math.abs(cohenD) > 0.2,
      recommendApproval: pValue < 0.01 && cohenD > 0.3
    };
  }
  
  /**
   * Get all pending hypotheses for review
   */
  getPendingHypotheses(): Hypothesis[] {
    return this.hypotheses.filter(h => h.status === "proposed");
  }
  
  /**
   * Approve or reject a hypothesis
   */
  reviewHypothesis(
    hypothesisId: string,
    decision: "approved" | "rejected",
    reviewedBy: string,
    notes: string
  ): Hypothesis | null {
    const hypothesis = this.hypotheses.find(h => h.id === hypothesisId);
    if (!hypothesis) return null;
    
    hypothesis.status = decision;
    hypothesis.reviewedBy = reviewedBy;
    hypothesis.reviewNotes = notes;
    
    return hypothesis;
  }
  
  /* ============================================
   * Private Helper Methods
   * ============================================ */
  
  private correlationToHypothesis(corr: Correlation): Hypothesis {
    const id = `hyp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate statement
    const direction = corr.direction === "positive" ? "increases" : "decreases";
    const statement = `When '${corr.independentVar.name}' ${direction}, '${corr.dependentVar.name}' shows a ${corr.effectSize} effect (r=${corr.correlation}).`;
    const statementKo = `'${corr.independentVar.name}'이(가) ${direction === "increases" ? "증가" : "감소"}할 때, '${corr.dependentVar.name}'에 ${corr.effectSize} 영향이 나타납니다 (r=${corr.correlation}).`;
    
    // Determine proposed action
    const proposedAction = this.generateProposedAction(corr);
    
    // Calculate evidence level
    const evidenceLevel = this.calculateEvidenceLevel(corr);
    
    return {
      id,
      generatedAt: new Date().toISOString(),
      statement,
      statementKo,
      correlations: [corr],
      evidenceLevel,
      confidenceScore: Math.round(corr.causalConfidence * 100),
      proposedAction,
      status: "proposed"
    };
  }
  
  private generateProposedAction(corr: Correlation): Hypothesis["proposedAction"] {
    const actions: Record<string, Hypothesis["proposedAction"]> = {
      air_quality: {
        type: "alert",
        target: "users_in_region",
        description: "Push 'Air Quality Alert' to users when levels exceed threshold",
        estimatedImpact: "15% reduction in respiratory signal noise",
        implementationCost: "low"
      },
      temperature: {
        type: "feature",
        target: "calibration_system",
        description: "Add dynamic temperature compensation to measurements",
        estimatedImpact: "8% improvement in measurement accuracy",
        implementationCost: "medium"
      },
      sleep_duration: {
        type: "recommendation",
        target: "ai_coach",
        description: "Incorporate sleep recommendations when patterns are suboptimal",
        estimatedImpact: "12% improvement in morning health scores",
        implementationCost: "low"
      },
      exercise_frequency: {
        type: "product",
        target: "manpasik_mall",
        description: "Bundle fitness tracking with recovery supplements",
        estimatedImpact: "20% increase in product effectiveness",
        implementationCost: "medium"
      }
    };
    
    const defaultAction: Hypothesis["proposedAction"] = {
      type: "study",
      target: "research_team",
      description: `Investigate the relationship between ${corr.independentVar.name} and ${corr.dependentVar.name}`,
      estimatedImpact: "To be determined through further analysis",
      implementationCost: "low"
    };
    
    return actions[corr.independentVar.name] || defaultAction;
  }
  
  private calculateEvidenceLevel(corr: Correlation): Hypothesis["evidenceLevel"] {
    const score = Math.abs(corr.correlation) * (1 - corr.pValue) * Math.log10(corr.sampleSize);
    
    if (score > 2) return "very_strong";
    if (score > 1) return "strong";
    if (score > 0.5) return "moderate";
    return "weak";
  }
  
  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = this.mean(x);
    const meanY = this.mean(y);
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }
    
    return numerator / (Math.sqrt(denomX * denomY) || 1);
  }
  
  private calculatePValue(r: number, n: number): number {
    // Approximate p-value for correlation coefficient
    const t = r * Math.sqrt((n - 2) / (1 - r * r + 1e-10));
    const df = n - 2;
    return this.tDistributionPValue(Math.abs(t), df);
  }
  
  private tDistributionPValue(t: number, df: number): number {
    // Approximation using the incomplete beta function
    const x = df / (df + t * t);
    return this.incompleteBeta(x, df / 2, 0.5);
  }
  
  private incompleteBeta(x: number, a: number, b: number): number {
    // Simplified approximation
    return Math.exp(-Math.abs(a * Math.log(x) + b * Math.log(1 - x)));
  }
  
  private getEffectSize(r: number): Correlation["effectSize"] {
    const absR = Math.abs(r);
    if (absR >= 0.5) return "large";
    if (absR >= 0.3) return "medium";
    if (absR >= 0.1) return "small";
    return "negligible";
  }
  
  private estimateCausalConfidence(r: number, n: number): number {
    // Higher correlation and larger sample = higher confidence
    const baseConfidence = Math.abs(r);
    const sampleBoost = Math.min(1, Math.log10(n) / 4);
    return Math.min(1, baseConfidence * (0.5 + 0.5 * sampleBoost));
  }
  
  private mean(arr: number[]): number {
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }
  
  private std(arr: number[]): number {
    const m = this.mean(arr);
    return Math.sqrt(arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length || 1));
  }
}

/* ============================================
 * Mock Data Generator
 * ============================================ */

export function generateMockAnalysisData(): {
  signalData: Record<string, number[]>;
  externalData: Record<string, number[]>;
} {
  const days = 180;
  
  // Generate signal data
  const respiratoryNoise = Array.from({ length: days }, () => 0.5 + Math.random() * 0.5);
  const glucoseVariability = Array.from({ length: days }, () => 10 + Math.random() * 20);
  const lactateBaseline = Array.from({ length: days }, () => 1.5 + Math.random() * 1.5);
  const inflammationIndex = Array.from({ length: days }, () => 20 + Math.random() * 30);
  
  // Generate external data (with some correlations)
  const airQuality = Array.from({ length: days }, (_, i) => {
    // Correlate with respiratory noise
    return 50 + respiratoryNoise[i] * 80 + Math.random() * 20 - 10;
  });
  
  const temperature = Array.from({ length: days }, () => 15 + Math.random() * 20);
  
  const sleepDuration = Array.from({ length: days }, (_, i) => {
    // Inverse correlate with lactate
    return 9 - lactateBaseline[i] * 0.5 + Math.random() * 2;
  });
  
  const exerciseFrequency = Array.from({ length: days }, () => Math.floor(Math.random() * 7));
  
  return {
    signalData: {
      respiratory_noise: respiratoryNoise,
      glucose_variability: glucoseVariability,
      lactate_baseline: lactateBaseline,
      inflammation_index: inflammationIndex
    },
    externalData: {
      air_quality: airQuality,
      temperature,
      sleep_duration: sleepDuration,
      exercise_frequency: exerciseFrequency
    }
  };
}

/* ============================================
 * Export
 * ============================================ */

export const hypothesisEngine = new HypothesisEngine();






