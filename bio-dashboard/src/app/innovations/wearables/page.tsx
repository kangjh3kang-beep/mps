"use client";

/**
 * Wearable Fusion Page
 * 웨어러블 퓨전 - Apple Watch / Galaxy Watch 연동
 */

import * as React from "react";
import { motion } from "framer-motion";
import { 
  Watch, 
  Bluetooth, 
  Activity, 
  Heart, 
  Zap,
  Battery,
  RefreshCw,
  CheckCircle2,
  Plus,
  TrendingUp,
  Flame
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  wearableFusionManager, 
  type WearableDevice, 
  type WearableType,
  type FusedHealthData 
} from "@/lib/innovations";

export default function WearablesPage() {
  const [devices, setDevices] = React.useState<WearableDevice[]>([]);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [fusedData, setFusedData] = React.useState<FusedHealthData | null>(null);
  const [selectedType, setSelectedType] = React.useState<WearableType | null>(null);

  const wearableOptions: { type: WearableType; name: string; icon: string }[] = [
    { type: 'apple_watch', name: 'Apple Watch', icon: '⌚' },
    { type: 'galaxy_watch', name: 'Galaxy Watch', icon: '⌚' },
    { type: 'fitbit', name: 'Fitbit', icon: '📟' },
    { type: 'garmin', name: 'Garmin', icon: '🏃' },
    { type: 'oura_ring', name: 'Oura Ring', icon: '💍' },
    { type: 'whoop', name: 'WHOOP', icon: '💪' },
  ];

  const handleConnect = async (type: WearableType) => {
    setIsConnecting(true);
    setSelectedType(type);
    
    try {
      const device = await wearableFusionManager.connect(type, 'mock_token');
      setDevices(wearableFusionManager.getConnectedDevices());
      
      // Generate fused data
      const fused = wearableFusionManager.fuseData(
        {
          glucose: 95,
          lactate: 1.2,
          cortisol: 12,
          inflammation: 2.5,
          hydration: 75,
        },
        []
      );
      setFusedData(fused);
      
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
      setSelectedType(null);
    }
  };

  const handleDisconnect = (deviceId: string) => {
    wearableFusionManager.disconnect(deviceId);
    setDevices(wearableFusionManager.getConnectedDevices());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Watch className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">웨어러블 퓨전</h1>
              <p className="text-muted-foreground">스마트워치 데이터 통합</p>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Connected Devices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bluetooth className="w-5 h-5 text-blue-500" />
                연결된 기기
              </CardTitle>
              <CardDescription>최대 3개의 기기를 연결할 수 있습니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {devices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Watch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>연결된 기기가 없습니다</p>
                </div>
              ) : (
                devices.map((device) => (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-2xl shadow">
                          ⌚
                        </div>
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-muted-foreground">{device.model}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500">
                        <div className="w-2 h-2 rounded-full bg-white mr-1 animate-pulse" />
                        연결됨
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Battery className="w-4 h-4" />
                          {device.batteryLevel}%
                        </span>
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-4 h-4" />
                          {new Date(device.lastSync).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(device.id)}
                      >
                        연결 해제
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {device.capabilities.slice(0, 5).map((cap) => (
                        <Badge key={cap} variant="outline" className="text-xs">
                          {cap.replace('_', ' ')}
                        </Badge>
                      ))}
                      {device.capabilities.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{device.capabilities.length - 5}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))
              )}

              {/* Add Device */}
              {devices.length < 3 && (
                <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                  {wearableOptions.map((option) => (
                    <Button
                      key={option.type}
                      variant="outline"
                      className="flex-col h-auto py-3"
                      onClick={() => handleConnect(option.type)}
                      disabled={isConnecting || devices.some(d => d.type === option.type)}
                    >
                      {isConnecting && selectedType === option.type ? (
                        <RefreshCw className="w-6 h-6 mb-1 animate-spin" />
                      ) : devices.some(d => d.type === option.type) ? (
                        <CheckCircle2 className="w-6 h-6 mb-1 text-green-500" />
                      ) : (
                        <span className="text-2xl mb-1">{option.icon}</span>
                      )}
                      <span className="text-xs">{option.name}</span>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fused Health Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                통합 건강 데이터
              </CardTitle>
              <CardDescription>만파식 + 웨어러블 융합 분석</CardDescription>
            </CardHeader>
            <CardContent>
              {fusedData ? (
                <div className="space-y-4">
                  {/* Overall Health Score */}
                  <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span>종합 건강 점수</span>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="text-4xl font-bold mb-2">
                      {fusedData.fusedInsights.overallHealthScore}
                    </div>
                    <Progress 
                      value={fusedData.fusedInsights.overallHealthScore} 
                      className="bg-white/30" 
                    />
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-red-50 rounded-xl">
                      <div className="flex items-center gap-2 text-red-600 mb-1">
                        <Heart className="w-4 h-4" />
                        <span className="text-xs">심박수</span>
                      </div>
                      <p className="text-2xl font-bold">{Math.round(fusedData.wearableData.heartRate)}</p>
                      <p className="text-xs text-muted-foreground">bpm</p>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs">HRV</span>
                      </div>
                      <p className="text-2xl font-bold">{Math.round(fusedData.wearableData.hrv)}</p>
                      <p className="text-xs text-muted-foreground">ms</p>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl">
                      <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <Flame className="w-4 h-4" />
                        <span className="text-xs">칼로리</span>
                      </div>
                      <p className="text-2xl font-bold">{fusedData.wearableData.calories}</p>
                      <p className="text-xs text-muted-foreground">kcal</p>
                    </div>

                    <div className="p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs">운동 준비도</span>
                      </div>
                      <p className="text-2xl font-bold">{fusedData.fusedInsights.performanceReadiness}%</p>
                    </div>
                  </div>

                  {/* Fatigue & Recovery */}
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">피로도</span>
                      <span className="text-sm text-muted-foreground">
                        {fusedData.fusedInsights.fatigueLevel < 30 ? '낮음' : 
                         fusedData.fusedInsights.fatigueLevel < 60 ? '보통' : '높음'}
                      </span>
                    </div>
                    <Progress value={fusedData.fusedInsights.fatigueLevel} />
                    
                    <p className="mt-3 text-sm text-muted-foreground">
                      {fusedData.fusedInsights.recoveryStatus}
                    </p>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2">
                    <p className="font-medium text-sm">AI 추천</p>
                    {fusedData.fusedInsights.recommendations.map((rec, i) => (
                      <div key={i} className="p-3 bg-blue-50 rounded-lg text-sm">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Watch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>웨어러블 기기를 연결하면<br />통합 분석을 시작합니다</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}




