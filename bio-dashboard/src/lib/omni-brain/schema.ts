/**
 * Manpasik Omni Brain - Knowledge Graph Schema
 * Database schema for the self-evolving AI entity
 * 
 * Philosophy: "Digital Organism"
 * - Endogenous Learning: Only internal ecosystem data
 * - Biological Evolution: Grow, adapt, heal
 * - Symbiosis: AI grows as user becomes healthier
 */

/* ============================================
 * 1. SENSOR & BIO-SIGNAL DNA
 * ============================================ */

/**
 * Raw measurement from the Manpasik Reader
 * The fundamental "DNA" of the system
 */
export interface BioSignalDNA {
  id: string;
  userId: string;
  deviceId: string;
  timestamp: string;
  
  // 88-dimensional feature vector
  rawVector: number[]; // Full CV, EIS, DPV, SWV features
  
  // Signal types breakdown
  cvFeatures: number[];      // Cyclic Voltammetry (22 dims)
  eisFeatures: number[];     // Electrochemical Impedance (22 dims)
  dpvFeatures: number[];     // Differential Pulse (22 dims)
  swvFeatures: number[];     // Square Wave (22 dims)
  
  // Environmental context
  environment: {
    temperature: number;     // °C
    humidity: number;        // %
    pressure?: number;       // hPa
    altitude?: number;       // m
  };
  
  // Hardware configuration
  rafeConfig: {
    mode: string;           // LIQUID_EC, GAS_HIGH_Z, BIO_IMPEDANCE
    gain: number;
    samplingRate: number;
    electrodeConfig: string;
  };
  
  // Cartridge context
  cartridge: {
    id: string;
    type: string;
    batchId: string;
    calibrationCoefficients: number[];
    wearLevel: number;      // 0-100%
  };
  
  // Quality metrics
  signalQuality: {
    sqi: number;            // Signal Quality Index (0-100)
    snr: number;            // Signal-to-Noise Ratio
    baseline_drift: number;
    noise_level: number;
    isHighPurity: boolean;  // SQI > 80
  };
  
  // Processing state
  processingState: "raw" | "filtered" | "analyzed" | "archived";
  
  // Long-term memory eligibility
  hippocampusEligible: boolean; // Only high-purity signals
}

/**
 * Processed clinical result from bio-signal
 */
export interface ClinicalResult {
  id: string;
  bioSignalId: string;
  userId: string;
  timestamp: string;
  
  // Primary analyte
  analyte: string;          // Glucose, Lactate, Cortisol, etc.
  concentration: number;
  unit: string;
  confidenceInterval: [number, number];
  
  // Health score impact
  healthScoreContribution: number;
  trend: "improving" | "stable" | "declining";
  
  // AI interpretation
  aiInterpretation: {
    summary: string;
    riskLevel: "low" | "medium" | "high" | "critical";
    recommendations: string[];
    linkedConditions: string[];
  };
}

/* ============================================
 * 2. BEHAVIORAL & PSYCHO-DNA
 * ============================================ */

/**
 * User interaction patterns
 */
export interface BehavioralDNA {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  
  // Touch/Gesture patterns
  touchPatterns: {
    avgPressure: number;
    tapFrequency: number;
    scrollVelocity: number;
    hesitationPoints: { screen: string; durationMs: number }[];
  };
  
  // Voice analysis (if available)
  voiceAnalysis?: {
    stressLevel: number;    // 0-100
    energyLevel: number;    // 0-100
    speechRate: number;     // words per minute
    pauseFrequency: number;
  };
  
  // Response patterns
  responsePatterns: {
    avgResponseLatencyMs: number;
    decisionConfidence: number; // How quickly they decide
    backtrackFrequency: number; // How often they undo
  };
  
  // App engagement
  engagement: {
    screenTime: number;     // minutes
    featuresUsed: string[];
    abandonmentPoints: string[];
  };
}

/**
 * Lifecycle events - daily activities
 */
export interface LifecycleEvent {
  id: string;
  userId: string;
  timestamp: string;
  type: "sleep" | "meal" | "exercise" | "supplement" | "medication" | "stress" | "custom";
  
  // Event details (varies by type)
  data: {
    // Sleep
    sleepStart?: string;
    sleepEnd?: string;
    sleepQuality?: number;
    sleepStages?: { stage: string; duration: number }[];
    
    // Meal
    mealType?: "breakfast" | "lunch" | "dinner" | "snack";
    calories?: number;
    macros?: { carbs: number; protein: number; fat: number };
    glycemicLoad?: number;
    
    // Exercise
    exerciseType?: string;
    duration?: number;
    intensity?: "low" | "medium" | "high";
    caloriesBurned?: number;
    heartRateAvg?: number;
    
    // Supplement/Medication
    productId?: string;
    productName?: string;
    dosage?: string;
    source?: "purchase" | "prescription" | "manual";
  };
  
  // Correlation tracking
  correlatedBioSignals: string[]; // BioSignalDNA IDs
  expectedEffect?: string;
  observedEffect?: string;
}

/* ============================================
 * 3. MEDICAL & CLINICAL DNA
 * ============================================ */

/**
 * Medical records from hospital/telemedicine
 */
export interface MedicalDNA {
  id: string;
  userId: string;
  timestamp: string;
  source: "telemedicine" | "hospital" | "lab" | "pharmacy";
  
  // Diagnosis
  diagnosis?: {
    icd10Codes: string[];
    descriptions: string[];
    severity: "mild" | "moderate" | "severe";
    doctorId: string;
  };
  
  // Prescription
  prescription?: {
    id: string;
    medications: {
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }[];
    doctorSignature: string;
  };
  
  // Pharmacy fulfillment
  fulfillment?: {
    pharmacyId: string;
    dispensedAt: string;
    pickedUpAt?: string;
  };
  
  // Feedback loop - did it work?
  outcome?: {
    evaluatedAt: string;
    improved: boolean;
    bioSignalDelta: number; // Change in relevant sensor reading
    patientFeedback?: string;
  };
}

/* ============================================
 * 4. KNOWLEDGE GRAPH STRUCTURE
 * ============================================ */

/**
 * Knowledge Graph Node Types
 */
export type KGNodeType = 
  | "User"
  | "SignalPattern"
  | "Symptom"
  | "Condition"
  | "Biomarker"
  | "Product"
  | "Action"
  | "Outcome";

/**
 * Knowledge Graph Edge Types
 */
export type KGEdgeType =
  | "HAS_SYMPTOM"
  | "SHOWS_PATTERN"
  | "CAUSED_BY"
  | "INDICATES"
  | "TREATED_WITH"
  | "LEADS_TO"
  | "CORRELATES_WITH"
  | "PURCHASED"
  | "IMPROVED_BY";

/**
 * Knowledge Graph Node
 */
export interface KGNode {
  id: string;
  type: KGNodeType;
  label: string;
  properties: Record<string, unknown>;
  
  // Embedding for similarity search
  embedding?: number[]; // 768-dim from Transformer
  
  // Temporal info
  createdAt: string;
  updatedAt: string;
  
  // Confidence and provenance
  confidence: number;
  source: "manual" | "inferred" | "measured";
  evidenceCount: number;
}

/**
 * Knowledge Graph Edge
 */
export interface KGEdge {
  id: string;
  type: KGEdgeType;
  sourceId: string;
  targetId: string;
  
  // Edge properties
  properties: {
    weight: number;        // Strength of connection (0-1)
    frequency: number;     // How often observed
    avgLatency?: number;   // Time between cause and effect
    direction?: "positive" | "negative" | "neutral";
  };
  
  // Evidence
  evidence: {
    observationCount: number;
    firstObserved: string;
    lastObserved: string;
    sampleUserIds: string[]; // Anonymized
  };
  
  // Auto-discovery metadata
  discoveryMethod: "manual" | "correlation" | "prediction" | "reinforcement";
  discoveredAt: string;
}

/**
 * Dynamic edge creation record
 */
export interface EdgeDiscovery {
  id: string;
  timestamp: string;
  
  // Discovery details
  sourcePattern: string;   // e.g., "users who buy Product A"
  targetPattern: string;   // e.g., "see drop in Signal B"
  correlation: number;     // Statistical correlation strength
  pValue: number;          // Statistical significance
  sampleSize: number;
  
  // Created edge (if approved)
  createdEdgeId?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
}

/* ============================================
 * 5. MODEL EVOLUTION TRACKING
 * ============================================ */

/**
 * Model generation record
 */
export interface ModelGeneration {
  id: string;
  version: string;        // e.g., "v2024.01.15"
  generation: number;     // Sequential generation number
  
  // Training metadata
  training: {
    startedAt: string;
    completedAt: string;
    trainingDataRange: [string, string];
    sampleCount: number;
    epochs: number;
    finalLoss: number;
  };
  
  // Performance metrics
  metrics: {
    predictionAccuracy: number;
    f1Score: number;
    auc: number;
    mse: number;
  };
  
  // A/B test results
  abTest?: {
    startedAt: string;
    endedAt: string;
    trafficPercentage: number;
    winner: "current" | "challenger";
    improvementPercentage: number;
  };
  
  // Deployment status
  status: "training" | "testing" | "deployed" | "retired";
  deployedAt?: string;
  retiredAt?: string;
}

/**
 * Reinforcement learning event
 */
export interface RLEvent {
  id: string;
  userId: string;
  timestamp: string;
  
  // State-Action-Reward
  state: {
    healthScore: number;
    recentSignals: string[]; // Last 5 BioSignalDNA IDs
    recentActions: string[]; // Last 5 actions taken
  };
  
  action: {
    type: "recommendation" | "coaching" | "alert";
    details: string;
    productId?: string;
  };
  
  reward: {
    primary: number;       // Health score improvement
    secondary: number;     // Engagement score
    combined: number;      // Weighted combination
  };
  
  // Was this a successful intervention?
  successfulIntervention: boolean;
}

/* ============================================
 * 6. DATA LIFECYCLE (METABOLISM)
 * ============================================ */

/**
 * Data retention policy
 */
export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // days
  archiveAfter: number;    // days
  deleteAfter: number;     // days
  forgettingCurve: "exponential" | "linear" | "step";
  compressionLevel: number;
}

/**
 * Archived data record
 */
export interface ArchivedData {
  id: string;
  originalId: string;
  dataType: string;
  archivedAt: string;
  
  // Compressed summary (not full data)
  summary: {
    aggregatedMetrics: Record<string, number>;
    keyPatterns: string[];
    representativeVector?: number[]; // Compressed embedding
  };
  
  // Retrieval info
  storageLocation: string;
  retrievalCost: "low" | "medium" | "high";
}

/* ============================================
 * 7. PRISMA SCHEMA (SQL)
 * ============================================ */

export const PRISMA_SCHEMA = `
// Manpasik Omni Brain - Prisma Schema
// This schema implements the Knowledge Graph for the self-evolving AI

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// BIO-SIGNAL DNA
// ==========================================

model BioSignal {
  id              String   @id @default(cuid())
  userId          String
  deviceId        String
  timestamp       DateTime @default(now())
  
  // 88-dimensional feature vector (stored as JSON array)
  rawVector       Json     // number[]
  cvFeatures      Json     // number[]
  eisFeatures     Json     // number[]
  dpvFeatures     Json     // number[]
  swvFeatures     Json     // number[]
  
  // Environment
  temperature     Float
  humidity        Float
  pressure        Float?
  
  // RAFE Config
  rafeMode        String
  rafeGain        Float
  samplingRate    Float
  
  // Cartridge
  cartridgeId     String
  cartridgeType   String
  cartridgeBatch  String
  cartridgeWear   Float
  
  // Quality
  sqi             Float    // Signal Quality Index
  snr             Float    // Signal-to-Noise Ratio
  baselineDrift   Float
  noiseLevel      Float
  isHighPurity    Boolean
  hippocampusEligible Boolean
  
  // Processing state
  processingState String   @default("raw")
  
  // Relations
  user            User     @relation(fields: [userId], references: [id])
  clinicalResults ClinicalResult[]
  lifecycleEvents LifecycleEvent[] @relation("CorrelatedSignals")
  
  // Indexes
  @@index([userId, timestamp])
  @@index([isHighPurity])
  @@index([cartridgeBatch])
}

model ClinicalResult {
  id              String   @id @default(cuid())
  bioSignalId     String
  userId          String
  timestamp       DateTime @default(now())
  
  analyte         String
  concentration   Float
  unit            String
  confidenceLow   Float
  confidenceHigh  Float
  
  healthScoreContribution Float
  trend           String   // improving, stable, declining
  
  // AI interpretation (JSON)
  aiInterpretation Json
  
  // Relations
  bioSignal       BioSignal @relation(fields: [bioSignalId], references: [id])
  user            User      @relation(fields: [userId], references: [id])
  
  @@index([userId, analyte])
}

// ==========================================
// BEHAVIORAL DNA
// ==========================================

model BehavioralEvent {
  id              String   @id @default(cuid())
  userId          String
  sessionId       String
  timestamp       DateTime @default(now())
  
  // Patterns (JSON)
  touchPatterns   Json?
  voiceAnalysis   Json?
  responsePatterns Json?
  engagement      Json?
  
  // Relations
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId, timestamp])
}

model LifecycleEvent {
  id              String   @id @default(cuid())
  userId          String
  timestamp       DateTime @default(now())
  type            String   // sleep, meal, exercise, supplement, medication
  
  // Event data (JSON - varies by type)
  data            Json
  
  // Correlation tracking
  expectedEffect  String?
  observedEffect  String?
  
  // Relations
  user            User     @relation(fields: [userId], references: [id])
  correlatedSignals BioSignal[] @relation("CorrelatedSignals")
  
  @@index([userId, type])
}

// ==========================================
// MEDICAL DNA
// ==========================================

model MedicalRecord {
  id              String   @id @default(cuid())
  userId          String
  timestamp       DateTime @default(now())
  source          String   // telemedicine, hospital, lab, pharmacy
  
  // Diagnosis (JSON)
  diagnosis       Json?
  
  // Prescription (JSON)
  prescription    Json?
  
  // Fulfillment (JSON)
  fulfillment     Json?
  
  // Outcome feedback
  outcomeEvaluatedAt DateTime?
  outcomeImproved    Boolean?
  outcomeBioSignalDelta Float?
  outcomePatientFeedback String?
  
  // Relations
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId, source])
}

// ==========================================
// KNOWLEDGE GRAPH
// ==========================================

model KGNode {
  id              String   @id @default(cuid())
  type            String   // User, SignalPattern, Symptom, Condition, etc.
  label           String
  properties      Json
  
  // Embedding for similarity search (768-dim vector)
  embedding       Bytes?   // Stored as binary for efficiency
  
  // Metadata
  confidence      Float    @default(0.5)
  source          String   @default("inferred")
  evidenceCount   Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  outgoingEdges   KGEdge[] @relation("EdgeSource")
  incomingEdges   KGEdge[] @relation("EdgeTarget")
  
  @@index([type])
  @@index([label])
}

model KGEdge {
  id              String   @id @default(cuid())
  type            String   // HAS_SYMPTOM, CAUSED_BY, TREATED_WITH, etc.
  sourceId        String
  targetId        String
  
  // Properties
  weight          Float    @default(0.5)
  frequency       Int      @default(1)
  avgLatency      Float?   // Time between cause and effect (hours)
  direction       String?  // positive, negative, neutral
  
  // Evidence
  observationCount Int     @default(1)
  firstObserved   DateTime @default(now())
  lastObserved    DateTime @default(now())
  sampleUserIds   Json     // Anonymized user IDs
  
  // Discovery
  discoveryMethod String   @default("manual")
  discoveredAt    DateTime @default(now())
  
  // Relations
  source          KGNode   @relation("EdgeSource", fields: [sourceId], references: [id])
  target          KGNode   @relation("EdgeTarget", fields: [targetId], references: [id])
  
  @@unique([sourceId, targetId, type])
  @@index([type])
}

model EdgeDiscovery {
  id              String   @id @default(cuid())
  timestamp       DateTime @default(now())
  
  sourcePattern   String
  targetPattern   String
  correlation     Float
  pValue          Float
  sampleSize      Int
  
  createdEdgeId   String?
  status          String   @default("pending")
  reviewedBy      String?
  
  @@index([status])
}

// ==========================================
// MODEL EVOLUTION
// ==========================================

model ModelGeneration {
  id              String   @id @default(cuid())
  version         String   @unique
  generation      Int
  
  // Training
  trainingStartedAt   DateTime
  trainingCompletedAt DateTime?
  trainingDataStart   DateTime
  trainingDataEnd     DateTime
  sampleCount         Int
  epochs              Int
  finalLoss           Float?
  
  // Metrics
  predictionAccuracy  Float?
  f1Score             Float?
  auc                 Float?
  mse                 Float?
  
  // A/B Test
  abTestStartedAt     DateTime?
  abTestEndedAt       DateTime?
  abTestTrafficPct    Float?
  abTestWinner        String?
  abTestImprovement   Float?
  
  // Status
  status              String   @default("training")
  deployedAt          DateTime?
  retiredAt           DateTime?
  
  @@index([status])
}

model RLEvent {
  id              String   @id @default(cuid())
  userId          String
  timestamp       DateTime @default(now())
  
  // State-Action-Reward (JSON)
  state           Json
  action          Json
  reward          Json
  
  successfulIntervention Boolean
  
  // Relations
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId, successfulIntervention])
}

// ==========================================
// USER
// ==========================================

model User {
  id              String   @id @default(cuid())
  email           String   @unique
  name            String?
  
  // Profile embedding (for similarity matching)
  profileEmbedding Bytes?
  
  // Relations
  bioSignals      BioSignal[]
  clinicalResults ClinicalResult[]
  behavioralEvents BehavioralEvent[]
  lifecycleEvents LifecycleEvent[]
  medicalRecords  MedicalRecord[]
  rlEvents        RLEvent[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// ==========================================
// DATA LIFECYCLE
// ==========================================

model ArchivedData {
  id              String   @id @default(cuid())
  originalId      String
  dataType        String
  archivedAt      DateTime @default(now())
  
  // Compressed summary (JSON)
  summary         Json
  
  // Storage
  storageLocation String
  retrievalCost   String   @default("medium")
  
  @@index([dataType, archivedAt])
}
`;

/* ============================================
 * 8. INITIALIZATION HELPERS
 * ============================================ */

export function createSignalQualityIndex(signal: Partial<BioSignalDNA>): number {
  // Calculate SQI based on multiple factors
  const snrScore = Math.min(100, ((signal.signalQuality?.snr ?? 10) / 50) * 100);
  const driftScore = Math.max(0, 100 - (signal.signalQuality?.baseline_drift ?? 0) * 10);
  const noiseScore = Math.max(0, 100 - (signal.signalQuality?.noise_level ?? 0) * 20);
  
  // Weighted combination
  const sqi = snrScore * 0.4 + driftScore * 0.3 + noiseScore * 0.3;
  return Math.round(sqi * 100) / 100;
}

export function isHippocampusEligible(sqi: number): boolean {
  return sqi >= 80;
}

export function generateNodeEmbedding(node: Partial<KGNode>): number[] {
  // Mock embedding generation (in production, use a Transformer model)
  const embedding = new Array(768).fill(0).map(() => Math.random() * 2 - 1);
  return embedding;
}

export function calculateEdgeWeight(
  observations: number,
  correlation: number,
  recency: number // days since last observation
): number {
  const obsScore = Math.min(1, observations / 100);
  const recencyDecay = Math.exp(-recency / 30); // Decay over 30 days
  return obsScore * correlation * recencyDecay;
}






