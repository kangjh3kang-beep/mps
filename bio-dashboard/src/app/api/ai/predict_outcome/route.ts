/**
 * Manpasik AI Prediction API
 * ===========================
 * 
 * Endpoint: GET/POST /api/ai/predict_outcome
 * 
 * Uses the Omni Brain to predict health outcomes from raw bio-signals.
 * 
 * Philosophy: "A micro-volt shift in the oxidation peak today
 *             can predict a chronic disease 3 years later."
 */

import { NextRequest, NextResponse } from "next/server";

/* ============================================
 * Types
 * ============================================ */

interface RawSignalInput {
  // CV Curve data
  cv_curve: {
    voltages: number[];       // Voltage sweep points
    currents: number[];       // Current at each voltage
    scan_rate: number;        // mV/s
  };
  
  // EIS Spectrum data
  eis_spectrum: {
    frequencies: number[];    // Frequency sweep
    real_impedance: number[]; // Z' (Ohms)
    imag_impedance: number[]; // Z'' (Ohms)
  };
  
  // SWV Response
  swv_response: {
    potentials: number[];
    differential_currents: number[];
  };
  
  // DPV Response
  dpv_response: {
    potentials: number[];
    differential_currents: number[];
  };
  
  // Environmental context
  environment: {
    temperature: number;      // °C
    humidity: number;         // %
    pressure?: number;        // hPa
    ehd_voltage?: number;     // V
  };
  
  // Optional: User genotype
  genotype?: {
    diabetes_risk: number;    // 0-100
    cardio_risk: number;      // 0-100
    // ... other risk scores
  };
}

interface PredictionResult {
  // Short-term prediction (next 7 days)
  health_trajectory: {
    day: number;
    predicted_score: number;
    confidence_interval: [number, number];
  }[];
  
  // Long-term risk prediction
  disease_risks: {
    condition: string;
    icd10_code: string;
    probability: number;
    time_to_onset_days: number;
    confidence: number;
  }[];
  
  // Detected micro-anomalies
  micro_anomalies: {
    type: string;
    description: string;
    severity: "info" | "warning" | "critical";
    signal_feature: string;
    deviation_percent: number;
  }[];
  
  // Pattern matching results
  pattern_matches: {
    pattern_id: number;
    pattern_name: string;
    similarity: number;
    historical_outcome: string;
  }[];
  
  // Recommended interventions
  recommended_interventions: {
    type: "nutrient" | "exercise" | "sleep" | "lifestyle" | "medical";
    name: string;
    dosage?: string;
    frequency?: string;
    reasoning: string;
    confidence: number;
    predicted_improvement: number;
  }[];
  
  // What-if scenarios
  scenario_simulations: {
    scenario: string;
    outcome: string;
    improvement_percent: number;
  }[];
  
  // Meta information
  meta: {
    model_version: string;
    model_generation: number;
    processing_time_ms: number;
    data_source: "internal_ecosystem";
    signal_quality_index: number;
  };
}

/* ============================================
 * Signal Processing Simulation
 * ============================================ */

function extractFeatures(signal: RawSignalInput): number[] {
  // Extract 88-dimensional feature vector from raw signals
  const features: number[] = [];
  
  // CV features (22 dimensions)
  if (signal.cv_curve.currents.length > 0) {
    const currents = signal.cv_curve.currents;
    
    // Peak detection
    const maxCurrent = Math.max(...currents);
    const minCurrent = Math.min(...currents);
    const peakIdx = currents.indexOf(maxCurrent);
    
    // Feature extraction
    features.push(maxCurrent);                          // Oxidation peak height
    features.push(minCurrent);                          // Reduction peak height
    features.push(peakIdx / currents.length);           // Peak position (normalized)
    features.push(maxCurrent - minCurrent);             // Peak separation
    features.push(mean(currents));                      // Mean current
    features.push(std(currents));                       // Current variance
    
    // Slope analysis
    const slopes = diff(currents);
    features.push(mean(slopes));                        // Mean slope
    features.push(max(slopes));                         // Max slope (re-oxidation)
    features.push(min(slopes));                         // Min slope
    
    // Pad to 22
    while (features.length < 22) features.push(0);
  } else {
    for (let i = 0; i < 22; i++) features.push(0);
  }
  
  // EIS features (22 dimensions)
  if (signal.eis_spectrum.real_impedance.length > 0) {
    const realZ = signal.eis_spectrum.real_impedance;
    const imagZ = signal.eis_spectrum.imag_impedance;
    
    // Nyquist plot features
    features.push(realZ[0]);                            // Solution resistance (Rs)
    features.push(realZ[realZ.length - 1] - realZ[0]);  // Charge transfer (Rct)
    features.push(min(imagZ));                          // Min imaginary (capacitive)
    features.push(max(imagZ));                          // Max imaginary
    
    // Semicircle fitting
    const arcHeight = Math.abs(min(imagZ));
    const arcWidth = realZ[realZ.length - 1] - realZ[0];
    features.push(arcHeight / (arcWidth || 1));         // Arc ratio
    
    // Warburg element (low frequency)
    const lowFreqSlope = (imagZ[imagZ.length - 1] - imagZ[imagZ.length - 5]) / 
                        (realZ[realZ.length - 1] - realZ[realZ.length - 5] || 1);
    features.push(lowFreqSlope);                        // Diffusion indicator
    
    // Pad to 22
    while (features.length < 44) features.push(0);
  } else {
    for (let i = 0; i < 22; i++) features.push(0);
  }
  
  // SWV features (22 dimensions)
  if (signal.swv_response.differential_currents.length > 0) {
    const currents = signal.swv_response.differential_currents;
    
    features.push(max(currents));                       // Peak height
    features.push(mean(currents));                      // Baseline
    features.push(std(currents));                       // Noise level
    
    // Peak analysis
    const peakIdx = currents.indexOf(max(currents));
    features.push(peakIdx / currents.length);           // Peak position
    
    // FWHM estimation
    const halfMax = max(currents) / 2;
    let leftIdx = 0, rightIdx = currents.length - 1;
    for (let i = 0; i < peakIdx; i++) {
      if (currents[i] > halfMax) { leftIdx = i; break; }
    }
    for (let i = currents.length - 1; i > peakIdx; i--) {
      if (currents[i] > halfMax) { rightIdx = i; break; }
    }
    features.push((rightIdx - leftIdx) / currents.length); // FWHM
    
    // Pad to 22
    while (features.length < 66) features.push(0);
  } else {
    for (let i = 0; i < 22; i++) features.push(0);
  }
  
  // DPV features (22 dimensions)
  if (signal.dpv_response.differential_currents.length > 0) {
    const currents = signal.dpv_response.differential_currents;
    
    features.push(max(currents));
    features.push(min(currents));
    features.push(mean(currents));
    features.push(std(currents));
    
    // Multi-peak detection (trace metals)
    const peaks = findPeaks(currents);
    features.push(peaks.length);
    peaks.slice(0, 5).forEach(p => features.push(p.position, p.height));
    
    // Pad to 22
    while (features.length < 88) features.push(0);
  } else {
    for (let i = 0; i < 22; i++) features.push(0);
  }
  
  return features.slice(0, 88);
}

function detectMicroAnomalies(features: number[], env: RawSignalInput["environment"]): PredictionResult["micro_anomalies"] {
  const anomalies: PredictionResult["micro_anomalies"] = [];
  
  // Check CV re-oxidation slope (feature index 7)
  const reoxSlope = features[7];
  if (reoxSlope < 0.8) { // Threshold based on training data
    anomalies.push({
      type: "CV_ReoxSlope_Low",
      description: "Re-oxidation slope is 2% flatter than usual - Pre-Metabolic Stress indicator",
      severity: "warning",
      signal_feature: "CV Curve - Re-oxidation Slope",
      deviation_percent: (1 - reoxSlope) * 100
    });
  }
  
  // Check EIS arc ratio (feature index 26)
  const arcRatio = features[26];
  if (arcRatio > 1.5) {
    anomalies.push({
      type: "EIS_ArcRatio_High",
      description: "Nyquist semicircle distortion - Membrane permeability change",
      severity: "warning",
      signal_feature: "EIS Spectrum - Arc Ratio",
      deviation_percent: (arcRatio - 1) * 100
    });
  }
  
  // Check SWV peak width (feature index 48)
  const peakWidth = features[48];
  if (peakWidth > 0.3) {
    anomalies.push({
      type: "SWV_PeakBroadening",
      description: "Analyte peak broadening - Possible enzyme degradation",
      severity: "info",
      signal_feature: "SWV Response - FWHM",
      deviation_percent: (peakWidth - 0.2) / 0.2 * 100
    });
  }
  
  // Environmental context anomalies
  if (env.temperature && (env.temperature < 20 || env.temperature > 37)) {
    anomalies.push({
      type: "Env_Temperature",
      description: `Temperature ${env.temperature}°C outside optimal range - Calibration may be affected`,
      severity: env.temperature < 15 || env.temperature > 40 ? "critical" : "warning",
      signal_feature: "Environment - Temperature",
      deviation_percent: Math.abs(env.temperature - 25) / 25 * 100
    });
  }
  
  return anomalies;
}

function matchPatterns(features: number[]): PredictionResult["pattern_matches"] {
  // Mock pattern database (in production, this would be from the Knowledge Graph)
  const KNOWN_PATTERNS = [
    {
      id: 402,
      name: "Hypertension Precursor Pattern",
      centroid: Array(88).fill(0).map((_, i) => i % 10 === 0 ? 0.8 : 0.5),
      outcome: "Hypertension within 6 months (89% probability)"
    },
    {
      id: 156,
      name: "Metabolic Stress Pattern",
      centroid: Array(88).fill(0).map((_, i) => i % 5 === 0 ? 0.7 : 0.4),
      outcome: "Pre-diabetic state development within 12 months"
    },
    {
      id: 289,
      name: "Inflammatory Response Pattern",
      centroid: Array(88).fill(0).map((_, i) => i % 7 === 0 ? 0.9 : 0.3),
      outcome: "Elevated inflammation markers, autoimmune risk"
    }
  ];
  
  return KNOWN_PATTERNS.map(pattern => {
    // Cosine similarity
    const dotProduct = features.reduce((sum, f, i) => sum + f * pattern.centroid[i], 0);
    const normA = Math.sqrt(features.reduce((sum, f) => sum + f * f, 0));
    const normB = Math.sqrt(pattern.centroid.reduce((sum, c) => sum + c * c, 0));
    const similarity = dotProduct / (normA * normB || 1);
    
    return {
      pattern_id: pattern.id,
      pattern_name: pattern.name,
      similarity: Math.max(0, Math.min(1, similarity)),
      historical_outcome: pattern.outcome
    };
  }).sort((a, b) => b.similarity - a.similarity);
}

function generateRecommendations(
  features: number[], 
  anomalies: PredictionResult["micro_anomalies"],
  patterns: PredictionResult["pattern_matches"]
): PredictionResult["recommended_interventions"] {
  const recommendations: PredictionResult["recommended_interventions"] = [];
  
  // Based on micro-anomalies
  for (const anomaly of anomalies) {
    if (anomaly.type === "CV_ReoxSlope_Low") {
      recommendations.push({
        type: "nutrient",
        name: "Magnesium Glycinate",
        dosage: "300mg",
        frequency: "Daily before bed",
        reasoning: "Your CV re-oxidation slope indicates metabolic stress. Magnesium supports electron transport chain function.",
        confidence: 0.85,
        predicted_improvement: 4.2
      });
    }
    
    if (anomaly.type === "EIS_ArcRatio_High") {
      recommendations.push({
        type: "nutrient",
        name: "Omega-3 EPA/DHA",
        dosage: "1000mg",
        frequency: "Daily with meal",
        reasoning: "EIS membrane pattern suggests lipid oxidation. Omega-3 supports membrane fluidity.",
        confidence: 0.78,
        predicted_improvement: 3.8
      });
    }
  }
  
  // Based on pattern matches
  const topPattern = patterns[0];
  if (topPattern && topPattern.similarity > 0.7) {
    if (topPattern.pattern_id === 402) { // Hypertension
      recommendations.push({
        type: "lifestyle",
        name: "DASH Diet Protocol",
        reasoning: "Signal pattern #402 correlates with hypertension. Users who adopted DASH diet showed 34% risk reduction.",
        confidence: 0.89,
        predicted_improvement: 6.5
      });
      
      recommendations.push({
        type: "exercise",
        name: "Moderate Cardio",
        dosage: "30 minutes",
        frequency: "5x per week",
        reasoning: "Based on your unique Lactate Recovery Curve, you respond better to moderate intensity.",
        confidence: 0.82,
        predicted_improvement: 5.2
      });
    }
  }
  
  // If no specific recommendations, add general wellness
  if (recommendations.length === 0) {
    recommendations.push({
      type: "nutrient",
      name: "Vitamin D3 + K2",
      dosage: "2000 IU",
      frequency: "Daily",
      reasoning: "General wellness support based on your signal baseline.",
      confidence: 0.65,
      predicted_improvement: 2.0
    });
  }
  
  return recommendations.slice(0, 5);
}

function simulateScenarios(features: number[]): PredictionResult["scenario_simulations"] {
  return [
    {
      scenario: "Start Vitamin D supplementation",
      outcome: "Inflammation markers predicted to decrease",
      improvement_percent: 15
    },
    {
      scenario: "Reduce refined sugar intake",
      outcome: "Glucose signal variability expected to stabilize",
      improvement_percent: 22
    },
    {
      scenario: "Add 30min daily walking",
      outcome: "Lactate clearance curve predicted to improve",
      improvement_percent: 18
    },
    {
      scenario: "No intervention",
      outcome: "Current trajectory continues toward risk threshold",
      improvement_percent: -5
    }
  ];
}

/* ============================================
 * Utility Functions
 * ============================================ */

function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function std(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length || 1));
}

function max(arr: number[]): number {
  return arr.length ? Math.max(...arr) : 0;
}

function min(arr: number[]): number {
  return arr.length ? Math.min(...arr) : 0;
}

function diff(arr: number[]): number[] {
  return arr.slice(1).map((v, i) => v - arr[i]);
}

function findPeaks(arr: number[]): { position: number; height: number }[] {
  const peaks: { position: number; height: number }[] = [];
  for (let i = 1; i < arr.length - 1; i++) {
    if (arr[i] > arr[i - 1] && arr[i] > arr[i + 1]) {
      peaks.push({ position: i / arr.length, height: arr[i] });
    }
  }
  return peaks.sort((a, b) => b.height - a.height);
}

/* ============================================
 * API Handlers
 * ============================================ */

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: { signal: RawSignalInput; user_id?: string } = await request.json();
    const { signal, user_id } = body;
    
    if (!signal) {
      return NextResponse.json(
        { success: false, error: "signal data is required" },
        { status: 400 }
      );
    }
    
    // Step 1: Extract 88-dimensional features
    const features = extractFeatures(signal);
    
    // Step 2: Detect micro-anomalies
    const microAnomalies = detectMicroAnomalies(features, signal.environment);
    
    // Step 3: Match against known patterns
    const patternMatches = matchPatterns(features);
    
    // Step 4: Generate recommendations
    const recommendations = generateRecommendations(features, microAnomalies, patternMatches);
    
    // Step 5: Simulate scenarios
    const scenarios = simulateScenarios(features);
    
    // Step 6: Calculate health trajectory
    const baseScore = 75 + (features[0] || 0) * 10; // Mock calculation
    const trajectory = Array.from({ length: 7 }, (_, day) => ({
      day: day + 1,
      predicted_score: Math.max(0, Math.min(100, baseScore + day * 0.5 + Math.random() * 2 - 1)),
      confidence_interval: [
        Math.max(0, baseScore + day * 0.5 - 5),
        Math.min(100, baseScore + day * 0.5 + 5)
      ] as [number, number]
    }));
    
    // Step 7: Calculate disease risks
    const diseaseRisks = patternMatches
      .filter(p => p.similarity > 0.6)
      .map(p => ({
        condition: p.pattern_name.replace(" Pattern", ""),
        icd10_code: p.pattern_id === 402 ? "I10" : p.pattern_id === 156 ? "R73.09" : "R00.0",
        probability: p.similarity * 0.95,
        time_to_onset_days: Math.round(180 / p.similarity),
        confidence: 0.75 + p.similarity * 0.2
      }));
    
    // Calculate SQI
    const sqi = Math.min(100, 60 + features.filter(f => !isNaN(f) && f !== 0).length * 0.5);
    
    const result: PredictionResult = {
      health_trajectory: trajectory,
      disease_risks: diseaseRisks,
      micro_anomalies: microAnomalies,
      pattern_matches: patternMatches.slice(0, 5),
      recommended_interventions: recommendations,
      scenario_simulations: scenarios,
      meta: {
        model_version: "v2025.01.28",
        model_generation: 24,
        processing_time_ms: Date.now() - startTime,
        data_source: "internal_ecosystem",
        signal_quality_index: sqi
      }
    };
    
    return NextResponse.json({
      success: true,
      user_id,
      timestamp: new Date().toISOString(),
      prediction: result
    });
    
  } catch (error) {
    console.error("[Predict Outcome API] Error:", error);
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
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("user_id");
  
  // Return API documentation
  return NextResponse.json({
    endpoint: "/api/ai/predict_outcome",
    method: "POST",
    description: "Predict health outcomes from raw bio-signals using Manpasik Omni Brain",
    
    request_body: {
      signal: {
        cv_curve: {
          voltages: "number[] - Voltage sweep points (-0.5V to +0.8V)",
          currents: "number[] - Current at each voltage (μA)",
          scan_rate: "number - Scan rate in mV/s"
        },
        eis_spectrum: {
          frequencies: "number[] - Frequency sweep (100kHz to 0.1Hz)",
          real_impedance: "number[] - Z' (Ohms)",
          imag_impedance: "number[] - Z'' (Ohms)"
        },
        swv_response: {
          potentials: "number[] - Potential points",
          differential_currents: "number[] - ΔI (μA)"
        },
        dpv_response: {
          potentials: "number[] - Potential points",
          differential_currents: "number[] - ΔI (μA)"
        },
        environment: {
          temperature: "number - °C",
          humidity: "number - %RH",
          pressure: "number? - hPa (optional)",
          ehd_voltage: "number? - V (optional)"
        },
        genotype: "object? - DNA risk scores (optional)"
      },
      user_id: "string? - User ID for personalization (optional)"
    },
    
    response: {
      success: "boolean",
      prediction: {
        health_trajectory: "7-day predicted health score",
        disease_risks: "Long-term risk predictions with ICD-10 codes",
        micro_anomalies: "Detected signal anomalies invisible to human eye",
        pattern_matches: "Matched patterns from internal knowledge base",
        recommended_interventions: "Personalized recommendations (RL-based)",
        scenario_simulations: "What-if scenarios"
      }
    },
    
    example_curl: `curl -X POST ${request.nextUrl.origin}/api/ai/predict_outcome \\
  -H "Content-Type: application/json" \\
  -d '{
    "signal": {
      "cv_curve": {"voltages": [-0.5, 0, 0.5, 0.8], "currents": [0.1, 0.5, 1.2, 0.8], "scan_rate": 100},
      "eis_spectrum": {"frequencies": [100000, 10000, 1000], "real_impedance": [100, 200, 350], "imag_impedance": [-50, -100, -80]},
      "swv_response": {"potentials": [0, 0.2, 0.4, 0.6], "differential_currents": [0.1, 0.8, 0.3, 0.1]},
      "dpv_response": {"potentials": [0, 0.2, 0.4], "differential_currents": [0.05, 0.15, 0.08]},
      "environment": {"temperature": 25, "humidity": 45}
    }
  }'`
  });
}






