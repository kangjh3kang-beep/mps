/**
 * ============================================================
 * INNOVATION #2: WEARABLE FUSION SYSTEM
 * 웨어러블 퓨전 - Apple Watch / Galaxy Watch 연동
 * Proposed by: User 22 (축구선수) + User 11 (반도체 개발자)
 * ============================================================
 */

// ============================================
// TYPES & INTERFACES
// ============================================

export type WearableType = 
  | 'apple_watch'
  | 'galaxy_watch'
  | 'fitbit'
  | 'garmin'
  | 'xiaomi'
  | 'oura_ring'
  | 'whoop';

export interface WearableDevice {
  id: string;
  type: WearableType;
  name: string;
  model: string;
  firmwareVersion: string;
  batteryLevel: number;
  lastSync: Date;
  isConnected: boolean;
  capabilities: WearableCapability[];
}

export type WearableCapability = 
  | 'heart_rate'
  | 'hrv'
  | 'spo2'
  | 'steps'
  | 'calories'
  | 'sleep'
  | 'stress'
  | 'ecg'
  | 'blood_pressure'
  | 'body_temperature'
  | 'respiratory_rate'
  | 'elevation'
  | 'gps';

export interface WearableDataPoint {
  timestamp: Date;
  type: WearableCapability;
  value: number;
  unit: string;
  confidence: number;  // 0-1
}

export interface WearableSession {
  id: string;
  deviceId: string;
  startTime: Date;
  endTime?: Date;
  activityType: ActivityType;
  dataPoints: WearableDataPoint[];
  summary?: SessionSummary;
}

export type ActivityType = 
  | 'resting'
  | 'walking'
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'workout'
  | 'soccer'
  | 'basketball'
  | 'golf'
  | 'yoga'
  | 'sleeping';

export interface SessionSummary {
  duration: number;           // seconds
  avgHeartRate: number;
  maxHeartRate: number;
  minHeartRate: number;
  hrv: number;
  calories: number;
  steps?: number;
  distance?: number;          // meters
  stressScore: number;        // 0-100
  recoveryScore: number;      // 0-100
}

export interface FusedHealthData {
  timestamp: Date;
  
  // Manpasik sensor data
  manpasikData: {
    glucose: number;
    lactate: number;
    cortisol: number;
    inflammation: number;
    hydration: number;
  };
  
  // Wearable data
  wearableData: {
    heartRate: number;
    hrv: number;
    spo2: number;
    steps: number;
    calories: number;
    stress: number;
    bodyTemp: number;
  };
  
  // Fused insights
  fusedInsights: {
    overallHealthScore: number;
    fatigueLevel: number;
    recoveryStatus: string;
    performanceReadiness: number;
    recommendations: string[];
  };
}

// ============================================
// WEARABLE CONNECTION PROTOCOLS
// ============================================

export const WEARABLE_PROTOCOLS: Record<WearableType, {
  protocol: string;
  sdkUrl: string;
  authType: string;
  dataFormat: string;
}> = {
  apple_watch: {
    protocol: 'HealthKit',
    sdkUrl: 'https://developer.apple.com/healthkit/',
    authType: 'OAuth2 + Apple Sign In',
    dataFormat: 'HKQuantityType',
  },
  galaxy_watch: {
    protocol: 'Samsung Health SDK',
    sdkUrl: 'https://developer.samsung.com/health',
    authType: 'Samsung Account OAuth2',
    dataFormat: 'HealthDataStore',
  },
  fitbit: {
    protocol: 'Fitbit Web API',
    sdkUrl: 'https://dev.fitbit.com/build/reference/web-api/',
    authType: 'OAuth2',
    dataFormat: 'JSON REST',
  },
  garmin: {
    protocol: 'Garmin Connect IQ',
    sdkUrl: 'https://developer.garmin.com/connect-iq/',
    authType: 'OAuth1.0a',
    dataFormat: 'FIT Protocol',
  },
  xiaomi: {
    protocol: 'Mi Fit API',
    sdkUrl: 'https://dev.mi.com/',
    authType: 'Xiaomi Account OAuth2',
    dataFormat: 'JSON REST',
  },
  oura_ring: {
    protocol: 'Oura Cloud API',
    sdkUrl: 'https://cloud.ouraring.com/docs/',
    authType: 'OAuth2',
    dataFormat: 'JSON REST',
  },
  whoop: {
    protocol: 'WHOOP API',
    sdkUrl: 'https://developer.whoop.com/',
    authType: 'OAuth2',
    dataFormat: 'JSON REST',
  },
};

// ============================================
// WEARABLE FUSION MANAGER
// ============================================

export class WearableFusionManager {
  private connectedDevices: Map<string, WearableDevice> = new Map();
  private activeSessions: Map<string, WearableSession> = new Map();
  private dataBuffer: WearableDataPoint[] = [];

  /**
   * Connect to a wearable device
   */
  async connect(type: WearableType, authToken: string): Promise<WearableDevice> {
    const protocol = WEARABLE_PROTOCOLS[type];
    
    console.log(`[WearableFusion] Connecting via ${protocol.protocol}...`);
    
    // Simulate device connection
    const device: WearableDevice = {
      id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: this.getDeviceName(type),
      model: this.getDeviceModel(type),
      firmwareVersion: '1.0.0',
      batteryLevel: Math.floor(Math.random() * 50) + 50,
      lastSync: new Date(),
      isConnected: true,
      capabilities: this.getDeviceCapabilities(type),
    };
    
    this.connectedDevices.set(device.id, device);
    
    // Start background sync
    this.startBackgroundSync(device.id);
    
    return device;
  }

  /**
   * Disconnect device
   */
  disconnect(deviceId: string): void {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      device.isConnected = false;
      this.connectedDevices.delete(deviceId);
    }
  }

  /**
   * Get connected devices
   */
  getConnectedDevices(): WearableDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  /**
   * Start real-time data streaming
   */
  startStreaming(
    deviceId: string, 
    onData: (data: WearableDataPoint) => void
  ): () => void {
    const interval = setInterval(() => {
      const device = this.connectedDevices.get(deviceId);
      if (!device || !device.isConnected) {
        clearInterval(interval);
        return;
      }

      // Simulate real-time data
      const dataPoint = this.generateDataPoint(device);
      this.dataBuffer.push(dataPoint);
      onData(dataPoint);
    }, 1000); // 1Hz

    return () => clearInterval(interval);
  }

  /**
   * Start activity session
   */
  startSession(deviceId: string, activityType: ActivityType): WearableSession {
    const session: WearableSession = {
      id: `session_${Date.now()}`,
      deviceId,
      startTime: new Date(),
      activityType,
      dataPoints: [],
    };

    this.activeSessions.set(session.id, session);
    return session;
  }

  /**
   * End activity session
   */
  endSession(sessionId: string): WearableSession | undefined {
    const session = this.activeSessions.get(sessionId);
    if (!session) return undefined;

    session.endTime = new Date();
    session.summary = this.calculateSessionSummary(session);
    
    this.activeSessions.delete(sessionId);
    return session;
  }

  /**
   * Fuse Manpasik sensor data with wearable data
   */
  fuseData(
    manpasikReading: {
      glucose: number;
      lactate: number;
      cortisol: number;
      inflammation: number;
      hydration: number;
    },
    wearableData: WearableDataPoint[]
  ): FusedHealthData {
    // Extract wearable metrics
    const heartRate = this.extractMetric(wearableData, 'heart_rate') || 70;
    const hrv = this.extractMetric(wearableData, 'hrv') || 50;
    const spo2 = this.extractMetric(wearableData, 'spo2') || 98;
    const steps = this.extractMetric(wearableData, 'steps') || 0;
    const calories = this.extractMetric(wearableData, 'calories') || 0;
    const stress = this.extractMetric(wearableData, 'stress') || 30;
    const bodyTemp = this.extractMetric(wearableData, 'body_temperature') || 36.5;

    // Calculate fused insights
    const overallHealthScore = this.calculateFusedHealthScore(manpasikReading, {
      heartRate, hrv, spo2, stress,
    });
    
    const fatigueLevel = this.calculateFatigueLevel(manpasikReading.lactate, hrv, heartRate);
    const recoveryStatus = this.getRecoveryStatus(hrv, manpasikReading.cortisol);
    const performanceReadiness = this.calculatePerformanceReadiness(
      manpasikReading, { heartRate, hrv, spo2, stress }
    );
    
    const recommendations = this.generateFusedRecommendations(
      manpasikReading, { heartRate, hrv, stress }, fatigueLevel
    );

    return {
      timestamp: new Date(),
      manpasikData: manpasikReading,
      wearableData: {
        heartRate, hrv, spo2, steps, calories, stress, bodyTemp,
      },
      fusedInsights: {
        overallHealthScore,
        fatigueLevel,
        recoveryStatus,
        performanceReadiness,
        recommendations,
      },
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private getDeviceName(type: WearableType): string {
    const names: Record<WearableType, string> = {
      apple_watch: 'Apple Watch',
      galaxy_watch: 'Galaxy Watch',
      fitbit: 'Fitbit',
      garmin: 'Garmin',
      xiaomi: 'Mi Band',
      oura_ring: 'Oura Ring',
      whoop: 'WHOOP',
    };
    return names[type];
  }

  private getDeviceModel(type: WearableType): string {
    const models: Record<WearableType, string> = {
      apple_watch: 'Series 9',
      galaxy_watch: 'Watch 6',
      fitbit: 'Sense 2',
      garmin: 'Fenix 7',
      xiaomi: 'Band 8',
      oura_ring: 'Gen 3',
      whoop: '4.0',
    };
    return models[type];
  }

  private getDeviceCapabilities(type: WearableType): WearableCapability[] {
    const capabilities: Record<WearableType, WearableCapability[]> = {
      apple_watch: ['heart_rate', 'hrv', 'spo2', 'steps', 'calories', 'sleep', 'ecg', 'body_temperature'],
      galaxy_watch: ['heart_rate', 'hrv', 'spo2', 'steps', 'calories', 'sleep', 'stress', 'blood_pressure'],
      fitbit: ['heart_rate', 'hrv', 'spo2', 'steps', 'calories', 'sleep', 'stress'],
      garmin: ['heart_rate', 'hrv', 'spo2', 'steps', 'calories', 'sleep', 'stress', 'gps', 'elevation'],
      xiaomi: ['heart_rate', 'spo2', 'steps', 'calories', 'sleep'],
      oura_ring: ['heart_rate', 'hrv', 'body_temperature', 'sleep', 'respiratory_rate'],
      whoop: ['heart_rate', 'hrv', 'sleep', 'stress', 'respiratory_rate'],
    };
    return capabilities[type];
  }

  private startBackgroundSync(deviceId: string): void {
    // Simulate background sync every 5 minutes
    setInterval(() => {
      const device = this.connectedDevices.get(deviceId);
      if (device) {
        device.lastSync = new Date();
        device.batteryLevel = Math.max(0, device.batteryLevel - 1);
      }
    }, 300000);
  }

  private generateDataPoint(device: WearableDevice): WearableDataPoint {
    const capability = device.capabilities[Math.floor(Math.random() * device.capabilities.length)];
    
    const values: Record<WearableCapability, { value: number; unit: string }> = {
      heart_rate: { value: 60 + Math.random() * 40, unit: 'bpm' },
      hrv: { value: 30 + Math.random() * 50, unit: 'ms' },
      spo2: { value: 95 + Math.random() * 4, unit: '%' },
      steps: { value: Math.floor(Math.random() * 100), unit: 'steps' },
      calories: { value: Math.floor(Math.random() * 10), unit: 'kcal' },
      sleep: { value: Math.random() * 8, unit: 'hours' },
      stress: { value: Math.random() * 100, unit: 'score' },
      ecg: { value: Math.random() * 2 - 1, unit: 'mV' },
      blood_pressure: { value: 110 + Math.random() * 30, unit: 'mmHg' },
      body_temperature: { value: 36 + Math.random() * 1.5, unit: '°C' },
      respiratory_rate: { value: 12 + Math.random() * 8, unit: 'bpm' },
      elevation: { value: Math.random() * 100, unit: 'm' },
      gps: { value: 0, unit: 'coords' },
    };

    const { value, unit } = values[capability];
    
    return {
      timestamp: new Date(),
      type: capability,
      value,
      unit,
      confidence: 0.85 + Math.random() * 0.15,
    };
  }

  private calculateSessionSummary(session: WearableSession): SessionSummary {
    const heartRates = session.dataPoints
      .filter(d => d.type === 'heart_rate')
      .map(d => d.value);
    
    const duration = session.endTime 
      ? (session.endTime.getTime() - session.startTime.getTime()) / 1000 
      : 0;

    return {
      duration,
      avgHeartRate: heartRates.length > 0 ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : 70,
      maxHeartRate: heartRates.length > 0 ? Math.max(...heartRates) : 100,
      minHeartRate: heartRates.length > 0 ? Math.min(...heartRates) : 60,
      hrv: 45 + Math.random() * 20,
      calories: Math.floor(duration / 60 * 5),
      steps: Math.floor(duration / 60 * 100),
      distance: Math.floor(duration / 60 * 80),
      stressScore: 20 + Math.random() * 40,
      recoveryScore: 60 + Math.random() * 30,
    };
  }

  private extractMetric(data: WearableDataPoint[], type: WearableCapability): number | undefined {
    const points = data.filter(d => d.type === type);
    if (points.length === 0) return undefined;
    return points[points.length - 1].value;
  }

  private calculateFusedHealthScore(
    manpasik: { glucose: number; lactate: number; cortisol: number; inflammation: number; hydration: number },
    wearable: { heartRate: number; hrv: number; spo2: number; stress: number }
  ): number {
    let score = 100;
    
    // Manpasik factors (60% weight)
    if (manpasik.glucose < 70 || manpasik.glucose > 140) score -= 10;
    if (manpasik.lactate > 4) score -= 8;
    if (manpasik.cortisol > 25) score -= 7;
    if (manpasik.inflammation > 5) score -= 10;
    if (manpasik.hydration < 60) score -= 5;
    
    // Wearable factors (40% weight)
    if (wearable.heartRate > 100) score -= 5;
    if (wearable.hrv < 30) score -= 7;
    if (wearable.spo2 < 95) score -= 10;
    if (wearable.stress > 70) score -= 8;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateFatigueLevel(lactate: number, hrv: number, heartRate: number): number {
    // Higher lactate, lower HRV, higher HR = more fatigue
    const lactateFactor = Math.min(lactate / 8, 1) * 40;
    const hrvFactor = Math.max(0, (60 - hrv) / 60) * 30;
    const hrFactor = Math.max(0, (heartRate - 60) / 60) * 30;
    
    return Math.min(100, lactateFactor + hrvFactor + hrFactor);
  }

  private getRecoveryStatus(hrv: number, cortisol: number): string {
    if (hrv > 50 && cortisol < 15) return '완벽한 회복 상태';
    if (hrv > 40 && cortisol < 20) return '양호한 회복 상태';
    if (hrv > 30 && cortisol < 25) return '보통 회복 상태';
    return '회복 필요 - 휴식 권장';
  }

  private calculatePerformanceReadiness(
    manpasik: { glucose: number; lactate: number; hydration: number },
    wearable: { heartRate: number; hrv: number; spo2: number; stress: number }
  ): number {
    let readiness = 100;
    
    // Energy availability
    if (manpasik.glucose < 80) readiness -= 15;
    if (manpasik.lactate > 2) readiness -= 10;
    if (manpasik.hydration < 70) readiness -= 10;
    
    // Physical state
    if (wearable.hrv < 40) readiness -= 15;
    if (wearable.spo2 < 96) readiness -= 10;
    if (wearable.stress > 50) readiness -= 10;
    
    return Math.max(0, Math.min(100, readiness));
  }

  private generateFusedRecommendations(
    manpasik: { glucose: number; lactate: number; cortisol: number; hydration: number },
    wearable: { heartRate: number; hrv: number; stress: number },
    fatigueLevel: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (fatigueLevel > 70) {
      recommendations.push('🛑 높은 피로도 감지. 오늘은 격렬한 운동을 피하세요.');
    }
    
    if (manpasik.lactate > 4) {
      recommendations.push('🏃 젖산 수치가 높습니다. 가벼운 스트레칭으로 회복하세요.');
    }
    
    if (wearable.hrv < 30) {
      recommendations.push('💤 HRV가 낮습니다. 수면의 질을 개선하세요.');
    }
    
    if (manpasik.hydration < 60) {
      recommendations.push('💧 탈수 상태입니다. 지금 바로 물 500ml를 마시세요.');
    }
    
    if (wearable.stress > 70) {
      recommendations.push('🧘 스트레스가 높습니다. 5분간 호흡 운동을 시도하세요.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ 컨디션이 좋습니다! 오늘 운동하기 좋은 날이에요.');
    }
    
    return recommendations;
  }
}

// Singleton instance
export const wearableFusionManager = new WearableFusionManager();




