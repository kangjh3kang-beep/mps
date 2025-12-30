"use client";

/**
 * Payment Platform Page
 * 결제 플랫폼 - Manpasik Mall 결제 시스템
 */

import * as React from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Wallet, 
  Gift, 
  Crown,
  Check,
  Star,
  ShoppingBag,
  Coins,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  paymentPlatform, 
  SUBSCRIPTION_PLANS,
  type PaymentMethodInfo,
  type PointsBalance,
  type Subscription
} from "@/lib/innovations";

export default function PaymentPage() {
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethodInfo[]>([]);
  const [pointsBalance, setPointsBalance] = React.useState<PointsBalance | null>(null);
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [couponCode, setCouponCode] = React.useState('');
  const [couponResult, setCouponResult] = React.useState<{ valid: boolean; message: string } | null>(null);

  React.useEffect(() => {
    // Initialize mock data
    const userId = 'user_1';
    
    // Add mock payment method
    paymentPlatform.addPaymentMethod(userId, 'credit_card', {
      last4: '4242',
      brand: 'visa',
      expiryMonth: 12,
      expiryYear: 2026,
      holderName: '홍길동',
    }, true);

    // Award some points
    paymentPlatform.awardPoints(userId, 5000, '가입 축하 보너스');
    paymentPlatform.awardPoints(userId, 2340, '지난 달 구매 적립');

    // Create mock coupon
    paymentPlatform.createCoupon({
      code: 'WELCOME2024',
      type: 'percentage',
      value: 20,
      minOrderAmount: 30000,
      maxDiscount: 10000,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
    });

    // Load data
    setPaymentMethods(paymentPlatform.getPaymentMethods(userId));
    setPointsBalance(paymentPlatform.getPointsBalance(userId));
  }, []);

  const handleSubscribe = async (planId: string, interval: 'monthly' | 'yearly') => {
    const pm = paymentMethods.find(p => p.isDefault);
    if (!pm) return;

    const sub = await paymentPlatform.createSubscription('user_1', planId, pm.id, interval);
    setSubscription(sub);
  };

  const handleCouponCheck = () => {
    const result = paymentPlatform.validateCoupon(couponCode, 50000);
    setCouponResult(result);
  };

  const getBrandIcon = (brand: string) => {
    switch (brand) {
      case 'visa': return '💳 Visa';
      case 'mastercard': return '💳 Mastercard';
      case 'amex': return '💳 Amex';
      default: return '💳 Card';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">결제 & 구독</h1>
              <p className="text-muted-foreground">결제 수단 및 구독 관리</p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Plans */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  구독 플랜
                </CardTitle>
                <CardDescription>나에게 맞는 플랜을 선택하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <motion.div
                      key={plan.id}
                      whileHover={{ y: -4 }}
                      className={`relative p-4 rounded-xl border-2 ${
                        plan.popular 
                          ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50' 
                          : 'border-slate-200'
                      }`}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500">
                          <Star className="w-3 h-3 mr-1" />
                          인기
                        </Badge>
                      )}

                      <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                      <div className="mb-4">
                        <div className="text-2xl font-bold">
                          ₩{plan.monthlyPrice.toLocaleString()}
                          <span className="text-sm font-normal text-muted-foreground">/월</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          연간 결제 시 ₩{plan.yearlyPrice.toLocaleString()}/년
                        </p>
                      </div>

                      <ul className="space-y-2 mb-4">
                        {plan.features.slice(0, 4).map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 4 && (
                          <li className="text-sm text-muted-foreground">
                            +{plan.features.length - 4}개 더...
                          </li>
                        )}
                      </ul>

                      <div className="space-y-2">
                        <Button
                          className="w-full"
                          variant={plan.popular ? 'default' : 'outline'}
                          onClick={() => handleSubscribe(plan.id, 'monthly')}
                        >
                          월간 구독
                        </Button>
                        <Button
                          className="w-full"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSubscribe(plan.id, 'yearly')}
                        >
                          연간 구독 (2개월 무료)
                        </Button>
                      </div>

                      {plan.trialDays > 0 && (
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          {plan.trialDays}일 무료 체험
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>

                {subscription && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl"
                  >
                    <div className="flex items-center gap-2 text-green-700">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">{subscription.planName} 구독이 활성화되었습니다!</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      다음 결제일: {subscription.currentPeriodEnd.toLocaleDateString('ko-KR')}
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  결제 수단
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center text-white text-xs font-bold">
                        {(pm.details as { brand: string }).brand?.toUpperCase().slice(0, 4)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {getBrandIcon((pm.details as { brand: string }).brand)} •••• {(pm.details as { last4: string }).last4}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(pm.details as { expiryMonth: number }).expiryMonth}/{(pm.details as { expiryYear: number }).expiryYear}
                        </p>
                      </div>
                    </div>
                    {pm.isDefault && <Badge>기본</Badge>}
                  </div>
                ))}

                <Button variant="outline" className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  새 결제 수단 추가
                </Button>
              </CardContent>
            </Card>

            {/* Coupon */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="w-5 h-5 text-pink-500" />
                  쿠폰
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="쿠폰 코드 입력"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button onClick={handleCouponCheck}>적용</Button>
                </div>
                {couponResult && (
                  <p className={`mt-2 text-sm ${couponResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                    {couponResult.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  예시 코드: WELCOME2024 (20% 할인)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Points */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500" />
                  MPS 포인트
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pointsBalance && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white">
                      <p className="text-sm opacity-80">사용 가능 포인트</p>
                      <p className="text-3xl font-bold">
                        {pointsBalance.available.toLocaleString()}P
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-xs text-muted-foreground">누적 적립</p>
                        <p className="font-bold">{pointsBalance.lifetime.toLocaleString()}P</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-xl">
                        <p className="text-xs text-muted-foreground">30일 내 소멸</p>
                        <p className="font-bold text-red-600">{pointsBalance.expiringWithin30Days.toLocaleString()}P</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">최근 내역</p>
                      <div className="space-y-2">
                        {pointsBalance.transactions.slice(0, 3).map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
                            <div>
                              <p className="font-medium">{tx.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {tx.createdAt.toLocaleDateString('ko-KR')}
                              </p>
                            </div>
                            <span className={tx.type === 'earned' ? 'text-green-600' : 'text-red-600'}>
                              {tx.type === 'earned' ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}P
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      전체 내역 보기
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">빠른 액션</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  주문 내역
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Gift className="w-4 h-4 mr-2" />
                  선물하기
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="w-4 h-4 mr-2" />
                  포인트 충전
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}




