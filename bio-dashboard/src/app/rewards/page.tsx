"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  ChevronRight,
  Clock,
  Coins,
  Filter,
  Flame,
  Gift,
  Lock,
  Package,
  Pill,
  ShoppingBag,
  Sparkles,
  Star,
  Ticket,
  TrendingUp,
  Trophy
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useI18n } from "@/context/I18nContext";
import {
  type TierId,
  type UserPoints,
  type RedemptionItem,
  type PointTransaction,
  TIERS,
  REDEMPTION_CATALOG,
  getProgressToNextTier,
  canAfford
} from "@/lib/h2e-engine";

export default function RewardsPage() {
  const { locale } = useI18n();
  const isKo = locale === "ko";

  const [points, setPoints] = React.useState<Partial<UserPoints> | null>(null);
  const [transactions, setTransactions] = React.useState<PointTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [redeeming, setRedeeming] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<string>("all");

  // Fetch points and history
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/points?history=true&limit=50");
        const json = await res.json();
        if (json.success) {
          setPoints(json.points);
          setTransactions(json.transactions ?? []);
        }
      } catch (err) {
        console.error("Failed to fetch points:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRedeem = async (item: RedemptionItem) => {
    if (redeeming) return;
    if (!points || !canAfford(points.currentBalance ?? 0, item)) return;

    setRedeeming(item.id);
    try {
      const res = await fetch("/api/points/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id })
      });
      const json = await res.json();
      if (json.success) {
        setPoints(prev => prev ? { ...prev, currentBalance: json.newBalance } : prev);
        // Refresh transactions
        const txRes = await fetch("/api/points?history=true&limit=50");
        const txJson = await txRes.json();
        if (txJson.success) {
          setTransactions(txJson.transactions ?? []);
        }
      }
    } catch (err) {
      console.error("Redemption failed:", err);
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6">
        <div className="max-w-2xl mx-auto animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const tier = TIERS[(points?.tierId as TierId) ?? "bronze"];
  const progress = getProgressToNextTier(points?.lifetimeEarned ?? 0);

  // Filter items by category
  const filteredItems = REDEMPTION_CATALOG.filter(item => {
    if (filter === "all") return true;
    return item.category === filter;
  });

  // Check tier access for items
  const tierOrder: TierId[] = ["bronze", "silver", "gold", "diamond"];
  const userTierIndex = tierOrder.indexOf((points?.tierId as TierId) ?? "bronze");

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">
                {isKo ? "리워드 센터" : "Rewards Center"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Health-to-Earn
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5">
            <Coins className="h-4 w-4 text-amber-600" />
            <span className="font-bold text-amber-700">
              {(points?.currentBalance ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Tier Card */}
        <Card className={cn("border-2 overflow-hidden", tier.borderColor)}>
          <div className={cn("p-5", tier.bgColor)}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{tier.emoji}</span>
                <div>
                  <div className={cn("text-xl font-bold", tier.color)}>
                    {isKo ? tier.nameKo : tier.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isKo ? "회원 등급" : "Member Tier"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-orange-600">
                  <Flame className="h-5 w-5" />
                  <span className="font-bold">{points?.currentStreak ?? 0}</span>
                  <span className="text-sm">{isKo ? "일 연속" : "day streak"}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {isKo ? "최장" : "Best"}: {points?.longestStreak ?? 0}{isKo ? "일" : " days"}
                </div>
              </div>
            </div>

            {/* Progress to next tier */}
            {progress.nextTier && (
              <div className="space-y-2 bg-white/50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span>{isKo ? "다음 등급" : "Next"}: {progress.nextTier.emoji} {isKo ? progress.nextTier.nameKo : progress.nextTier.name}</span>
                  <span className="font-bold">{progress.pointsToNext.toLocaleString()} pts</span>
                </div>
                <Progress value={progress.progressPct} className="h-3" />
                <div className="text-xs text-muted-foreground text-center">
                  {progress.progressPct}% {isKo ? "달성" : "complete"}
                </div>
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <div className="text-sm font-medium mb-2">{isKo ? "현재 혜택" : "Your Benefits"}</div>
            <div className="flex flex-wrap gap-2">
              {tier.mallDiscountPct > 0 && (
                <Badge variant="secondary">🛒 {tier.mallDiscountPct}% {isKo ? "몰 할인" : "Mall Discount"}</Badge>
              )}
              <Badge variant="secondary">⚡ {tier.streakMultiplier}x {isKo ? "연속 보너스" : "Streak Bonus"}</Badge>
              {(isKo ? tier.perksKo : tier.perks).map((perk, idx) => (
                <Badge key={idx} variant="outline">✨ {perk}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <div className="text-lg font-bold">{(points?.lifetimeEarned ?? 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{isKo ? "총 획득" : "Total Earned"}</div>
          </Card>
          <Card className="p-3 text-center">
            <Gift className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <div className="text-lg font-bold">{(points?.lifetimeSpent ?? 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{isKo ? "총 사용" : "Total Spent"}</div>
          </Card>
          <Card className="p-3 text-center">
            <Trophy className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <div className="text-lg font-bold">{transactions.length}</div>
            <div className="text-xs text-muted-foreground">{isKo ? "활동" : "Activities"}</div>
          </Card>
        </div>

        {/* Redemption Catalog */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-amber-500" />
                  {isKo ? "포인트 교환" : "Redeem Points"}
                </CardTitle>
                <CardDescription>
                  {isKo ? "포인트로 혜택을 받으세요" : "Exchange points for rewards"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Category Filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {[
                { id: "all", label: isKo ? "전체" : "All", icon: <Sparkles className="h-3 w-3" /> },
                { id: "cartridge", label: isKo ? "카트리지" : "Cartridge", icon: <Package className="h-3 w-3" /> },
                { id: "supplement", label: isKo ? "영양제" : "Supplement", icon: <Pill className="h-3 w-3" /> },
                { id: "report", label: isKo ? "리포트" : "Report", icon: <Award className="h-3 w-3" /> },
                { id: "discount", label: isKo ? "쿠폰" : "Coupon", icon: <Ticket className="h-3 w-3" /> },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                    filter === cat.id
                      ? "bg-amber-500 text-white"
                      : "bg-muted hover:bg-amber-100"
                  )}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 gap-3">
              {filteredItems.map(item => {
                const affordable = canAfford(points?.currentBalance ?? 0, item);
                const tierLocked = item.minTier && tierOrder.indexOf(item.minTier) > userTierIndex;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border p-4 transition-all",
                      tierLocked
                        ? "opacity-50 bg-muted"
                        : affordable
                          ? "hover:border-amber-300 hover:bg-amber-50"
                          : "opacity-70"
                    )}
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      {item.category === "cartridge" && <Package className="h-6 w-6 text-amber-600" />}
                      {item.category === "supplement" && <Pill className="h-6 w-6 text-emerald-600" />}
                      {item.category === "report" && <Award className="h-6 w-6 text-purple-600" />}
                      {item.category === "service" && <Star className="h-6 w-6 text-sky-600" />}
                      {item.category === "discount" && <Ticket className="h-6 w-6 text-rose-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {isKo ? item.nameKo : item.name}
                        </span>
                        {item.minTier && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {TIERS[item.minTier].emoji} {isKo ? TIERS[item.minTier].nameKo : TIERS[item.minTier].name}+
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {isKo ? item.descriptionKo : item.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-amber-600 font-bold">
                        <Coins className="h-4 w-4" />
                        {item.pointsCost.toLocaleString()}
                      </div>
                      <Button
                        size="sm"
                        disabled={!affordable || tierLocked || redeeming === item.id}
                        onClick={() => handleRedeem(item)}
                        className="h-7 text-xs"
                      >
                        {tierLocked ? (
                          <><Lock className="h-3 w-3 mr-1" />{isKo ? "등급 제한" : "Locked"}</>
                        ) : redeeming === item.id ? (
                          isKo ? "교환 중..." : "Redeeming..."
                        ) : (
                          isKo ? "교환" : "Redeem"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {isKo ? "최근 활동" : "Recent Activity"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{isKo ? "아직 활동이 없습니다" : "No activity yet"}</p>
                <p className="text-xs">{isKo ? "측정을 시작하여 포인트를 적립하세요!" : "Start measuring to earn points!"}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {transactions.slice(0, 20).map(tx => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        tx.finalPoints > 0 ? "bg-emerald-100" : "bg-rose-100"
                      )}>
                        {tx.finalPoints > 0 ? (
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Gift className="h-4 w-4 text-rose-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{tx.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString(isKo ? "ko-KR" : "en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "font-bold text-sm",
                      tx.finalPoints > 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {tx.finalPoints > 0 ? "+" : ""}{tx.finalPoints}
                      {tx.multiplier > 1 && (
                        <span className="text-[10px] text-amber-600 ml-1">
                          ({tx.multiplier}x)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






