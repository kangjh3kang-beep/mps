"use client";

/**
 * Food Safety Cartridge Page
 * 식품 안전 카트리지 - 농약/중금속 검출
 */

import * as React from "react";
import { motion } from "framer-motion";
import { 
  Apple, 
  Scan, 
  AlertTriangle, 
  CheckCircle2, 
  ShoppingCart,
  Leaf,
  Droplets,
  Bug,
  ChevronRight,
  Info
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { foodSafetyAnalyzer, type FoodSample, type FoodSafetyResult } from "@/lib/innovations";

export default function FoodSafetyPage() {
  const [isScanning, setIsScanning] = React.useState(false);
  const [result, setResult] = React.useState<FoodSafetyResult | null>(null);
  const [selectedFood, setSelectedFood] = React.useState<FoodSample | null>(null);

  const sampleFoods: FoodSample[] = [
    { id: '1', name: '사과', category: 'fruit', origin: '충북 충주' },
    { id: '2', name: '시금치', category: 'vegetable', origin: '전남 나주' },
    { id: '3', name: '현미', category: 'grain', origin: '경기 이천' },
    { id: '4', name: '고등어', category: 'seafood', origin: '부산 자갈치' },
  ];

  const handleScan = async () => {
    if (!selectedFood) return;
    
    setIsScanning(true);
    
    // Simulate scanning with mock signal
    const mockSignal = Array.from({ length: 88 }, () => Math.random() * 2 - 1);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analysisResult = await foodSafetyAnalyzer.analyze(selectedFood, mockSignal);
    setResult(analysisResult);
    setIsScanning(false);
  };

  const getStatusColor = (status: 'safe' | 'warning' | 'danger') => {
    switch (status) {
      case 'safe': return 'text-green-500 bg-green-50';
      case 'warning': return 'text-amber-500 bg-amber-50';
      case 'danger': return 'text-red-500 bg-red-50';
    }
  };

  const getStatusIcon = (status: 'safe' | 'warning' | 'danger') => {
    switch (status) {
      case 'safe': return <CheckCircle2 className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'danger': return <AlertTriangle className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">식품 안전 검사</h1>
              <p className="text-muted-foreground">농약 · 중금속 · 미생물 검출</p>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Food Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">검사할 식품 선택</CardTitle>
              <CardDescription>카트리지에 샘플을 올려주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sampleFoods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => setSelectedFood(food)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedFood?.id === food.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Apple className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-medium">{food.name}</p>
                        <p className="text-sm text-muted-foreground">{food.origin}</p>
                      </div>
                    </div>
                    {selectedFood?.id === food.id && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </button>
              ))}

              <Button
                onClick={handleScan}
                disabled={!selectedFood || isScanning}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                size="lg"
              >
                {isScanning ? (
                  <>
                    <Scan className="w-5 h-5 mr-2 animate-pulse" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Scan className="w-5 h-5 mr-2" />
                    검사 시작
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">검사 결과</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Overall Score */}
                  <div className={`p-4 rounded-xl ${getStatusColor(result.overallStatus)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">종합 안전 점수</span>
                      {getStatusIcon(result.overallStatus)}
                    </div>
                    <div className="text-3xl font-bold">{result.overallSafetyScore}점</div>
                    <Progress value={result.overallSafetyScore} className="mt-2" />
                  </div>

                  {/* Pesticides */}
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Bug className="w-4 h-4" />
                      <span className="font-medium">농약 잔류</span>
                    </div>
                    <div className="space-y-2">
                      {result.pesticides.slice(0, 3).map((p) => (
                        <div key={p.name} className="flex items-center justify-between text-sm">
                          <span>{p.koreanName}</span>
                          <Badge variant={p.status === 'safe' ? 'secondary' : 'destructive'}>
                            {p.detected.toFixed(1)} / {p.limit} ppb
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Heavy Metals */}
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Droplets className="w-4 h-4" />
                      <span className="font-medium">중금속</span>
                    </div>
                    <div className="space-y-2">
                      {result.heavyMetals.slice(0, 3).map((h) => (
                        <div key={h.element} className="flex items-center justify-between text-sm">
                          <span>{h.element} ({h.symbol})</span>
                          <Badge variant={h.status === 'safe' ? 'secondary' : 'destructive'}>
                            {h.detected.toFixed(1)} / {h.limit} ppb
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">권장 사항</span>
                    </div>
                    <ul className="space-y-2 text-sm text-blue-800">
                      {result.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Alternative Products */}
                  {result.alternativeProducts && result.alternativeProducts.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <ShoppingCart className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">추천 대체 상품</span>
                      </div>
                      <div className="space-y-2">
                        {result.alternativeProducts.map((alt, i) => (
                          <button
                            key={i}
                            className="w-full flex items-center justify-between p-2 bg-white rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <div>
                              <p className="font-medium text-sm">{alt.name}</p>
                              <p className="text-xs text-muted-foreground">{alt.brand}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-500">안전도 {alt.safetyScore}%</Badge>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Scan className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>식품을 선택하고 검사를 시작하세요</p>
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




