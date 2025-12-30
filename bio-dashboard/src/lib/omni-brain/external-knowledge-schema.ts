/**
 * Manpasik External Knowledge Schema
 * ====================================
 * 
 * Extends the Knowledge Graph to incorporate trusted external data.
 * 
 * Philosophy: "Trust but Verify"
 * - External data provides the "General Rule"
 * - Internal data provides the "Personal Exception"
 */

/* ============================================
 * 1. External Factor Nodes
 * ============================================ */

export type ExternalFactorType = 
  | "weather"
  | "air_quality"
  | "epidemic"
  | "outbreak"
  | "research"
  | "metabolite"
  | "chemical"
  | "guideline"
  | "news";

export type TrustLevel = 
  | "government"      // FDA, CDC, WHO - Trust Score: 0.95-1.0
  | "peer_reviewed"   // PubMed, Nature - Trust Score: 0.85-0.95
  | "institutional"   // Universities - Trust Score: 0.75-0.85
  | "corporate"       // Company data - Trust Score: 0.60-0.75
  | "unverified";     // Needs validation - Trust Score: < 0.60

/**
 * External Factor Node in Knowledge Graph
 */
export interface ExternalFactorNode {
  id: string;
  type: "ExternalFactor";
  subtype: ExternalFactorType;
  
  // Source information
  source: {
    domain: string;           // e.g., "cdc.gov"
    url: string;
    trustLevel: TrustLevel;
    trustScore: number;       // 0.0 - 1.0
    lastVerified: string;
    verificationMethod: "api" | "scrape" | "manual" | "auto";
  };
  
  // Content
  label: string;
  description: string;
  value: unknown;
  unit?: string;
  
  // Temporal validity
  validFrom: string;
  validUntil?: string;
  updateFrequency: "realtime" | "hourly" | "daily" | "weekly" | "monthly";
  
  // Geographic scope
  geographicScope: {
    type: "global" | "country" | "region" | "city" | "coordinates";
    value: string | { lat: number; lon: number; radius?: number };
  };
  
  // Internal correlation
  correlatedBiomarkers: {
    biomarker: string;
    correlationCoefficient: number;
    correlationType: "positive" | "negative" | "complex";
    lagDays: number;          // How many days before effect shows
  }[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  fetchedAt: string;
}

/**
 * Biomarker Node (Internal)
 */
export interface BiomarkerNode {
  id: string;
  type: "Biomarker";
  
  // Identification
  name: string;
  synonyms: string[];
  hmdbId?: string;           // Human Metabolome Database ID
  pubchemId?: string;        // PubChem ID
  
  // Signal characteristics
  signalCharacteristics: {
    technique: "CV" | "EIS" | "SWV" | "DPV";
    peakPosition: number;    // Voltage or frequency
    expectedRange: [number, number];
    unit: string;
  }[];
  
  // Clinical significance
  clinicalSignificance: {
    conditions: string[];    // Related conditions
    normalRange: [number, number];
    criticalLow?: number;
    criticalHigh?: number;
  };
  
  // External influences
  externalInfluences: {
    factorId: string;
    effectDirection: "increase" | "decrease" | "modify";
    effectMagnitude: number; // 0-1
  }[];
  
  createdAt: string;
  updatedAt: string;
}

/* ============================================
 * 2. Relationship Types
 * ============================================ */

export type ExternalRelationType =
  | "AFFECTS"                // External Factor → Biomarker
  | "MODULATES"              // External Factor → Measurement Quality
  | "VALIDATES"              // External Factor → Internal Assessment
  | "CONTRADICTS"            // External Factor vs Internal Assessment
  | "AUGMENTS"               // External Knowledge → AI Response
  | "PREDICTS"               // External Trend → Future State
  | "CALIBRATES";            // External Standard → Sensor Reading

/**
 * Relationship between External Factor and Internal Node
 */
export interface ExternalRelationship {
  id: string;
  type: ExternalRelationType;
  
  // Nodes
  sourceId: string;          // External Factor ID
  targetId: string;          // Internal Node ID (Biomarker, User, Measurement)
  
  // Relationship properties
  properties: {
    weight: number;          // Strength (0-1)
    direction: "positive" | "negative" | "neutral";
    confidence: number;      // How confident (0-1)
    mechanism?: string;      // Scientific explanation
    evidence: {
      type: "statistical" | "causal" | "theoretical";
      source: string;
      citation?: string;
    }[];
  };
  
  // Temporal properties
  isActive: boolean;
  activatedAt?: string;
  deactivatedAt?: string;
  
  // Validation
  crossValidated: boolean;
  internalValidationResult?: {
    validated: boolean;
    conflictResolution?: "trust_internal" | "trust_external" | "flag_review";
    notes: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

/* ============================================
 * 3. Trust Score Algorithm
 * ============================================ */

export interface TrustScoreInput {
  // Source characteristics
  sourceDomain: string;
  sourceType: TrustLevel;
  isWhitelisted: boolean;
  
  // Data characteristics
  hasTimestamp: boolean;
  dataAge: number;           // Hours since publication
  hasGeographicScope: boolean;
  
  // Validation status
  hasBeenCrossValidated: boolean;
  crossValidationResult?: boolean;
  conflictCount: number;
  
  // Historical performance
  historicalAccuracy?: number;  // Past predictions vs actual
  citationCount?: number;       // For research papers
}

export interface TrustScoreResult {
  score: number;             // 0.0 - 1.0
  components: {
    sourceCredibility: number;
    dataFreshness: number;
    geographicRelevance: number;
    validationBonus: number;
    historicalAccuracy: number;
  };
  recommendation: "accept" | "accept_with_caution" | "require_validation" | "reject";
  explanation: string;
}

/**
 * Calculate Trust Score for external data
 */
export function calculateTrustScore(input: TrustScoreInput): TrustScoreResult {
  const components = {
    sourceCredibility: 0,
    dataFreshness: 0,
    geographicRelevance: 0,
    validationBonus: 0,
    historicalAccuracy: 0
  };
  
  // 1. Source Credibility (40% weight)
  const credibilityScores: Record<TrustLevel, number> = {
    government: 0.98,
    peer_reviewed: 0.90,
    institutional: 0.80,
    corporate: 0.65,
    unverified: 0.30
  };
  components.sourceCredibility = credibilityScores[input.sourceType];
  
  // Bonus for whitelisted sources
  if (input.isWhitelisted) {
    components.sourceCredibility = Math.min(1, components.sourceCredibility + 0.05);
  }
  
  // 2. Data Freshness (20% weight)
  if (input.hasTimestamp) {
    if (input.dataAge < 1) components.dataFreshness = 1.0;        // < 1 hour
    else if (input.dataAge < 24) components.dataFreshness = 0.9;  // < 1 day
    else if (input.dataAge < 168) components.dataFreshness = 0.7; // < 1 week
    else if (input.dataAge < 720) components.dataFreshness = 0.5; // < 1 month
    else components.dataFreshness = 0.3;
  } else {
    components.dataFreshness = 0.4; // Unknown age
  }
  
  // 3. Geographic Relevance (15% weight)
  components.geographicRelevance = input.hasGeographicScope ? 0.9 : 0.5;
  
  // 4. Validation Bonus (15% weight)
  if (input.hasBeenCrossValidated) {
    components.validationBonus = input.crossValidationResult ? 1.0 : 0.2;
  } else {
    components.validationBonus = 0.5;
  }
  
  // Penalty for conflicts
  components.validationBonus -= Math.min(0.3, input.conflictCount * 0.1);
  components.validationBonus = Math.max(0, components.validationBonus);
  
  // 5. Historical Accuracy (10% weight)
  if (input.historicalAccuracy !== undefined) {
    components.historicalAccuracy = input.historicalAccuracy;
  } else {
    components.historicalAccuracy = 0.7; // Default
  }
  
  // Calculate weighted score
  const weights = {
    sourceCredibility: 0.40,
    dataFreshness: 0.20,
    geographicRelevance: 0.15,
    validationBonus: 0.15,
    historicalAccuracy: 0.10
  };
  
  const score = 
    components.sourceCredibility * weights.sourceCredibility +
    components.dataFreshness * weights.dataFreshness +
    components.geographicRelevance * weights.geographicRelevance +
    components.validationBonus * weights.validationBonus +
    components.historicalAccuracy * weights.historicalAccuracy;
  
  // Determine recommendation
  let recommendation: TrustScoreResult["recommendation"];
  let explanation: string;
  
  if (score >= 0.85) {
    recommendation = "accept";
    explanation = "High trust score. Data can be used directly.";
  } else if (score >= 0.70) {
    recommendation = "accept_with_caution";
    explanation = "Moderate trust. Use but flag for periodic review.";
  } else if (score >= 0.50) {
    recommendation = "require_validation";
    explanation = "Low trust. Requires cross-validation with internal data.";
  } else {
    recommendation = "reject";
    explanation = "Very low trust. Do not ingest into the system.";
  }
  
  return { score, components, recommendation, explanation };
}

/* ============================================
 * 4. Conflict Resolution
 * ============================================ */

export interface ConflictResolutionInput {
  externalAssessment: {
    risk: "low" | "medium" | "high";
    value: number;
    source: string;
    trustScore: number;
  };
  internalAssessment: {
    risk: "low" | "medium" | "high";
    value: number;
    confidence: number;
  };
}

export interface ConflictResolutionResult {
  hasConflict: boolean;
  resolution: "trust_internal" | "trust_external" | "combined" | "flag_review";
  finalAssessment: {
    risk: "low" | "medium" | "high";
    value: number;
    confidence: number;
  };
  explanation: string;
  userMessage: string;
}

/**
 * Resolve conflicts between external and internal data.
 * Policy: Internal Data is King.
 */
export function resolveConflict(input: ConflictResolutionInput): ConflictResolutionResult {
  const ext = input.externalAssessment;
  const int = input.internalAssessment;
  
  // Determine if there's a conflict
  const riskLevels = { low: 0, medium: 1, high: 2 };
  const riskDelta = Math.abs(riskLevels[ext.risk] - riskLevels[int.risk]);
  const hasConflict = riskDelta >= 1;
  
  if (!hasConflict) {
    // No conflict - use internal with external as validation
    return {
      hasConflict: false,
      resolution: "combined",
      finalAssessment: {
        risk: int.risk,
        value: int.value,
        confidence: Math.min(1, int.confidence + 0.1) // Boost confidence
      },
      explanation: "Internal and external assessments agree.",
      userMessage: "Your measurement is consistent with regional data."
    };
  }
  
  // Conflict detected - apply "Internal is King" policy
  if (int.confidence >= 0.7) {
    // High confidence internal - trust it
    return {
      hasConflict: true,
      resolution: "trust_internal",
      finalAssessment: {
        risk: int.risk,
        value: int.value,
        confidence: int.confidence
      },
      explanation: `Conflict: External (${ext.source}) says ${ext.risk} risk, Internal says ${int.risk} risk. Trusting internal sensor (confidence: ${(int.confidence * 100).toFixed(0)}%).`,
      userMessage: int.risk === "high" 
        ? `Despite ${ext.risk} regional trends, YOUR specific sample shows elevated markers. Personal precaution recommended.`
        : `Regional data shows ${ext.risk} risk, but YOUR measurements indicate ${int.risk} risk. Continue normal activity.`
    };
  }
  
  // Low confidence internal - use weighted combination but flag for review
  const combinedRisk = int.confidence > 0.5 ? int.risk : ext.risk;
  
  return {
    hasConflict: true,
    resolution: "flag_review",
    finalAssessment: {
      risk: combinedRisk,
      value: (int.value * int.confidence + ext.value * ext.trustScore) / (int.confidence + ext.trustScore),
      confidence: (int.confidence + ext.trustScore) / 2
    },
    explanation: `Conflict with low internal confidence. Flagged for human review.`,
    userMessage: `Mixed signals detected. We recommend a follow-up measurement for clarity.`
  };
}

/* ============================================
 * 5. Prisma Schema Extension
 * ============================================ */

export const EXTERNAL_KNOWLEDGE_PRISMA_SCHEMA = `
// External Knowledge Graph Extension

model ExternalFactor {
  id                    String   @id @default(cuid())
  subtype               String   // weather, epidemic, research, etc.
  
  // Source
  sourceDomain          String
  sourceUrl             String
  trustLevel            String
  trustScore            Float
  lastVerified          DateTime
  verificationMethod    String
  
  // Content
  label                 String
  description           String
  value                 Json
  unit                  String?
  
  // Temporal
  validFrom             DateTime
  validUntil            DateTime?
  updateFrequency       String
  
  // Geographic
  geographicScopeType   String
  geographicScopeValue  Json
  
  // Correlation with internal (JSON array)
  correlatedBiomarkers  Json     @default("[]")
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  fetchedAt             DateTime
  
  // Relations
  relationships         ExternalRelationship[]
  
  @@index([subtype])
  @@index([trustScore])
  @@index([sourceDomain])
}

model Biomarker {
  id                    String   @id @default(cuid())
  name                  String   @unique
  synonyms              Json     @default("[]")
  hmdbId                String?
  pubchemId             String?
  
  // Signal characteristics (JSON)
  signalCharacteristics Json
  
  // Clinical significance (JSON)
  clinicalSignificance  Json
  
  // External influences (JSON)
  externalInfluences    Json     @default("[]")
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  relationships         ExternalRelationship[]
  
  @@index([hmdbId])
  @@index([pubchemId])
}

model ExternalRelationship {
  id                    String   @id @default(cuid())
  type                  String   // AFFECTS, VALIDATES, etc.
  
  // Foreign keys
  externalFactorId      String
  biomarkerId           String
  
  // Properties (JSON)
  properties            Json
  
  // Status
  isActive              Boolean  @default(true)
  activatedAt           DateTime?
  deactivatedAt         DateTime?
  
  // Validation
  crossValidated        Boolean  @default(false)
  validationResult      Json?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  externalFactor        ExternalFactor @relation(fields: [externalFactorId], references: [id])
  biomarker             Biomarker      @relation(fields: [biomarkerId], references: [id])
  
  @@index([type])
  @@index([isActive])
}

model TrustAudit {
  id                    String   @id @default(cuid())
  externalFactorId      String
  
  // Input parameters
  input                 Json
  
  // Result
  score                 Float
  components            Json
  recommendation        String
  explanation           String
  
  // Outcome (if known later)
  actualOutcome         String?
  wasAccurate           Boolean?
  
  createdAt             DateTime @default(now())
  
  @@index([recommendation])
  @@index([score])
}

model ConflictLog {
  id                    String   @id @default(cuid())
  userId                String
  
  // Conflict details
  externalAssessment    Json
  internalAssessment    Json
  
  // Resolution
  resolution            String
  finalAssessment       Json
  explanation           String
  
  // Follow-up
  requiresReview        Boolean  @default(false)
  reviewedBy            String?
  reviewedAt            DateTime?
  reviewNotes           String?
  
  createdAt             DateTime @default(now())
  
  @@index([resolution])
  @@index([requiresReview])
}
`;

/* ============================================
 * 6. Export Types
 * ============================================ */

export type {
  ExternalFactorNode,
  BiomarkerNode,
  ExternalRelationship,
  TrustScoreInput,
  TrustScoreResult,
  ConflictResolutionInput,
  ConflictResolutionResult
};






