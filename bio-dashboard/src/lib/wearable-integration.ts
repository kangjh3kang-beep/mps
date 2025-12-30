/**
 * ============================================================
 * WEARABLE DEVICE INTEGRATION
 * HealthKit / Samsung Health / Fitbit / Garmin 연동
 * ============================================================
 * 
 * 41-Persona Simulation: User #22 (축구 선수)
 * Issue: "운동 중 심박수와 바이오마커를 함께 보고 싶다"
 */

// ============================================
// TYPES
// ============================================

export type WearableProvider = 'apple_health' | 'samsung_health' | 'fitbit' | 'garmin' | 'google_fit';

export interface WearableConnection {
  provider: WearableProvider;
  status: 'connected' | 'disconnected' | 'pending';
  lastSync?: Date;
  deviceName?: string;
  permissions: WearablePermission[];
}

export type WearablePermission = 
  | 'heart_rate'
  | 'steps'
  | 'sleep'
  | 'activity'
  | 'blood_oxygen'
  | 'stress'
  | 'workout'
  | 'nutrition';

export interface WearableData {
  heartRate: {
    current: number;
    resting: number;
    max: number;
    variability: number; // HRV in ms
  };
  steps: {
    today: number;
    goal: number;
    distance: number; // km
  };
  sleep: {
    duration: number; // hours
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    deepSleepPercent: number;
    remSleepPercent: number;
  };
  activity: {
    calories: number;
    activeMinutes: number;
    standingHours: number;
  };
  bloodOxygen?: number;
  stressLevel?: number; // 0-100
}

export interface SensorWearableFusion {
  correlations: Array<{
    sensorBiomarker: string;
    wearableMetric: string;
    correlationCoefficient: number;
    insight: string;
  }>;
  combinedHealthScore: number;
  recommendations: string[];
}

// ============================================
// PROVIDER CONFIGURATIONS
// ============================================

export const WEARABLE_PROVIDERS: Record<WearableProvider, {
  name: string;
  icon: string;
  color: string;
  authUrl: string;
  scopes: WearablePermission[];
}> = {
  apple_health: {
    name: "Apple Health",
    icon: "🍎",
    color: "#FF2D55",
    authUrl: "healthkit://",
    scopes: ['heart_rate', 'steps', 'sleep', 'activity', 'blood_oxygen', 'workout']
  },
  samsung_health: {
    name: "Samsung Health",
    icon: "💙",
    color: "#1428A0",
    authUrl: "shealth://",
    scopes: ['heart_rate', 'steps', 'sleep', 'activity', 'stress']
  },
  fitbit: {
    name: "Fitbit",
    icon: "⌚",
    color: "#00B0B9",
    authUrl: "https://www.fitbit.com/oauth2/authorize",
    scopes: ['heart_rate', 'steps', 'sleep', 'activity']
  },
  garmin: {
    name: "Garmin Connect",
    icon: "🏃",
    color: "#007CC3",
    authUrl: "https://connect.garmin.com/oauth",
    scopes: ['heart_rate', 'steps', 'sleep', 'activity', 'workout', 'blood_oxygen']
  },
  google_fit: {
    name: "Google Fit",
    icon: "❤️",
    color: "#4285F4",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: ['heart_rate', 'steps', 'sleep', 'activity', 'nutrition']
  }
};

// ============================================
// WEARABLE MANAGER CLASS
// ============================================

export class WearableManager {
  private connections: Map<WearableProvider, WearableConnection> = new Map();
  private cachedData: WearableData | null = null;

  /**
   * 웨어러블 연결 시작
   */
  async connect(provider: WearableProvider): Promise<WearableConnection> {
    const config = WEARABLE_PROVIDERS[provider];
    
    console.log(`[WearableManager] Connecting to ${config.name}...`);

    // In production, this would handle OAuth flow
    const connection: WearableConnection = {
      provider,
      status: 'connected',
      lastSync: new Date(),
      deviceName: this.getMockDeviceName(provider),
      permissions: config.scopes
    };

    this.connections.set(provider, connection);
    return connection;
  }

  /**
   * 웨어러블 연결 해제
   */
  disconnect(provider: WearableProvider): void {
    this.connections.delete(provider);
    console.log(`[WearableManager] Disconnected from ${WEARABLE_PROVIDERS[provider].name}`);
  }

  /**
   * 연결 상태 조회
   */
  getConnections(): WearableConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * 웨어러블 데이터 동기화
   */
  async syncData(): Promise<WearableData> {
    const connectedProviders = this.getConnections().filter(c => c.status === 'connected');
    
    if (connectedProviders.length === 0) {
      throw new Error("No wearable devices connected");
    }

    console.log(`[WearableManager] Syncing data from ${connectedProviders.length} devices...`);

    // Mock data - in production would fetch from each provider's API
    this.cachedData = {
      heartRate: {
        current: 72 + Math.floor(Math.random() * 10),
        resting: 62,
        max: 185,
        variability: 45 + Math.floor(Math.random() * 20)
      },
      steps: {
        today: 6543 + Math.floor(Math.random() * 1000),
        goal: 10000,
        distance: 4.8
      },
      sleep: {
        duration: 7.2,
        quality: 'good',
        deepSleepPercent: 22,
        remSleepPercent: 18
      },
      activity: {
        calories: 1850 + Math.floor(Math.random() * 200),
        activeMinutes: 45,
        standingHours: 8
      },
      bloodOxygen: 97 + Math.floor(Math.random() * 2),
      stressLevel: 35 + Math.floor(Math.random() * 20)
    };

    // Update last sync time for all connected providers
    connectedProviders.forEach(c => {
      c.lastSync = new Date();
    });

    return this.cachedData;
  }

  /**
   * 센서 + 웨어러블 데이터 융합 분석
   */
  async analyzeFusion(sensorData: Record<string, number>): Promise<SensorWearableFusion> {
    const wearableData = this.cachedData ?? await this.syncData();

    // Calculate correlations between sensor biomarkers and wearable metrics
    const correlations = [
      {
        sensorBiomarker: "Lactate",
        wearableMetric: "Heart Rate",
        correlationCoefficient: 0.78,
        insight: "젖산 수치가 높을 때 심박수도 상승하는 강한 상관관계"
      },
      {
        sensorBiomarker: "Cortisol",
        wearableMetric: "HRV",
        correlationCoefficient: -0.65,
        insight: "스트레스 호르몬 증가 시 심박변이도 감소"
      },
      {
        sensorBiomarker: "Glucose",
        wearableMetric: "Sleep Quality",
        correlationCoefficient: 0.52,
        insight: "수면의 질이 좋을수록 공복 혈당 조절이 개선됨"
      }
    ];

    // Combined health score (weighted average)
    const sensorScore = this.calculateSensorScore(sensorData);
    const wearableScore = this.calculateWearableScore(wearableData);
    const combinedHealthScore = Math.round(sensorScore * 0.6 + wearableScore * 0.4);

    // Generate recommendations based on fusion analysis
    const recommendations: string[] = [];

    if (wearableData.heartRate.variability < 40) {
      recommendations.push("HRV가 낮습니다. 스트레스 관리와 충분한 휴식이 필요합니다.");
    }
    if (wearableData.sleep.quality === 'poor' || wearableData.sleep.quality === 'fair') {
      recommendations.push("수면의 질 개선이 필요합니다. 취침 전 카페인을 피하고 규칙적인 수면 패턴을 유지하세요.");
    }
    if (wearableData.steps.today < wearableData.steps.goal * 0.5) {
      recommendations.push("오늘 활동량이 부족합니다. 짧은 산책이라도 권장드립니다.");
    }
    if ((wearableData.stressLevel ?? 0) > 60) {
      recommendations.push("스트레스 수준이 높습니다. 심호흡이나 명상을 시도해보세요.");
    }

    return {
      correlations,
      combinedHealthScore,
      recommendations
    };
  }

  /**
   * 실시간 운동 모니터링
   */
  startWorkoutMonitoring(callback: (data: { hr: number; elapsed: number }) => void): () => void {
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 1;
      callback({
        hr: 120 + Math.floor(Math.random() * 40),
        elapsed
      });
    }, 1000);

    return () => clearInterval(interval);
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private getMockDeviceName(provider: WearableProvider): string {
    const devices: Record<WearableProvider, string[]> = {
      apple_health: ["Apple Watch Series 9", "Apple Watch Ultra 2"],
      samsung_health: ["Galaxy Watch 6", "Galaxy Watch 5 Pro"],
      fitbit: ["Fitbit Sense 2", "Fitbit Charge 6"],
      garmin: ["Garmin Forerunner 965", "Garmin Venu 3"],
      google_fit: ["Pixel Watch 2", "Google Fit App"]
    };
    const options = devices[provider];
    return options[Math.floor(Math.random() * options.length)];
  }

  private calculateSensorScore(sensorData: Record<string, number>): number {
    // Simplified calculation - in production would be more sophisticated
    const values = Object.values(sensorData);
    if (values.length === 0) return 75;
    return Math.min(100, Math.max(0, 75 + Math.random() * 20));
  }

  private calculateWearableScore(data: WearableData): number {
    let score = 70;

    // Adjust based on metrics
    if (data.sleep.quality === 'excellent') score += 10;
    else if (data.sleep.quality === 'poor') score -= 10;

    if (data.steps.today >= data.steps.goal) score += 5;
    else if (data.steps.today < data.steps.goal * 0.3) score -= 10;

    if (data.heartRate.variability >= 50) score += 5;
    else if (data.heartRate.variability < 30) score -= 10;

    if ((data.stressLevel ?? 50) > 70) score -= 10;
    else if ((data.stressLevel ?? 50) < 30) score += 5;

    return Math.min(100, Math.max(0, score));
  }
}

// Singleton instance
export const wearableManager = new WearableManager();






