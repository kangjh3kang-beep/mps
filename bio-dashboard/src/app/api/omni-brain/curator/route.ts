/**
 * Curator API - Bio-Compatible Product Recommendations
 * 
 * Endpoint: POST /api/omni-brain/curator
 * 
 * This API provides hyper-personalized product recommendations
 * based on the user's unique bio-profile and internal ecosystem data.
 * 
 * Philosophy: NOT popularity-based. Bio-compatible recommendations.
 */

import { NextRequest, NextResponse } from "next/server";
import { curatorEngine, type UserBioProfile, type Recommendation } from "@/lib/omni-brain/curator";

export interface CuratorRequest {
  userId: string;
  
  // User's bio-profile (from internal measurements)
  bioProfile?: Partial<UserBioProfile>;
  
  // Request parameters
  limit?: number;
  category?: "supplement" | "cartridge" | "meal" | "device" | "service" | "all";
  
  // Goal focus (optional - prioritize products for specific goal)
  goalFocus?: string;
  
  // Exclude products
  excludeProducts?: string[];
}

export interface CuratorResponse {
  success: boolean;
  userId: string;
  timestamp: string;
  
  // Recommendations
  recommendations: Recommendation[];
  
  // Meta-information
  meta: {
    totalProductsAnalyzed: number;
    bioCompatibilityThreshold: number;
    dataSource: "internal_ecosystem_only";
    
    // User's bio-summary (for transparency)
    userBioSummary: {
      signalQuality: "high" | "medium" | "low";
      dataPoints: number;
      lastMeasurement: string;
      topConcerns: string[];
    };
  };
  
  // Explanation for the user
  explanation: {
    title: string;
    titleKo: string;
    description: string;
    descriptionKo: string;
  };
}

/**
 * Generate mock user bio-profile for demo
 */
function generateMockBioProfile(userId: string): UserBioProfile {
  return {
    userId,
    signalFingerprint: Array(88).fill(0).map(() => Math.random() * 2 - 1),
    bioMarkers: {
      glucoseLevel: 95 + Math.random() * 20,
      lactateLevel: 1.5 + Math.random() * 2,
      cortisolLevel: 15 + Math.random() * 10,
      inflammationIndex: 25 + Math.random() * 30,
      oxidativeStress: 15 + Math.random() * 20,
      hydrationLevel: 60 + Math.random() * 30,
      mineralBalance: 70 + Math.random() * 25,
      vitaminAbsorption: 65 + Math.random() * 30
    },
    absorptionProfile: {
      vitaminA: 0.5 + Math.random() * 0.4,
      vitaminB: 0.6 + Math.random() * 0.3,
      vitaminC: 0.7 + Math.random() * 0.25,
      vitaminD: 0.4 + Math.random() * 0.4,
      zinc: 0.35 + Math.random() * 0.4, // Deliberately low for demo
      iron: 0.5 + Math.random() * 0.35,
      magnesium: 0.55 + Math.random() * 0.35,
      calcium: 0.6 + Math.random() * 0.3,
      omega3: 0.65 + Math.random() * 0.3,
      protein: 0.7 + Math.random() * 0.25
    },
    productResponses: [
      {
        productId: "prod_vitamin_c_001",
        improvement: 2.1,
        absorptionActual: 0.82,
        sideEffects: [],
        lastUsed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    conditions: [],
    goals: ["blood_sugar_control", "stress_management"]
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CuratorRequest = await request.json();
    
    const { userId, bioProfile, limit = 5, excludeProducts = [] } = body;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }
    
    // Get or generate user's bio-profile
    // In production, this would come from the internal database
    const userProfile: UserBioProfile = bioProfile 
      ? {
          ...generateMockBioProfile(userId),
          ...bioProfile
        } as UserBioProfile
      : generateMockBioProfile(userId);
    
    // Generate bio-compatible recommendations
    let recommendations = curatorEngine.generateRecommendations(userProfile, limit + excludeProducts.length);
    
    // Filter excluded products
    recommendations = recommendations.filter(r => !excludeProducts.includes(r.productId));
    recommendations = recommendations.slice(0, limit);
    
    // Identify top concerns based on bio-markers
    const topConcerns: string[] = [];
    const markers = userProfile.bioMarkers;
    
    if (markers.inflammationIndex > 40) topConcerns.push("Elevated inflammation");
    if (markers.lactateLevel > 3) topConcerns.push("High lactate (fatigue)");
    if (markers.glucoseLevel > 100) topConcerns.push("Glucose management");
    if (markers.oxidativeStress > 30) topConcerns.push("Oxidative stress");
    if (markers.hydrationLevel < 60) topConcerns.push("Dehydration");
    if (userProfile.absorptionProfile.zinc < 0.4) topConcerns.push("Low zinc absorption");
    
    // Build response
    const response: CuratorResponse = {
      success: true,
      userId,
      timestamp: new Date().toISOString(),
      recommendations,
      meta: {
        totalProductsAnalyzed: 50, // Mock
        bioCompatibilityThreshold: 50,
        dataSource: "internal_ecosystem_only",
        userBioSummary: {
          signalQuality: "high",
          dataPoints: 156,
          lastMeasurement: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          topConcerns: topConcerns.slice(0, 3)
        }
      },
      explanation: {
        title: "Your Personalized Recommendations",
        titleKo: "맞춤 추천",
        description: `Based on your unique 88-dimensional bio-signal pattern, we've identified products that match your body's specific needs. Unlike popularity-based recommendations, these are tailored to your absorption profile and current health markers.`,
        descriptionKo: `당신의 고유한 88차원 바이오 신호 패턴을 기반으로, 당신의 신체 특성에 맞는 제품을 선별했습니다. 인기도 기반이 아닌, 당신의 흡수 프로필과 현재 건강 지표에 맞춤화된 추천입니다.`
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("[Curator API] Error:", error);
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

/**
 * GET endpoint for quick recommendations with minimal input
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "userId query parameter is required" },
      { status: 400 }
    );
  }
  
  // Generate quick recommendations
  const userProfile = generateMockBioProfile(userId);
  const recommendations = curatorEngine.generateRecommendations(userProfile, 3);
  
  return NextResponse.json({
    success: true,
    userId,
    quickRecommendations: recommendations.map(r => ({
      productId: r.productId,
      name: r.product.name,
      nameKo: r.product.nameKo,
      bioCompatibilityScore: r.bioCompatibilityScore,
      primaryReason: r.reasoning.primary,
      predictedImprovement: r.predictedImpact.healthScoreDelta
    }))
  });
}






