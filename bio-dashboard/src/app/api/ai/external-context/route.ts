/**
 * External Context API
 * =====================
 * 
 * Fetches and integrates trusted external data to augment
 * the 88-dimensional sensor readings.
 * 
 * Philosophy: "Trust but Verify"
 * - Source Whitelisting: Only FDA, WHO, CDC, PubMed, NOAA
 * - Internal Data is King: Sensors override external when in conflict
 */

import { NextRequest, NextResponse } from "next/server";
import {
  calculateTrustScore,
  resolveConflict,
  type TrustScoreInput,
  type TrustScoreResult,
  type ConflictResolutionInput,
  type ConflictResolutionResult
} from "@/lib/omni-brain/external-knowledge-schema";

/* ============================================
 * Whitelisted Sources
 * ============================================ */

const WHITELISTED_DOMAINS = [
  "cdc.gov",
  "who.int",
  "fda.gov",
  "pubmed.ncbi.nlm.nih.gov",
  "ncbi.nlm.nih.gov",
  "openweathermap.org",
  "airkorea.or.kr",
  "noaa.gov",
  "kdca.go.kr",
  "hmdb.ca",
  "pubchem.ncbi.nlm.nih.gov"
];

/* ============================================
 * Types
 * ============================================ */

interface ExternalContextRequest {
  user_id: string;
  location?: {
    lat: number;
    lon: number;
    region?: string;
  };
  symptoms?: string[];
  internal_assessment?: {
    risk: "low" | "medium" | "high";
    value: number;
    confidence: number;
    biomarkers?: Record<string, number>;
  };
  include?: ("weather" | "air_quality" | "epidemiology" | "research")[];
}

interface ExternalDataPoint {
  id: string;
  type: string;
  source: {
    domain: string;
    url: string;
    name: string;
  };
  value: unknown;
  unit?: string;
  timestamp: string;
  trust_score: TrustScoreResult;
  correlations: {
    internal_var: string;
    coefficient: number;
  }[];
}

interface ExternalContextResponse {
  success: boolean;
  user_id: string;
  timestamp: string;
  
  // External data by category
  weather?: ExternalDataPoint[];
  air_quality?: ExternalDataPoint[];
  epidemiology?: ExternalDataPoint[];
  research?: {
    papers: {
      pmid: string;
      title: string;
      relevance_score: number;
    }[];
  };
  
  // Augmentation for AI
  bayesian_priors: Record<string, number>;
  
  // Conflict resolution (if internal assessment provided)
  conflict_resolution?: ConflictResolutionResult;
  
  // Recommendations based on external context
  context_adjustments: {
    type: string;
    description: string;
    action: string;
  }[];
  
  // Meta
  meta: {
    sources_queried: number;
    data_points_accepted: number;
    data_points_rejected: number;
    avg_trust_score: number;
  };
}

/* ============================================
 * Mock Data Fetchers
 * ============================================ */

function fetchWeatherData(lat: number, lon: number): ExternalDataPoint[] {
  const timestamp = new Date().toISOString();
  
  return [
    {
      id: `weather_temp_${lat}_${lon}`,
      type: "temperature",
      source: {
        domain: "openweathermap.org",
        url: "https://api.openweathermap.org",
        name: "OpenWeather"
      },
      value: 22.5 + Math.random() * 5,
      unit: "°C",
      timestamp,
      trust_score: calculateTrustScore({
        sourceDomain: "openweathermap.org",
        sourceType: "institutional",
        isWhitelisted: true,
        hasTimestamp: true,
        dataAge: 0.5,
        hasGeographicScope: true,
        hasBeenCrossValidated: false,
        conflictCount: 0
      }),
      correlations: [
        { internal_var: "sensor_temperature", coefficient: 0.92 },
        { internal_var: "ehd_efficiency", coefficient: 0.78 }
      ]
    },
    {
      id: `weather_humidity_${lat}_${lon}`,
      type: "humidity",
      source: {
        domain: "openweathermap.org",
        url: "https://api.openweathermap.org",
        name: "OpenWeather"
      },
      value: 55 + Math.random() * 20,
      unit: "%",
      timestamp,
      trust_score: calculateTrustScore({
        sourceDomain: "openweathermap.org",
        sourceType: "institutional",
        isWhitelisted: true,
        hasTimestamp: true,
        dataAge: 0.5,
        hasGeographicScope: true,
        hasBeenCrossValidated: false,
        conflictCount: 0
      }),
      correlations: [
        { internal_var: "ehd_suction_efficiency", coefficient: 0.85 },
        { internal_var: "hydrogel_impedance", coefficient: 0.72 }
      ]
    },
    {
      id: `weather_pressure_${lat}_${lon}`,
      type: "barometric_pressure",
      source: {
        domain: "openweathermap.org",
        url: "https://api.openweathermap.org",
        name: "OpenWeather"
      },
      value: 1010 + Math.random() * 20,
      unit: "hPa",
      timestamp,
      trust_score: calculateTrustScore({
        sourceDomain: "openweathermap.org",
        sourceType: "institutional",
        isWhitelisted: true,
        hasTimestamp: true,
        dataAge: 0.5,
        hasGeographicScope: true,
        hasBeenCrossValidated: false,
        conflictCount: 0
      }),
      correlations: [
        { internal_var: "joint_pain_prediction", coefficient: 0.68 }
      ]
    }
  ];
}

function fetchAirQualityData(lat: number, lon: number): ExternalDataPoint[] {
  const timestamp = new Date().toISOString();
  const pm25Value = 20 + Math.random() * 40;
  
  return [
    {
      id: `aq_pm25_${lat}_${lon}`,
      type: "pm25",
      source: {
        domain: "airkorea.or.kr",
        url: "https://www.airkorea.or.kr",
        name: "AirKorea (Government)"
      },
      value: pm25Value,
      unit: "μg/m³",
      timestamp,
      trust_score: calculateTrustScore({
        sourceDomain: "airkorea.or.kr",
        sourceType: "government",
        isWhitelisted: true,
        hasTimestamp: true,
        dataAge: 1,
        hasGeographicScope: true,
        hasBeenCrossValidated: false,
        conflictCount: 0
      }),
      correlations: [
        { internal_var: "respiratory_noise", coefficient: 0.82 },
        { internal_var: "inflammation_index", coefficient: 0.75 }
      ]
    },
    {
      id: `aq_uv_${lat}_${lon}`,
      type: "uv_index",
      source: {
        domain: "noaa.gov",
        url: "https://www.noaa.gov",
        name: "NOAA"
      },
      value: Math.floor(1 + Math.random() * 10),
      unit: "",
      timestamp,
      trust_score: calculateTrustScore({
        sourceDomain: "noaa.gov",
        sourceType: "government",
        isWhitelisted: true,
        hasTimestamp: true,
        dataAge: 2,
        hasGeographicScope: true,
        hasBeenCrossValidated: false,
        conflictCount: 0
      }),
      correlations: [
        { internal_var: "vitamin_d_synthesis", coefficient: 0.70 },
        { internal_var: "oxidative_stress", coefficient: 0.55 }
      ]
    }
  ];
}

function fetchEpidemiologyData(region: string): ExternalDataPoint[] {
  const timestamp = new Date().toISOString();
  
  return [
    {
      id: `epi_ili_${region}`,
      type: "ili_rate",
      source: {
        domain: "cdc.gov",
        url: "https://www.cdc.gov/flu/weekly",
        name: "CDC FluView"
      },
      value: 1.5 + Math.random() * 3,
      unit: "%",
      timestamp,
      trust_score: calculateTrustScore({
        sourceDomain: "cdc.gov",
        sourceType: "government",
        isWhitelisted: true,
        hasTimestamp: true,
        dataAge: 24,
        hasGeographicScope: true,
        hasBeenCrossValidated: false,
        conflictCount: 0
      }),
      correlations: [
        { internal_var: "fever_biomarker", coefficient: 0.72 },
        { internal_var: "inflammation_index", coefficient: 0.68 }
      ]
    },
    {
      id: `epi_flu_pos_${region}`,
      type: "flu_positivity",
      source: {
        domain: "cdc.gov",
        url: "https://www.cdc.gov/flu/weekly",
        name: "CDC FluView"
      },
      value: 8 + Math.random() * 10,
      unit: "%",
      timestamp,
      trust_score: calculateTrustScore({
        sourceDomain: "cdc.gov",
        sourceType: "government",
        isWhitelisted: true,
        hasTimestamp: true,
        dataAge: 24,
        hasGeographicScope: true,
        hasBeenCrossValidated: false,
        conflictCount: 0
      }),
      correlations: [
        { internal_var: "virus_detection_prior", coefficient: 0.88 }
      ]
    }
  ];
}

function fetchResearchData(symptoms: string[]): { papers: { pmid: string; title: string; relevance_score: number }[] } {
  // Mock PubMed results
  const mockPapers = [
    {
      pmid: "38123456",
      title: "Lactate Metabolism in Chronic Fatigue: A Systematic Review",
      relevance_score: 0.92
    },
    {
      pmid: "38123457",
      title: "Electrochemical Biomarkers for Early Disease Detection",
      relevance_score: 0.88
    },
    {
      pmid: "38123458",
      title: "Wearable Biosensors for Continuous Health Monitoring",
      relevance_score: 0.85
    }
  ];
  
  return { papers: mockPapers };
}

function generateContextAdjustments(
  weather: ExternalDataPoint[],
  airQuality: ExternalDataPoint[],
  epidemiology: ExternalDataPoint[]
): ExternalContextResponse["context_adjustments"] {
  const adjustments: ExternalContextResponse["context_adjustments"] = [];
  
  // Check PM2.5
  const pm25Data = airQuality.find(d => d.type === "pm25");
  if (pm25Data && typeof pm25Data.value === "number" && pm25Data.value > 35) {
    adjustments.push({
      type: "anomaly_threshold",
      description: `PM2.5 is elevated (${pm25Data.value.toFixed(0)} μg/m³)`,
      action: "Lower respiratory anomaly detection threshold by 15%"
    });
  }
  
  // Check humidity for EHD
  const humidityData = weather.find(d => d.type === "humidity");
  if (humidityData && typeof humidityData.value === "number" && humidityData.value > 80) {
    adjustments.push({
      type: "ehd_calibration",
      description: `High humidity detected (${humidityData.value.toFixed(0)}%)`,
      action: "Reduce EHD suction power to prevent arcing"
    });
  }
  
  // Check barometric pressure for joint pain prediction
  const pressureData = weather.find(d => d.type === "barometric_pressure");
  if (pressureData && typeof pressureData.value === "number" && pressureData.value < 1005) {
    adjustments.push({
      type: "predictive_alert",
      description: "Low barometric pressure detected",
      action: "Enable joint pain prediction module for affected users"
    });
  }
  
  // Check flu rates
  const fluData = epidemiology.find(d => d.type === "flu_positivity");
  if (fluData && typeof fluData.value === "number" && fluData.value > 15) {
    adjustments.push({
      type: "bayesian_prior",
      description: `Elevated flu activity in region (${fluData.value.toFixed(1)}% positivity)`,
      action: "Increase virus detection prior probability from 5% to 12%"
    });
  }
  
  return adjustments;
}

function calculateBayesianPriors(epidemiology: ExternalDataPoint[]): Record<string, number> {
  const priors: Record<string, number> = {
    influenza: 0.05,      // Baseline 5%
    covid19: 0.03,        // Baseline 3%
    rsv: 0.02,            // Baseline 2%
    dengue: 0.001,        // Very low baseline
    metabolic_disorder: 0.08
  };
  
  // Adjust based on epidemiological data
  const fluData = epidemiology.find(d => d.type === "flu_positivity");
  if (fluData && typeof fluData.value === "number") {
    priors.influenza = Math.min(0.30, 0.05 * (1 + (fluData.value as number) / 10));
  }
  
  const iliData = epidemiology.find(d => d.type === "ili_rate");
  if (iliData && typeof iliData.value === "number") {
    // ILI affects multiple priors
    const multiplier = 1 + (iliData.value as number) / 5;
    priors.influenza *= multiplier;
    priors.covid19 *= multiplier;
    priors.rsv *= multiplier;
  }
  
  return priors;
}

/* ============================================
 * API Handler
 * ============================================ */

export async function POST(request: NextRequest) {
  try {
    const body: ExternalContextRequest = await request.json();
    const { user_id, location, symptoms, internal_assessment, include } = body;
    
    if (!user_id) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }
    
    const timestamp = new Date().toISOString();
    const includeCategories = include || ["weather", "air_quality", "epidemiology", "research"];
    
    // Fetch external data
    let weather: ExternalDataPoint[] = [];
    let airQuality: ExternalDataPoint[] = [];
    let epidemiology: ExternalDataPoint[] = [];
    let research: { papers: { pmid: string; title: string; relevance_score: number }[] } | undefined;
    
    if (location && includeCategories.includes("weather")) {
      weather = fetchWeatherData(location.lat, location.lon);
    }
    
    if (location && includeCategories.includes("air_quality")) {
      airQuality = fetchAirQualityData(location.lat, location.lon);
    }
    
    if (includeCategories.includes("epidemiology")) {
      const region = location?.region || "US";
      epidemiology = fetchEpidemiologyData(region);
    }
    
    if (symptoms && symptoms.length > 0 && includeCategories.includes("research")) {
      research = fetchResearchData(symptoms);
    }
    
    // Calculate Bayesian priors
    const bayesianPriors = calculateBayesianPriors(epidemiology);
    
    // Generate context adjustments
    const contextAdjustments = generateContextAdjustments(weather, airQuality, epidemiology);
    
    // Conflict resolution if internal assessment provided
    let conflictResolution: ConflictResolutionResult | undefined;
    
    if (internal_assessment) {
      // Find most relevant external assessment
      const fluData = epidemiology.find(d => d.type === "flu_positivity");
      if (fluData && typeof fluData.value === "number") {
        const externalRisk: "low" | "medium" | "high" = 
          (fluData.value as number) > 20 ? "high" :
          (fluData.value as number) > 10 ? "medium" : "low";
        
        const conflictInput: ConflictResolutionInput = {
          externalAssessment: {
            risk: externalRisk,
            value: fluData.value as number,
            source: fluData.source.domain,
            trustScore: fluData.trust_score.score
          },
          internalAssessment: internal_assessment
        };
        
        conflictResolution = resolveConflict(conflictInput);
      }
    }
    
    // Calculate meta statistics
    const allDataPoints = [...weather, ...airQuality, ...epidemiology];
    const trustScores = allDataPoints.map(d => d.trust_score.score);
    const avgTrustScore = trustScores.length > 0 
      ? trustScores.reduce((a, b) => a + b, 0) / trustScores.length 
      : 0;
    const accepted = allDataPoints.filter(d => d.trust_score.recommendation !== "reject").length;
    const rejected = allDataPoints.filter(d => d.trust_score.recommendation === "reject").length;
    
    const response: ExternalContextResponse = {
      success: true,
      user_id,
      timestamp,
      weather: weather.length > 0 ? weather : undefined,
      air_quality: airQuality.length > 0 ? airQuality : undefined,
      epidemiology: epidemiology.length > 0 ? epidemiology : undefined,
      research,
      bayesian_priors: bayesianPriors,
      conflict_resolution: conflictResolution,
      context_adjustments: contextAdjustments,
      meta: {
        sources_queried: includeCategories.length,
        data_points_accepted: accepted,
        data_points_rejected: rejected,
        avg_trust_score: Math.round(avgTrustScore * 100) / 100
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("[External Context API] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return API documentation
  return NextResponse.json({
    endpoint: "/api/ai/external-context",
    method: "POST",
    description: "Fetch trusted external data to augment 88-dimensional sensor readings",
    
    philosophy: {
      source_whitelisting: "Only FDA, WHO, CDC, PubMed, NOAA, AirKorea",
      trust_hierarchy: "Internal Data is King - sensors override external when in conflict",
      purpose: "General Rule (external) + Personal Exception (internal)"
    },
    
    whitelisted_sources: WHITELISTED_DOMAINS,
    
    request_body: {
      user_id: "string (required)",
      location: {
        lat: "number (optional)",
        lon: "number (optional)",
        region: "string (optional)"
      },
      symptoms: "string[] (optional) - for research paper lookup",
      internal_assessment: {
        risk: "'low' | 'medium' | 'high' (optional)",
        value: "number (optional)",
        confidence: "number 0-1 (optional)"
      },
      include: "('weather' | 'air_quality' | 'epidemiology' | 'research')[] (optional)"
    },
    
    response: {
      weather: "Temperature, humidity, pressure with trust scores",
      air_quality: "PM2.5, UV index with trust scores",
      epidemiology: "ILI rates, flu positivity from CDC/WHO",
      research: "Relevant PubMed papers",
      bayesian_priors: "Adjusted disease probabilities",
      conflict_resolution: "If internal differs from external",
      context_adjustments: "Recommended calibration changes"
    }
  });
}






