/**
 * Manpasik Signal-Outcome Schema
 * ================================
 * 
 * Database schema for storing Raw Signal <-> Health Outcome pairs
 * for long-term training of the prediction models.
 * 
 * Philosophy: "Every single drop of sample and every electron measured
 *             contributes to the intelligence of the entire ecosystem."
 */

/* ============================================
 * 1. Raw Signal Storage
 * ============================================ */

/**
 * Complete raw signal tensor as captured by the reader
 */
export interface RawSignalRecord {
  id: string;
  userId: string;
  deviceId: string;
  cartridgeId: string;
  
  // Timestamp (high precision)
  measuredAt: string;         // ISO 8601
  measurementDurationMs: number;
  
  // === CV Curve (Cyclic Voltammetry) ===
  cvCurve: {
    voltageRange: [number, number];  // e.g., [-0.5, 0.8]
    scanRate: number;                // mV/s
    currents: number[];              // Current at each voltage step
    hysteresis: number[];            // Difference between forward/backward scan
    peakPositions: {
      oxidation: { voltage: number; current: number }[];
      reduction: { voltage: number; current: number }[];
    };
    // Extracted micro-features
    reoxidationSlope: number;
    peakSeparation: number;
    chargeTransferResistance: number;
  };
  
  // === EIS Spectrum (Electrochemical Impedance) ===
  eisSpectrum: {
    frequencyRange: [number, number];  // e.g., [100000, 0.1] Hz
    realImpedance: number[];           // Z' at each frequency
    imagImpedance: number[];           // Z'' at each frequency
    phase: number[];                   // Phase angle
    // Nyquist plot features
    solutionResistance: number;        // Rs
    chargeTransferResistance: number;  // Rct
    warburgCoefficient: number;        // Diffusion
    doubleLayerCapacitance: number;    // Cdl
  };
  
  // === SWV Response (Square Wave Voltammetry) ===
  swvResponse: {
    frequency: number;
    amplitude: number;
    stepPotential: number;
    differentialCurrents: number[];
    // Peak analysis
    peaks: {
      potential: number;
      current: number;
      fwhm: number;  // Full width at half maximum
      analyte: string;
    }[];
  };
  
  // === DPV Response (Differential Pulse Voltammetry) ===
  dpvResponse: {
    pulseAmplitude: number;
    pulsePeriod: number;
    stepPotential: number;
    differentialCurrents: number[];
    // Trace metal detection
    traceMetals: {
      metal: string;
      potential: number;
      concentration: number;
      confidence: number;
    }[];
  };
  
  // === Environmental Context ===
  environment: {
    temperature: number;      // °C (probe temperature)
    ambientTemp: number;      // °C (environment)
    humidity: number;         // %RH
    pressure: number;         // hPa
    altitude: number;         // m
    ehdVoltage: number;       // V (air suction voltage)
    airFlowRate: number;      // L/min
    lightLevel: number;       // lux (for photosensitive analytes)
  };
  
  // === Signal Quality Metrics ===
  quality: {
    sqi: number;              // Signal Quality Index (0-100)
    snr: number;              // Signal-to-Noise Ratio (dB)
    baselineDrift: number;    // mV/min
    noiseRms: number;         // RMS noise level
    sampleIntegrity: number;  // 0-100 (sample degradation indicator)
    electrodeHealth: number;  // 0-100 (electrode wear indicator)
    calibrationDelta: number; // Deviation from expected calibration
  };
  
  // === RAFE Configuration ===
  rafeConfig: {
    mode: string;             // LIQUID_EC, GAS_HIGH_Z, BIO_IMPEDANCE
    gain: number;
    inputImpedance: number;
    switchMatrix: string;     // SW1:OPEN,SW2:CLOSED,...
  };
  
  // === 88-Dimensional Feature Vector ===
  // Pre-computed features for model input
  featureVector: number[];
  
  // === Processing State ===
  processingState: "raw" | "validated" | "processed" | "archived";
  hippocampusEligible: boolean;  // Passed quality gate
}

/* ============================================
 * 2. Health Outcome Storage
 * ============================================ */

/**
 * Health outcome linked to a signal measurement
 */
export interface HealthOutcome {
  id: string;
  userId: string;
  
  // Link to the signal(s) that led to this outcome
  signalIds: string[];        // Can link multiple signals
  
  // Outcome timing
  outcomeDate: string;        // When the outcome was observed
  latencyDays: number;        // Days between signal and outcome
  
  // === Clinical Outcome ===
  clinical?: {
    diagnosisCodes: string[]; // ICD-10
    severity: "mild" | "moderate" | "severe" | "critical";
    diagnosedBy: "self_report" | "ai_detection" | "telemedicine" | "hospital";
    labValues?: {
      test: string;
      value: number;
      unit: string;
      referenceRange: [number, number];
    }[];
  };
  
  // === Measurement Outcome (Follow-up) ===
  followUpMeasurement?: {
    signalId: string;
    healthScoreDelta: number;
    biomarkerDeltas: {
      biomarker: string;
      before: number;
      after: number;
      percentChange: number;
    }[];
  };
  
  // === Intervention Outcome ===
  intervention?: {
    type: "supplement" | "medication" | "lifestyle" | "procedure";
    productId?: string;
    description: string;
    startDate: string;
    adherence: number;        // 0-100%
  };
  
  // === User-Reported Outcome ===
  userReported?: {
    symptomSeverity: number;  // 0-10
    qualityOfLife: number;    // 0-100
    energyLevel: number;      // 0-10
    sleepQuality: number;     // 0-10
    moodScore: number;        // 0-10
    painLevel: number;        // 0-10
    freeText?: string;
  };
  
  // === Outcome Classification ===
  classification: {
    isPositive: boolean;      // Did health improve?
    magnitude: "none" | "slight" | "moderate" | "significant" | "dramatic";
    attributionConfidence: number;  // How confident are we this outcome is linked to the signal?
  };
}

/* ============================================
 * 3. Signal-Outcome Training Pair
 * ============================================ */

/**
 * Training pair for the contrastive learning model
 */
export interface SignalOutcomePair {
  id: string;
  
  // The signal
  signalId: string;
  signal?: RawSignalRecord;
  
  // The outcome
  outcomeId: string;
  outcome?: HealthOutcome;
  
  // Training metadata
  pairQuality: number;        // 0-100 (how good is this training example?)
  latencyDays: number;
  
  // Contrastive learning labels
  contrastiveLabels: {
    similarSignalIds: string[];   // Signals with similar outcomes
    dissimilarSignalIds: string[]; // Signals with different outcomes
  };
  
  // Training usage
  usedInTraining: boolean;
  trainingEpochs: number[];
  lastUsedAt?: string;
}

/* ============================================
 * 4. User Genotype (DNA Risk Scores)
 * ============================================ */

/**
 * User's genetic risk profile
 */
export interface UserGenotype {
  id: string;
  userId: string;
  
  // Data source
  source: "23andme" | "ancestry" | "clinical_sequencing" | "manual";
  uploadedAt: string;
  
  // Polygenic Risk Scores (PRS)
  riskScores: {
    // Metabolic
    type2Diabetes: number;    // 0-100 percentile
    obesity: number;
    metabolicSyndrome: number;
    
    // Cardiovascular
    coronaryArteryDisease: number;
    hypertension: number;
    stroke: number;
    atrialFibrillation: number;
    
    // Neurological
    alzheimers: number;
    parkinsons: number;
    depression: number;
    
    // Cancer
    breastCancer?: number;
    prostateCancer?: number;
    colorectalCancer: number;
    lungCancer: number;
    
    // Other
    rheumatoidArthritis: number;
    asthma: number;
    chronicKidneyDisease: number;
  };
  
  // Pharmacogenomics (drug response)
  pharmacogenomics: {
    gene: string;
    variant: string;
    drugResponse: {
      drug: string;
      response: "normal" | "poor" | "ultra_rapid" | "intermediate";
    }[];
  }[];
  
  // Nutrigenomics (nutrient metabolism)
  nutrigenomics: {
    nutrient: string;
    gene: string;
    absorptionEfficiency: "low" | "normal" | "high";
    recommendation?: string;
  }[];
}

/* ============================================
 * 5. Pattern Library (Learned Patterns)
 * ============================================ */

/**
 * A learned pattern that predicts an outcome
 */
export interface LearnedPattern {
  id: string;
  patternNumber: number;      // e.g., Pattern #402
  
  // Pattern definition
  signalSignature: {
    modality: "cv" | "eis" | "swv" | "dpv" | "combined";
    featureIndices: number[]; // Which features define this pattern
    featureRanges: [number, number][]; // Expected ranges
    centroid: number[];       // Pattern centroid in feature space
  };
  
  // Associated outcome
  associatedOutcome: {
    condition: string;        // e.g., "Hypertension"
    icd10Code?: string;
    avgLatencyDays: number;   // e.g., 180 (6 months)
    probability: number;      // e.g., 0.89 (89%)
    confidenceInterval: [number, number];
  };
  
  // Evidence
  evidence: {
    observationCount: number;
    userCount: number;
    firstObserved: string;
    lastValidated: string;
    falsePositiveRate: number;
    falseNegativeRate: number;
  };
  
  // Discovery
  discoveryMethod: "manual" | "contrastive" | "clustering" | "causal_inference";
  modelGeneration: number;
}

/* ============================================
 * 6. Hypothesis (AI-Generated)
 * ============================================ */

/**
 * An automatically generated hypothesis from the AI
 */
export interface AIHypothesis {
  id: string;
  generatedAt: string;
  
  // Hypothesis statement
  hypothesis: string;
  // e.g., "Air quality in Gangnam correlates with Respiratory Signal Noise"
  
  // Variables
  independentVariable: {
    name: string;
    source: string;  // External data source
  };
  dependentVariable: {
    name: string;
    signalFeature: string;
  };
  
  // Statistical support
  statistics: {
    correlation: number;
    pValue: number;
    sampleSize: number;
    effectSize: number;
  };
  
  // Proposed action
  proposedAction: string;
  // e.g., "Push 'Mask Alert' to users in Gangnam"
  
  // Status
  status: "proposed" | "under_review" | "approved" | "rejected" | "implemented";
  reviewedBy?: string;
  reviewNotes?: string;
}

/* ============================================
 * 7. Prisma Schema (SQL)
 * ============================================ */

export const OUTCOME_PRISMA_SCHEMA = `
// Signal-Outcome Training Data Schema

model RawSignal {
  id                    String   @id @default(cuid())
  userId                String
  deviceId              String
  cartridgeId           String
  measuredAt            DateTime @default(now())
  measurementDurationMs Int
  
  // Raw curves (stored as JSON for flexibility)
  cvCurve               Json
  eisSpectrum           Json
  swvResponse           Json
  dpvResponse           Json
  environment           Json
  quality               Json
  rafeConfig            Json
  
  // 88-dim feature vector (binary for efficiency)
  featureVector         Bytes
  
  // Processing
  processingState       String   @default("raw")
  hippocampusEligible   Boolean  @default(false)
  
  // Relations
  user                  User     @relation(fields: [userId], references: [id])
  outcomes              SignalOutcomePair[]
  
  @@index([userId, measuredAt])
  @@index([hippocampusEligible])
  @@index([processingState])
}

model HealthOutcome {
  id                    String   @id @default(cuid())
  userId                String
  outcomeDate           DateTime
  latencyDays           Int
  
  // Outcome details (JSON for flexibility)
  clinical              Json?
  followUpMeasurement   Json?
  intervention          Json?
  userReported          Json?
  classification        Json
  
  // Relations
  user                  User     @relation(fields: [userId], references: [id])
  signalPairs           SignalOutcomePair[]
  
  @@index([userId, outcomeDate])
}

model SignalOutcomePair {
  id                    String   @id @default(cuid())
  signalId              String
  outcomeId             String
  pairQuality           Float
  latencyDays           Int
  
  // Contrastive labels (JSON)
  contrastiveLabels     Json
  
  // Training usage
  usedInTraining        Boolean  @default(false)
  trainingEpochs        Json     @default("[]")
  lastUsedAt            DateTime?
  
  // Relations
  signal                RawSignal     @relation(fields: [signalId], references: [id])
  outcome               HealthOutcome @relation(fields: [outcomeId], references: [id])
  
  @@index([signalId])
  @@index([outcomeId])
  @@index([usedInTraining])
}

model UserGenotype {
  id                    String   @id @default(cuid())
  userId                String   @unique
  source                String
  uploadedAt            DateTime @default(now())
  
  // Risk scores (JSON)
  riskScores            Json
  pharmacogenomics      Json     @default("[]")
  nutrigenomics         Json     @default("[]")
  
  // Relations
  user                  User     @relation(fields: [userId], references: [id])
}

model LearnedPattern {
  id                    String   @id @default(cuid())
  patternNumber         Int      @unique
  
  // Pattern definition (JSON)
  signalSignature       Json
  associatedOutcome     Json
  evidence              Json
  
  // Discovery
  discoveryMethod       String
  modelGeneration       Int
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([patternNumber])
  @@index([modelGeneration])
}

model AIHypothesis {
  id                    String   @id @default(cuid())
  generatedAt           DateTime @default(now())
  
  hypothesis            String
  independentVariable   Json
  dependentVariable     Json
  statistics            Json
  proposedAction        String
  
  status                String   @default("proposed")
  reviewedBy            String?
  reviewNotes           String?
  
  @@index([status])
  @@index([generatedAt])
}
`;

/* ============================================
 * 8. Helper Functions
 * ============================================ */

/**
 * Calculate pair quality based on various factors
 */
export function calculatePairQuality(
  signal: RawSignalRecord,
  outcome: HealthOutcome
): number {
  let quality = 50; // Base quality
  
  // Signal quality contribution
  if (signal.quality.sqi > 90) quality += 20;
  else if (signal.quality.sqi > 80) quality += 15;
  else if (signal.quality.sqi > 70) quality += 10;
  
  // SNR contribution
  if (signal.quality.snr > 40) quality += 10;
  else if (signal.quality.snr > 30) quality += 5;
  
  // Outcome clarity
  if (outcome.classification.attributionConfidence > 0.9) quality += 15;
  else if (outcome.classification.attributionConfidence > 0.7) quality += 10;
  
  // Latency penalty (too long = less reliable)
  if (outcome.classification.magnitude !== "none") {
    const latencyDays = outcome.latencyDays;
    if (latencyDays > 365) quality -= 10;
    else if (latencyDays > 180) quality -= 5;
  }
  
  return Math.max(0, Math.min(100, quality));
}

/**
 * Find similar signals for contrastive learning
 */
export function findSimilarSignals(
  targetSignal: RawSignalRecord,
  allSignals: RawSignalRecord[],
  outcomes: Map<string, HealthOutcome>,
  k: number = 5
): { similar: string[]; dissimilar: string[] } {
  const targetOutcome = outcomes.get(targetSignal.id);
  if (!targetOutcome) {
    return { similar: [], dissimilar: [] };
  }
  
  const similar: string[] = [];
  const dissimilar: string[] = [];
  
  for (const signal of allSignals) {
    if (signal.id === targetSignal.id) continue;
    
    const outcome = outcomes.get(signal.id);
    if (!outcome) continue;
    
    // Check if outcomes are similar
    const sameClassification = 
      outcome.classification.isPositive === targetOutcome.classification.isPositive;
    const sameMagnitude = 
      outcome.classification.magnitude === targetOutcome.classification.magnitude;
    
    if (sameClassification && sameMagnitude) {
      similar.push(signal.id);
    } else {
      dissimilar.push(signal.id);
    }
    
    if (similar.length >= k && dissimilar.length >= k) break;
  }
  
  return { 
    similar: similar.slice(0, k), 
    dissimilar: dissimilar.slice(0, k) 
  };
}

/**
 * Convert feature vector to binary for storage
 */
export function vectorToBytes(vector: number[]): Buffer {
  const float32Array = new Float32Array(vector);
  return Buffer.from(float32Array.buffer);
}

/**
 * Convert bytes back to feature vector
 */
export function bytesToVector(bytes: Buffer): number[] {
  const float32Array = new Float32Array(
    bytes.buffer,
    bytes.byteOffset,
    bytes.length / 4
  );
  return Array.from(float32Array);
}






