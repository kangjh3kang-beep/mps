"use client";

/**
 * ============================================================
 * WEARABLE DEVICES SETTINGS
 * 웨어러블 기기 연동 설정
 * ============================================================
 * 
 * 41-Persona Simulation: User #22 (축구 선수)
 * Feature: "운동 중 심박수와 바이오마커를 함께 분석"
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Watch, 
  Link2, 
  Unlink,
  RefreshCw,
  Check,
  AlertCircle,
  ChevronRight,
  Heart,
  Activity,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  WEARABLE_PROVIDERS, 
  WearableProvider, 
  WearableConnection,
  WearableData 
} from "@/lib/wearable-integration";

// ============================================
// COMPONENTS
// ============================================

function ProviderCard({ 
  provider, 
  connection,
  onConnect,
  onDisconnect,
  isLoading
}: { 
  provider: WearableProvider;
  connection?: WearableConnection;
  onConnect: () => void;
  onDisconnect: () => void;
  isLoading: boolean;
}) {
  const config = WEARABLE_PROVIDERS[provider];
  const isConnected = connection?.status === 'connected';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className={`transition-all ${isConnected ? 'border-green-200 bg-green-50/50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${config.color}15` }}
            >
              {config.icon}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{config.name}</span>
                {isConnected && (
                  <Badge className="bg-green-100 text-green-700 text-[10px]">
                    <Check className="w-3 h-3 mr-1" />
                    연결됨
                  </Badge>
                )}
              </div>
              {isConnected ? (
                <div className="text-xs text-muted-foreground mt-1">
                  {connection?.deviceName} • 마지막 동기화: {
                    connection?.lastSync 
                      ? new Date(connection.lastSync).toLocaleTimeString() 
                      : '-'
                  }
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-1">
                  {config.scopes.length}개 데이터 항목 연동 가능
                </div>
              )}
            </div>

            {/* Action Button */}
            {isConnected ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onDisconnect}
                disabled={isLoading}
              >
                <Unlink className="w-4 h-4 mr-1" />
                해제
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={onConnect}
                disabled={isLoading}
                style={{ backgroundColor: config.color }}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-1" />
                    연결
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Permissions Preview */}
          {!isConnected && (
            <div className="mt-3 flex flex-wrap gap-1">
              {config.scopes.slice(0, 4).map(scope => (
                <Badge key={scope} variant="secondary" className="text-[10px]">
                  {getPermissionLabel(scope)}
                </Badge>
              ))}
              {config.scopes.length > 4 && (
                <Badge variant="secondary" className="text-[10px]">
                  +{config.scopes.length - 4}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DataPreview({ data }: { data: WearableData }) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4" />
          실시간 데이터
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* Heart Rate */}
          <div className="text-center p-3 bg-surface rounded-xl">
            <Heart className="w-5 h-5 mx-auto text-red-500 mb-1" />
            <div className="text-xl font-bold">{data.heartRate.current}</div>
            <div className="text-[10px] text-muted-foreground">심박수 BPM</div>
          </div>

          {/* Steps */}
          <div className="text-center p-3 bg-surface rounded-xl">
            <Activity className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <div className="text-xl font-bold">{data.steps.today.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">걸음</div>
          </div>

          {/* Sleep */}
          <div className="text-center p-3 bg-surface rounded-xl">
            <Moon className="w-5 h-5 mx-auto text-indigo-500 mb-1" />
            <div className="text-xl font-bold">{data.sleep.duration}h</div>
            <div className="text-[10px] text-muted-foreground">수면</div>
          </div>
        </div>

        {/* HRV & Stress */}
        <div className="mt-4 p-3 bg-surface rounded-xl">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">심박변이도 (HRV)</span>
            <span className="font-medium">{data.heartRate.variability}ms</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">스트레스 레벨</span>
            <span className={`font-medium ${
              (data.stressLevel ?? 0) > 60 ? 'text-red-600' : 
              (data.stressLevel ?? 0) > 40 ? 'text-amber-600' : 'text-green-600'
            }`}>
              {data.stressLevel ?? '-'}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getPermissionLabel(permission: string): string {
  const labels: Record<string, string> = {
    heart_rate: '심박수',
    steps: '걸음수',
    sleep: '수면',
    activity: '활동',
    blood_oxygen: '혈중산소',
    stress: '스트레스',
    workout: '운동',
    nutrition: '영양'
  };
  return labels[permission] ?? permission;
}

// ============================================
// MAIN PAGE
// ============================================

export default function WearablesSettingsPage() {
  const [connections, setConnections] = React.useState<Map<WearableProvider, WearableConnection>>(new Map());
  const [isLoading, setIsLoading] = React.useState<WearableProvider | null>(null);
  const [wearableData, setWearableData] = React.useState<WearableData | null>(null);

  const providers = Object.keys(WEARABLE_PROVIDERS) as WearableProvider[];

  const handleConnect = async (provider: WearableProvider) => {
    setIsLoading(provider);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newConnection: WearableConnection = {
      provider,
      status: 'connected',
      lastSync: new Date(),
      deviceName: WEARABLE_PROVIDERS[provider].name,
      permissions: WEARABLE_PROVIDERS[provider].scopes
    };

    setConnections(prev => new Map(prev).set(provider, newConnection));
    setIsLoading(null);

    // Mock data sync
    setWearableData({
      heartRate: { current: 72, resting: 62, max: 185, variability: 48 },
      steps: { today: 7234, goal: 10000, distance: 5.2 },
      sleep: { duration: 7.5, quality: 'good', deepSleepPercent: 24, remSleepPercent: 20 },
      activity: { calories: 2100, activeMinutes: 52, standingHours: 9 },
      bloodOxygen: 98,
      stressLevel: 38
    });
  };

  const handleDisconnect = (provider: WearableProvider) => {
    const newConnections = new Map(connections);
    newConnections.delete(provider);
    setConnections(newConnections);
    
    if (newConnections.size === 0) {
      setWearableData(null);
    }
  };

  const connectedCount = Array.from(connections.values()).filter(c => c.status === 'connected').length;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30 pb-20">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => history.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Watch className="w-5 h-5 text-primary" />
            <div>
              <div className="text-lg font-semibold">웨어러블 연동</div>
              <div className="text-xs text-muted-foreground">
                스마트워치 및 피트니스 트래커 연결
              </div>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {connectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-green-800">
                  {connectedCount}개 기기 연결됨
                </div>
                <div className="text-xs text-green-700">
                  실시간 데이터 동기화 중
                </div>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto">
                <RefreshCw className="w-4 h-4 mr-1" />
                동기화
              </Button>
            </div>
          </motion.div>
        )}

        {/* Real-time Data Preview */}
        <AnimatePresence>
          {wearableData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <DataPreview data={wearableData} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Provider List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            지원 플랫폼
          </h3>
          
          {providers.map((provider) => (
            <ProviderCard
              key={provider}
              provider={provider}
              connection={connections.get(provider)}
              onConnect={() => handleConnect(provider)}
              onDisconnect={() => handleDisconnect(provider)}
              isLoading={isLoading === provider}
            />
          ))}
        </div>

        {/* Info Card */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">데이터 융합 분석</p>
                <p>
                  웨어러블 데이터(심박수, HRV, 수면)와 Manpasik 바이오마커를 
                  결합하여 더 정밀한 건강 인사이트를 제공합니다.
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="px-0 mt-2"
                  onClick={() => window.location.href = '/insights/fusion'}
                >
                  융합 분석 보기 <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






