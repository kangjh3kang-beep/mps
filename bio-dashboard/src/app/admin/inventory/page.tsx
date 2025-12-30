"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Box,
  Brain,
  Check,
  ChevronRight,
  Gift,
  Loader2,
  Package,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Zap
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  type InventoryPrediction,
  type DynamicBundle,
  type HealthSignal,
  predictInventoryNeeds,
  createRecoveryBundle
} from "@/lib/commerce-ai";

// Mock current inventory
const CURRENT_INVENTORY = [
  { productId: "ctg_immunity", productName: "Immunity Cartridge Pack", stock: 150, warehouseId: "WH-SEL" },
  { productId: "ctg_glucose", productName: "Glucose Cartridge Pack", stock: 300, warehouseId: "WH-SEL" },
  { productId: "ctg_lactate", productName: "Lactate Pro Cartridge", stock: 200, warehouseId: "WH-SEL" },
  { productId: "sup_vitamin_c", productName: "Vitamin C Complex", stock: 500, warehouseId: "WH-SEL" },
  { productId: "sup_magnesium", productName: "Magnesium Supplement", stock: 350, warehouseId: "WH-SEL" },
  { productId: "ctg_radon", productName: "Radon/VOC Sensor Cartridge", stock: 80, warehouseId: "WH-SEL" }
];

// Mock products for bundling
const AVAILABLE_PRODUCTS = [
  { id: "ctg_multi", name: "Multi-Analyte Cartridge", price: 45000, tags: ["cartridge", "glucose", "lactate"] },
  { id: "sup_vitamin_b", name: "Vitamin B Complex", price: 28000, tags: ["supplement", "energy", "fatigue"] },
  { id: "sup_omega3", name: "Omega-3 Fish Oil", price: 35000, tags: ["supplement", "heart", "recovery"] },
  { id: "sup_magnesium", name: "Magnesium Citrate", price: 22000, tags: ["supplement", "lactate", "recovery", "sleep"] },
  { id: "sup_chromium", name: "Chromium Picolinate", price: 18000, tags: ["supplement", "glucose"] },
  { id: "meal_recovery", name: "Recovery Meal Kit", price: 55000, tags: ["meal", "recovery"] }
];

export default function InventoryPage() {
  const [healthSignals, setHealthSignals] = React.useState<HealthSignal[]>([]);
  const [predictions, setPredictions] = React.useState<InventoryPrediction[]>([]);
  const [bundles, setBundles] = React.useState<DynamicBundle[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [orderingItems, setOrderingItems] = React.useState<string[]>([]);

  // Simulate receiving health signals
  React.useEffect(() => {
    const signals: HealthSignal[] = [
      { region: "Seoul", signal: "flu_rising", intensity: 72, affectedUsers: 3500 },
      { region: "Busan", signal: "glucose_high", intensity: 45, affectedUsers: 1200 },
      { region: "Daegu", signal: "lactate_high", intensity: 38, affectedUsers: 800 },
      { region: "Incheon", signal: "air_quality_poor", intensity: 65, affectedUsers: 2100 }
    ];
    setHealthSignals(signals);
  }, []);

  // Generate predictions when signals change
  React.useEffect(() => {
    if (healthSignals.length > 0) {
      const preds = predictInventoryNeeds(healthSignals, CURRENT_INVENTORY);
      setPredictions(preds);
    }
  }, [healthSignals]);

  // Generate sample bundles
  React.useEffect(() => {
    const sampleBundle = createRecoveryBundle(
      "user_demo",
      58,
      ["glucose", "lactate"],
      AVAILABLE_PRODUCTS
    );
    if (sampleBundle) {
      setBundles([sampleBundle]);
    }
  }, []);

  const handleAutoOrder = async (prediction: InventoryPrediction) => {
    setOrderingItems(prev => [...prev, prediction.productId]);
    await new Promise(r => setTimeout(r, 2000));
    setOrderingItems(prev => prev.filter(id => id !== prediction.productId));
    
    // Update prediction to show ordered
    setPredictions(prev => prev.map(p => 
      p.productId === prediction.productId
        ? { ...p, urgency: "low" as const, reason: `Ordered ${p.recommendedOrder} units ✓` }
        : p
    ));
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 2000));
    
    // Refresh with slightly different signals
    const newSignals: HealthSignal[] = healthSignals.map(s => ({
      ...s,
      intensity: Math.min(100, s.intensity + Math.floor(Math.random() * 10) - 5),
      affectedUsers: s.affectedUsers + Math.floor(Math.random() * 200) - 100
    }));
    setHealthSignals(newSignals);
    setIsAnalyzing(false);
  };

  const criticalCount = predictions.filter(p => p.urgency === "critical").length;
  const highCount = predictions.filter(p => p.urgency === "high").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-emerald-400" />
            Smart Inventory & Dynamic Pricing
          </h1>
          <p className="text-slate-400 text-sm">AI-powered predictive stocking and personalized bundling</p>
        </div>
        <Button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isAnalyzing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
          ) : (
            <><RefreshCw className="h-4 w-4 mr-2" /> Run Analysis</>
          )}
        </Button>
      </div>

      {/* Alert Banner */}
      {(criticalCount > 0 || highCount > 0) && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <div>
              <div className="font-medium text-amber-300">
                {criticalCount + highCount} Products Need Attention
              </div>
              <div className="text-sm text-amber-400/80">
                {criticalCount} critical, {highCount} high priority restocking recommendations
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
            onClick={() => {
              predictions
                .filter(p => p.urgency === "critical")
                .forEach(p => handleAutoOrder(p));
            }}
          >
            Auto-Order Critical
          </Button>
        </div>
      )}

      {/* Health Signals */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-cyan-400" />
            Live Health Signals (From Reader Data)
          </CardTitle>
          <CardDescription>
            Real-time biosignal trends detected across regions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {healthSignals.map((signal, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-lg border p-3",
                  signal.intensity >= 60
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-slate-700 bg-slate-800/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{signal.region}</span>
                  <Badge
                    className={cn(
                      signal.intensity >= 60
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-slate-500/20 text-slate-400"
                    )}
                  >
                    {signal.intensity}%
                  </Badge>
                </div>
                <div className="text-xs text-slate-400 mb-2">
                  {signal.signal.replace(/_/g, " ").toUpperCase()}
                </div>
                <Progress
                  value={signal.intensity}
                  className={cn(
                    "h-1.5",
                    signal.intensity >= 60 ? "[&>div]:bg-amber-500" : "[&>div]:bg-cyan-500"
                  )}
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  {signal.affectedUsers.toLocaleString()} users
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="predictions" className="data-[state=active]:bg-slate-700">
            Predictive Stocking
            {criticalCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                {criticalCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bundles" className="data-[state=active]:bg-slate-700">
            Dynamic Bundles
          </TabsTrigger>
        </TabsList>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">AI Stock Recommendations</CardTitle>
              <CardDescription>
                Based on detected health signals and current inventory levels
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left p-4 text-slate-400 font-medium">Product</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Current Stock</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Predicted Demand</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Recommended Order</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Urgency</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Trigger</th>
                      <th className="text-right p-4 text-slate-400 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((pred, idx) => (
                      <tr
                        key={idx}
                        className={cn(
                          "border-b border-slate-800/50",
                          pred.urgency === "critical" && "bg-rose-500/5"
                        )}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{pred.productName}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono">{pred.currentStock}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-400">{pred.predictedDemand}</span>
                            <TrendingUp className="h-3 w-3 text-amber-400" />
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-emerald-400">+{pred.recommendedOrder}</span>
                        </td>
                        <td className="p-4">
                          <UrgencyBadge urgency={pred.urgency} />
                        </td>
                        <td className="p-4">
                          <span className="text-xs text-slate-400">{pred.triggerSignal.replace(/_/g, " ")}</span>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleAutoOrder(pred)}
                            disabled={orderingItems.includes(pred.productId) || pred.urgency === "low"}
                            className={cn(
                              pred.urgency === "critical"
                                ? "bg-rose-600 hover:bg-rose-700"
                                : pred.urgency === "high"
                                  ? "bg-amber-600 hover:bg-amber-700"
                                  : "bg-slate-600 hover:bg-slate-700"
                            )}
                          >
                            {orderingItems.includes(pred.productId) ? (
                              <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Ordering...</>
                            ) : pred.reason.includes("✓") ? (
                              <><Check className="h-3 w-3 mr-1" /> Ordered</>
                            ) : (
                              <>Auto Order</>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Gift className="h-4 w-4 text-purple-400" />
                Personalized Recovery Bundles
              </CardTitle>
              <CardDescription>
                Auto-generated bundles based on user health scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bundles.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active bundles. Bundles are created when user health drops below 70.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bundles.map(bundle => (
                    <div
                      key={bundle.id}
                      className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-purple-400" />
                            <span className="font-bold text-lg">{bundle.nameKo}</span>
                            <Badge className="bg-emerald-500/20 text-emerald-400">
                              -{bundle.discountPct}% OFF
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{bundle.descriptionKo}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-400 line-through">
                            ₩{bundle.totalOriginalPrice.toLocaleString()}
                          </div>
                          <div className="text-xl font-bold text-emerald-400">
                            ₩{bundle.bundlePrice.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {bundle.products.map((product, idx) => (
                          <div key={idx} className="rounded-lg bg-slate-800/50 p-3 text-center">
                            <Box className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                            <div className="text-xs font-medium">{product.name}</div>
                            <div className="text-[10px] text-slate-500 line-through">
                              ₩{product.originalPrice.toLocaleString()}
                            </div>
                            <div className="text-xs text-emerald-400">
                              ₩{product.bundlePrice.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="text-slate-400">
                          <span className="text-amber-400">Trigger:</span> {bundle.triggerCondition}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                            {bundle.status}
                          </Badge>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            Push to User
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bundle Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">23%</div>
                <div className="text-xs text-slate-400">Bundle Conversion Rate</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 text-center">
                <ShoppingCart className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">₩2.4M</div>
                <div className="text-xs text-slate-400">Bundle Revenue (This Week)</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 text-center">
                <ArrowUp className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">+18%</div>
                <div className="text-xs text-slate-400">AOV Increase</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: InventoryPrediction["urgency"] }) {
  const configs: Record<string, { color: string; label: string }> = {
    critical: { color: "bg-rose-500/20 text-rose-400 border-rose-500/30", label: "CRITICAL" },
    high: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "HIGH" },
    medium: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "MEDIUM" },
    low: { color: "bg-slate-500/20 text-slate-400 border-slate-500/30", label: "LOW" }
  };
  
  const config = configs[urgency];
  return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
}






