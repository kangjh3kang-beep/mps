/**
 * ============================================================
 * INNOVATION #4: WEATHER-HEALTH AI CORRELATION SYSTEM
 * 날씨-건강 AI 상관관계 시스템
 * Proposed by: User 37 (폐암 생존자)
 * ============================================================
 */

// ============================================
// TYPES & INTERFACES
// ============================================

export interface WeatherData {
  timestamp: Date;
  location: {
    city: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: CurrentWeather;
  forecast: ForecastWeather[];
  airQuality: AirQualityData;
}

export interface CurrentWeather {
  temperature: number;        // Celsius
  feelsLike: number;
  humidity: number;           // %
  pressure: number;           // hPa
  pressureTrend: 'rising' | 'stable' | 'falling';
  uvIndex: number;
  visibility: number;         // km
  windSpeed: number;          // m/s
  weatherCode: WeatherCode;
  description: string;
}

export type WeatherCode = 
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rain'
  | 'thunderstorm'
  | 'snow'
  | 'fog'
  | 'dust';

export interface ForecastWeather {
  date: Date;
  tempHigh: number;
  tempLow: number;
  humidity: number;
  pressure: number;
  precipitationChance: number;
  weatherCode: WeatherCode;
  airQualityForecast: AirQualityLevel;
}

export interface AirQualityData {
  aqi: number;                // Air Quality Index (0-500)
  level: AirQualityLevel;
  pm25: number;               // μg/m³
  pm10: number;               // μg/m³
  o3: number;                 // Ozone ppb
  no2: number;                // Nitrogen Dioxide ppb
  so2: number;                // Sulfur Dioxide ppb
  co: number;                 // Carbon Monoxide ppm
  dominantPollutant: string;
}

export type AirQualityLevel = 
  | 'good'           // 0-50
  | 'moderate'       // 51-100
  | 'unhealthy_sensitive' // 101-150
  | 'unhealthy'      // 151-200
  | 'very_unhealthy' // 201-300
  | 'hazardous';     // 301-500

export interface HealthCondition {
  type: HealthConditionType;
  severity: 'mild' | 'moderate' | 'severe';
  triggers: WeatherTrigger[];
}

export type HealthConditionType = 
  | 'asthma'
  | 'copd'
  | 'allergies'
  | 'arthritis'
  | 'migraine'
  | 'heart_disease'
  | 'skin_condition'
  | 'respiratory_sensitivity';

export type WeatherTrigger = 
  | 'high_pm25'
  | 'low_pressure'
  | 'pressure_drop'
  | 'high_humidity'
  | 'low_humidity'
  | 'cold_temperature'
  | 'hot_temperature'
  | 'high_uv'
  | 'high_pollen'
  | 'thunderstorm';

export interface WeatherHealthAlert {
  id: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  affectedConditions: HealthConditionType[];
  recommendations: string[];
  duration: {
    start: Date;
    end: Date;
  };
}

export interface WeatherHealthCorrelation {
  date: Date;
  weatherFactors: {
    factor: string;
    value: number;
    unit: string;
  }[];
  healthMetrics: {
    metric: string;
    value: number;
    change: number; // vs previous day
  }[];
  correlationScore: number; // -1 to 1
  insight: string;
}

export interface PersonalWeatherProfile {
  userId: string;
  conditions: HealthCondition[];
  sensitivities: {
    trigger: WeatherTrigger;
    sensitivity: number; // 0-100
    lastTriggered?: Date;
  }[];
  preferredAlertTiming: number; // hours before event
  notificationPreferences: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
}

// ============================================
// WEATHER-HEALTH CORRELATION ENGINE
// ============================================

export class WeatherHealthAI {
  private userProfile: PersonalWeatherProfile | null = null;
  private correlationHistory: WeatherHealthCorrelation[] = [];

  /**
   * Initialize with user's health profile
   */
  initialize(profile: PersonalWeatherProfile): void {
    this.userProfile = profile;
  }

  /**
   * Fetch current weather data (mock)
   */
  async fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
    // In production, call actual weather API (OpenWeatherMap, etc.)
    return this.mockWeatherData(lat, lon);
  }

  /**
   * Analyze weather impact on user's health
   */
  analyzeWeatherImpact(
    weather: WeatherData,
    currentHealthMetrics: {
      respiratoryScore: number;
      inflammationLevel: number;
      painLevel: number;
      energyLevel: number;
    }
  ): {
    riskScore: number;
    alerts: WeatherHealthAlert[];
    recommendations: string[];
    hourlyRiskForecast: { hour: number; risk: number }[];
  } {
    const alerts: WeatherHealthAlert[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Analyze air quality
    if (weather.airQuality.aqi > 100) {
      riskScore += 30;
      alerts.push(this.createAlert(
        'warning',
        '공기질 주의',
        `현재 AQI ${weather.airQuality.aqi}로 민감군에게 해로울 수 있습니다. 주요 오염물질: ${weather.airQuality.dominantPollutant}`,
        ['asthma', 'copd', 'respiratory_sensitivity'],
        ['외출 시 KF94 마스크 착용', '가급적 실내 활동 권장', '공기청정기 가동']
      ));
    }

    if (weather.airQuality.pm25 > 35) {
      riskScore += 20;
      recommendations.push(`🌫️ 미세먼지(PM2.5) ${weather.airQuality.pm25}μg/m³ - 환기를 자제하세요`);
    }

    // Analyze pressure changes
    if (weather.current.pressureTrend === 'falling') {
      riskScore += 15;
      alerts.push(this.createAlert(
        'info',
        '기압 하강 중',
        '기압이 떨어지고 있습니다. 관절통이나 편두통이 있으신 분은 주의하세요.',
        ['arthritis', 'migraine'],
        ['진통제 미리 준비', '충분한 수분 섭취', '격렬한 운동 자제']
      ));
    }

    // Check user-specific sensitivities
    if (this.userProfile) {
      for (const condition of this.userProfile.conditions) {
        const conditionRisk = this.assessConditionRisk(condition, weather);
        riskScore += conditionRisk.additionalRisk;
        recommendations.push(...conditionRisk.recommendations);
      }
    }

    // UV Index warning
    if (weather.current.uvIndex > 7) {
      recommendations.push(`☀️ UV 지수 ${weather.current.uvIndex} - 자외선 차단제 필수, 오전 11시~오후 3시 외출 자제`);
    }

    // Temperature extremes
    if (weather.current.temperature > 35) {
      riskScore += 25;
      alerts.push(this.createAlert(
        'danger',
        '폭염 경보',
        `현재 기온 ${weather.current.temperature}°C - 열사병 위험`,
        ['heart_disease'],
        ['충분한 수분 섭취 (시간당 250ml)', '에어컨이 있는 실내에 머무르기', '격렬한 야외 활동 금지']
      ));
    } else if (weather.current.temperature < -10) {
      riskScore += 20;
      alerts.push(this.createAlert(
        'warning',
        '한파 주의',
        `현재 기온 ${weather.current.temperature}°C - 동상 및 저체온증 위험`,
        ['heart_disease', 'arthritis'],
        ['보온에 신경쓰기', '심장 질환자는 갑작스러운 추위 노출 피하기']
      ));
    }

    // Generate hourly forecast
    const hourlyRiskForecast = this.generateHourlyRiskForecast(weather);

    // Normalize risk score
    riskScore = Math.min(100, Math.max(0, riskScore));

    return {
      riskScore,
      alerts,
      recommendations,
      hourlyRiskForecast,
    };
  }

  /**
   * Correlate historical weather with health data
   */
  analyzeHistoricalCorrelation(
    weatherHistory: WeatherData[],
    healthHistory: { date: Date; metrics: Record<string, number> }[]
  ): WeatherHealthCorrelation[] {
    const correlations: WeatherHealthCorrelation[] = [];

    for (let i = 1; i < Math.min(weatherHistory.length, healthHistory.length); i++) {
      const weather = weatherHistory[i];
      const health = healthHistory[i];
      const prevHealth = healthHistory[i - 1];

      const weatherFactors = [
        { factor: 'PM2.5', value: weather.airQuality.pm25, unit: 'μg/m³' },
        { factor: '기압', value: weather.current.pressure, unit: 'hPa' },
        { factor: '습도', value: weather.current.humidity, unit: '%' },
        { factor: '기온', value: weather.current.temperature, unit: '°C' },
      ];

      const healthMetrics = Object.entries(health.metrics).map(([metric, value]) => ({
        metric,
        value,
        change: value - (prevHealth.metrics[metric] || value),
      }));

      // Calculate correlation (simplified)
      const correlationScore = this.calculateCorrelation(weather, health, prevHealth);

      correlations.push({
        date: health.date,
        weatherFactors,
        healthMetrics,
        correlationScore,
        insight: this.generateInsight(correlationScore, weatherFactors, healthMetrics),
      });
    }

    this.correlationHistory = correlations;
    return correlations;
  }

  /**
   * Get personalized weather briefing
   */
  getDailyBriefing(weather: WeatherData): string {
    const lines: string[] = [];
    
    lines.push(`🌤️ 오늘의 날씨-건강 브리핑`);
    lines.push(`📍 ${weather.location.city}, ${weather.current.description}`);
    lines.push(`🌡️ 현재 ${weather.current.temperature}°C (체감 ${weather.current.feelsLike}°C)`);
    
    // Air quality summary
    const aqEmoji = weather.airQuality.aqi <= 50 ? '😊' : weather.airQuality.aqi <= 100 ? '😐' : '😷';
    lines.push(`${aqEmoji} 공기질: ${this.getAqiDescription(weather.airQuality.level)} (AQI ${weather.airQuality.aqi})`);
    
    // Pressure trend
    const pressureEmoji = weather.current.pressureTrend === 'falling' ? '📉' : weather.current.pressureTrend === 'rising' ? '📈' : '➡️';
    lines.push(`${pressureEmoji} 기압: ${weather.current.pressure}hPa (${this.getPressureTrendKorean(weather.current.pressureTrend)})`);

    // Personalized advice
    if (this.userProfile) {
      const impact = this.analyzeWeatherImpact(weather, {
        respiratoryScore: 80,
        inflammationLevel: 3,
        painLevel: 2,
        energyLevel: 70,
      });

      if (impact.riskScore > 50) {
        lines.push(`\n⚠️ 오늘은 건강 관리에 주의가 필요한 날이에요.`);
      } else if (impact.riskScore < 20) {
        lines.push(`\n✅ 오늘 날씨는 건강에 좋은 편이에요!`);
      }

      if (impact.recommendations.length > 0) {
        lines.push(`\n📋 오늘의 추천:`);
        impact.recommendations.slice(0, 3).forEach(rec => lines.push(`• ${rec}`));
      }
    }

    return lines.join('\n');
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private mockWeatherData(lat: number, lon: number): WeatherData {
    const now = new Date();
    
    return {
      timestamp: now,
      location: {
        city: '서울',
        country: 'KR',
        lat,
        lon,
      },
      current: {
        temperature: 15 + Math.random() * 10,
        feelsLike: 14 + Math.random() * 10,
        humidity: 40 + Math.random() * 40,
        pressure: 1000 + Math.random() * 30,
        pressureTrend: ['rising', 'stable', 'falling'][Math.floor(Math.random() * 3)] as 'rising' | 'stable' | 'falling',
        uvIndex: Math.floor(Math.random() * 11),
        visibility: 8 + Math.random() * 12,
        windSpeed: Math.random() * 10,
        weatherCode: 'partly_cloudy',
        description: '구름 조금',
      },
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
        tempHigh: 18 + Math.random() * 8,
        tempLow: 8 + Math.random() * 5,
        humidity: 50 + Math.random() * 30,
        pressure: 1005 + Math.random() * 20,
        precipitationChance: Math.random() * 100,
        weatherCode: ['clear', 'partly_cloudy', 'cloudy', 'rain'][Math.floor(Math.random() * 4)] as WeatherCode,
        airQualityForecast: ['good', 'moderate', 'unhealthy_sensitive'][Math.floor(Math.random() * 3)] as AirQualityLevel,
      })),
      airQuality: {
        aqi: 30 + Math.floor(Math.random() * 120),
        level: this.getAqiLevel(30 + Math.floor(Math.random() * 120)),
        pm25: 10 + Math.random() * 60,
        pm10: 20 + Math.random() * 80,
        o3: 20 + Math.random() * 40,
        no2: 10 + Math.random() * 30,
        so2: 2 + Math.random() * 8,
        co: 0.2 + Math.random() * 0.8,
        dominantPollutant: 'PM2.5',
      },
    };
  }

  private getAqiLevel(aqi: number): AirQualityLevel {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'unhealthy_sensitive';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'very_unhealthy';
    return 'hazardous';
  }

  private getAqiDescription(level: AirQualityLevel): string {
    const descriptions: Record<AirQualityLevel, string> = {
      good: '좋음',
      moderate: '보통',
      unhealthy_sensitive: '민감군 영향',
      unhealthy: '나쁨',
      very_unhealthy: '매우 나쁨',
      hazardous: '위험',
    };
    return descriptions[level];
  }

  private getPressureTrendKorean(trend: 'rising' | 'stable' | 'falling'): string {
    const korean: Record<string, string> = {
      rising: '상승 중',
      stable: '안정',
      falling: '하강 중',
    };
    return korean[trend];
  }

  private createAlert(
    severity: 'info' | 'warning' | 'danger',
    title: string,
    message: string,
    affectedConditions: HealthConditionType[],
    recommendations: string[]
  ): WeatherHealthAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      severity,
      title,
      message,
      affectedConditions,
      recommendations,
      duration: {
        start: new Date(),
        end: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
      },
    };
  }

  private assessConditionRisk(
    condition: HealthCondition,
    weather: WeatherData
  ): { additionalRisk: number; recommendations: string[] } {
    let additionalRisk = 0;
    const recommendations: string[] = [];

    switch (condition.type) {
      case 'asthma':
      case 'copd':
      case 'respiratory_sensitivity':
        if (weather.airQuality.pm25 > 35) {
          additionalRisk += 25;
          recommendations.push('🫁 호흡기 보호를 위해 외출을 자제하세요');
        }
        break;
      case 'arthritis':
        if (weather.current.pressureTrend === 'falling') {
          additionalRisk += 20;
          recommendations.push('🦴 기압 하강으로 관절통이 심해질 수 있어요');
        }
        break;
      case 'migraine':
        if (weather.current.pressureTrend === 'falling' || weather.current.humidity > 80) {
          additionalRisk += 15;
          recommendations.push('🧠 편두통 약을 미리 준비하세요');
        }
        break;
      case 'heart_disease':
        if (weather.current.temperature > 30 || weather.current.temperature < 0) {
          additionalRisk += 30;
          recommendations.push('❤️ 극한 기온에서는 심장에 부담이 갈 수 있어요');
        }
        break;
    }

    return { additionalRisk, recommendations };
  }

  private generateHourlyRiskForecast(weather: WeatherData): { hour: number; risk: number }[] {
    const forecast: { hour: number; risk: number }[] = [];
    const baseRisk = weather.airQuality.aqi / 5;

    for (let hour = 0; hour < 24; hour++) {
      let risk = baseRisk;

      // Higher risk during peak pollution hours
      if (hour >= 7 && hour <= 9) risk += 10;
      if (hour >= 17 && hour <= 19) risk += 10;

      // Higher risk during peak UV hours
      if (hour >= 11 && hour <= 15) risk += weather.current.uvIndex;

      forecast.push({
        hour,
        risk: Math.min(100, Math.max(0, risk)),
      });
    }

    return forecast;
  }

  private calculateCorrelation(
    weather: WeatherData,
    health: { date: Date; metrics: Record<string, number> },
    prevHealth: { date: Date; metrics: Record<string, number> }
  ): number {
    // Simplified correlation calculation
    let correlation = 0;

    // PM2.5 vs respiratory
    if (weather.airQuality.pm25 > 35 && health.metrics.respiratoryScore < prevHealth.metrics.respiratoryScore) {
      correlation += 0.3;
    }

    // Pressure vs pain
    if (weather.current.pressureTrend === 'falling' && health.metrics.painLevel > prevHealth.metrics.painLevel) {
      correlation += 0.3;
    }

    return Math.min(1, Math.max(-1, correlation));
  }

  private generateInsight(
    correlation: number,
    weatherFactors: { factor: string; value: number; unit: string }[],
    healthMetrics: { metric: string; value: number; change: number }[]
  ): string {
    if (Math.abs(correlation) < 0.2) {
      return '오늘 날씨와 건강 상태 사이에 뚜렷한 상관관계가 없어요.';
    }

    const pm25 = weatherFactors.find(f => f.factor === 'PM2.5');
    const respiratory = healthMetrics.find(m => m.metric === 'respiratoryScore');

    if (pm25 && pm25.value > 50 && respiratory && respiratory.change < -5) {
      return `미세먼지(${pm25.value}${pm25.unit})가 높아 호흡기 점수가 ${Math.abs(respiratory.change)}점 하락했어요.`;
    }

    return `날씨 변화가 건강에 ${correlation > 0 ? '부정적' : '긍정적'} 영향을 주고 있어요.`;
  }
}

// Singleton instance
export const weatherHealthAI = new WeatherHealthAI();




