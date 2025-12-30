"use client";

/**
 * ============================================================
 * WEATHER-HEALTH CORRELATION WIDGET
 * 날씨-건강 상관관계 AI 예측
 * ============================================================
 * 
 * 41-Persona Simulation: User #37 (폐암 생존자)
 * Issue: "공기질에 민감한데 미리 알려주면 좋겠다"
 * 
 * External Data Integration: NOAA/AirKorea API
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  Thermometer,
  AlertTriangle,
  ChevronRight,
  Droplets,
  Gauge
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ============================================
// TYPES
// ============================================

interface WeatherData {
  temperature: number;
  humidity: number;
  pm25: number;
  pm10: number;
  pressure: number;
  uvIndex: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'windy';
}

interface HealthPrediction {
  category: string;
  risk: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
  affectedBiomarkers: string[];
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_WEATHER: WeatherData = {
  temperature: 18,
  humidity: 65,
  pm25: 35,
  pm10: 48,
  pressure: 1008,
  uvIndex: 4,
  condition: 'cloudy'
};

const MOCK_PREDICTIONS: HealthPrediction[] = [
  {
    category: "관절 건강",
    risk: "high",
    message: "내일 기압이 급락합니다",
    recommendation: "관절 통증이 예상됩니다. 오늘 밤 따뜻한 목욕을 권장합니다.",
    affectedBiomarkers: ["Inflammation Marker", "CRP"]
  },
  {
    category: "호흡기",
    risk: "medium",
    message: "미세먼지 '보통' 수준",
    recommendation: "폐 기능 검사 값에 영향이 있을 수 있습니다. 외출 시 마스크를 착용하세요.",
    affectedBiomarkers: ["O2 Saturation", "Respiratory Rate"]
  }
];

// ============================================
// COMPONENTS
// ============================================

function WeatherIcon({ condition }: { condition: WeatherData['condition'] }) {
  switch (condition) {
    case 'sunny':
      return <Sun className="w-8 h-8 text-yellow-500" />;
    case 'rainy':
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    case 'windy':
      return <Wind className="w-8 h-8 text-gray-500" />;
    default:
      return <Cloud className="w-8 h-8 text-gray-400" />;
  }
}

function RiskBadge({ risk }: { risk: HealthPrediction['risk'] }) {
  const config = {
    low: { color: "bg-green-100 text-green-700 border-green-200", label: "낮음" },
    medium: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "주의" },
    high: { color: "bg-red-100 text-red-700 border-red-200", label: "높음" }
  };

  return (
    <Badge className={`${config[risk].color} border`}>
      {config[risk].label}
    </Badge>
  );
}

function AirQualityMeter({ pm25 }: { pm25: number }) {
  const getLevel = () => {
    if (pm25 <= 15) return { label: "좋음", color: "#10B981", percent: 25 };
    if (pm25 <= 35) return { label: "보통", color: "#F59E0B", percent: 50 };
    if (pm25 <= 75) return { label: "나쁨", color: "#EF4444", percent: 75 };
    return { label: "매우나쁨", color: "#7C2D12", percent: 100 };
  };

  const level = getLevel();

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: level.color }}
          initial={{ width: 0 }}
          animate={{ width: `${level.percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-medium" style={{ color: level.color }}>
        {level.label}
      </span>
    </div>
  );
}

function PredictionCard({ prediction, index }: { prediction: HealthPrediction; index: number }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div
        className={`p-3 rounded-xl border cursor-pointer transition-all ${
          prediction.risk === 'high' 
            ? 'bg-red-50/50 border-red-200 hover:bg-red-50' 
            : prediction.risk === 'medium'
            ? 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
            : 'bg-green-50/50 border-green-200 hover:bg-green-50'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {prediction.risk === 'high' && (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
            <span className="font-medium text-sm">{prediction.category}</span>
            <RiskBadge risk={prediction.risk} />
          </div>
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-1">{prediction.message}</p>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t space-y-2">
                <div className="text-xs">
                  <span className="font-medium">💡 권장사항:</span>
                  <p className="text-muted-foreground mt-1">{prediction.recommendation}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {prediction.affectedBiomarkers.map((marker) => (
                    <Badge key={marker} variant="outline" className="text-[10px]">
                      {marker}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN WIDGET
// ============================================

export function WeatherHealthWidget() {
  const [weather] = React.useState<WeatherData>(MOCK_WEATHER);
  const [predictions] = React.useState<HealthPrediction[]>(MOCK_PREDICTIONS);

  const hasHighRisk = predictions.some(p => p.risk === 'high');

  return (
    <Card className={`overflow-hidden ${
      hasHighRisk ? 'border-red-200 shadow-red-100' : ''
    }`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            <span className="font-semibold">날씨-건강 AI</span>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            실시간
          </Badge>
        </div>

        {/* Current Weather */}
        <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl mb-4">
          <WeatherIcon condition={weather.condition} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-red-400" />
              <span className="font-bold text-lg">{weather.temperature}°C</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                {weather.humidity}%
              </span>
              <span className="flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                {weather.pressure}hPa
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">미세먼지</div>
            <div className="text-sm font-medium">PM2.5 {weather.pm25}µg</div>
            <AirQualityMeter pm25={weather.pm25} />
          </div>
        </div>

        {/* Health Predictions */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            🔮 건강 영향 예측
          </div>
          {predictions.map((prediction, index) => (
            <PredictionCard 
              key={prediction.category}
              prediction={prediction}
              index={index}
            />
          ))}
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-4"
          onClick={() => window.location.href = '/insights/weather'}
        >
          상세 분석 보기
        </Button>
      </CardContent>
    </Card>
  );
}

export default WeatherHealthWidget;






