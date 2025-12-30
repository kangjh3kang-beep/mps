/**
 * ============================================================
 * PAYMENT PLATFORM SYSTEM
 * 결제 플랫폼 - Manpasik Mall 결제 시스템
 * Supports: Card, Bank Transfer, Points, Subscription
 * ============================================================
 */

// ============================================
// TYPES & INTERFACES
// ============================================

export type PaymentMethod = 
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'kakao_pay'
  | 'naver_pay'
  | 'toss_pay'
  | 'samsung_pay'
  | 'apple_pay'
  | 'mps_points'
  | 'subscription';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export type Currency = 'KRW' | 'USD' | 'JPY' | 'EUR' | 'CNY';

export interface PaymentMethodInfo {
  id: string;
  userId: string;
  type: PaymentMethod;
  isDefault: boolean;
  details: CardDetails | BankDetails | WalletDetails;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface CardDetails {
  last4: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'jcb' | 'unionpay' | 'bc' | 'shinhan' | 'samsung' | 'hyundai';
  expiryMonth: number;
  expiryYear: number;
  holderName: string;
  billingAddress?: Address;
}

export interface BankDetails {
  bankCode: string;
  bankName: string;
  accountNumber: string;  // masked
  accountHolder: string;
}

export interface WalletDetails {
  provider: 'kakao' | 'naver' | 'toss' | 'samsung' | 'apple';
  linkedEmail?: string;
  linkedPhone?: string;
}

export interface Address {
  country: string;
  postalCode: string;
  state?: string;
  city: string;
  line1: string;
  line2?: string;
}

export interface PaymentIntent {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  paymentMethodId?: string;
  status: PaymentStatus;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failureReason?: string;
  receiptUrl?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  pointsUsed: number;
  pointsEarned: number;
  tax: number;
  shipping: number;
  total: number;
  currency: Currency;
  status: OrderStatus;
  shippingAddress?: Address;
  billingAddress?: Address;
  paymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: Record<string, string>;
}

export type OrderStatus = 
  | 'pending_payment'
  | 'paid'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refund_requested'
  | 'refunded';

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  paymentMethodId: string;
  amount: number;
  currency: Currency;
  interval: 'monthly' | 'yearly';
  createdAt: Date;
  cancelledAt?: Date;
}

export type SubscriptionStatus = 
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'unpaid'
  | 'trialing';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  currency: Currency;
  trialDays: number;
  popular?: boolean;
}

export interface PointsBalance {
  userId: string;
  available: number;
  pending: number;
  lifetime: number;
  expiringWithin30Days: number;
  transactions: PointTransaction[];
}

export interface PointTransaction {
  id: string;
  type: 'earned' | 'spent' | 'expired' | 'refunded' | 'bonus';
  amount: number;
  description: string;
  referenceId?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usageCount: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
}

export interface RefundRequest {
  id: string;
  orderId: string;
  paymentIntentId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  refundMethod: 'original_payment' | 'points' | 'bank_transfer';
}

// ============================================
// SUBSCRIPTION PLANS
// ============================================

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_basic',
    name: 'Basic',
    description: '개인 사용자를 위한 기본 플랜',
    features: [
      '무제한 측정',
      'AI 코치 기본 상담',
      '주간 건강 리포트',
      '1GB 클라우드 저장소',
    ],
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    currency: 'KRW',
    trialDays: 14,
  },
  {
    id: 'plan_premium',
    name: 'Premium',
    description: '활동적인 사용자를 위한 프리미엄 플랜',
    features: [
      'Basic 플랜의 모든 기능',
      'AI 코치 무제한 상담',
      '실시간 건강 알림',
      '웨어러블 연동',
      '가족 계정 (최대 4명)',
      '10GB 클라우드 저장소',
      '우선 고객 지원',
    ],
    monthlyPrice: 19900,
    yearlyPrice: 199000,
    currency: 'KRW',
    trialDays: 14,
    popular: true,
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    description: '전문가 및 의료인을 위한 프로 플랜',
    features: [
      'Premium 플랜의 모든 기능',
      '원격 진료 연동',
      '의료 데이터 내보내기',
      '팀 관리 기능',
      'API 접근',
      '무제한 클라우드 저장소',
      '전담 매니저',
    ],
    monthlyPrice: 49900,
    yearlyPrice: 499000,
    currency: 'KRW',
    trialDays: 30,
  },
];

// ============================================
// PAYMENT PLATFORM CLASS
// ============================================

export class PaymentPlatform {
  private paymentMethods: Map<string, PaymentMethodInfo> = new Map();
  private paymentIntents: Map<string, PaymentIntent> = new Map();
  private orders: Map<string, Order> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private pointsBalances: Map<string, PointsBalance> = new Map();
  private coupons: Map<string, Coupon> = new Map();

  // ============================================
  // PAYMENT METHODS
  // ============================================

  /**
   * Add payment method
   */
  async addPaymentMethod(
    userId: string,
    type: PaymentMethod,
    details: CardDetails | BankDetails | WalletDetails,
    setAsDefault = false
  ): Promise<PaymentMethodInfo> {
    const id = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Mask sensitive data
    if ('last4' in details) {
      // Card details are already masked
    } else if ('accountNumber' in details) {
      // Mask bank account
      (details as BankDetails).accountNumber = '*'.repeat(details.accountNumber.length - 4) + 
        details.accountNumber.slice(-4);
    }

    const paymentMethod: PaymentMethodInfo = {
      id,
      userId,
      type,
      isDefault: setAsDefault,
      details,
      createdAt: new Date(),
    };

    // If setting as default, unset other defaults
    if (setAsDefault) {
      this.paymentMethods.forEach((pm) => {
        if (pm.userId === userId) {
          pm.isDefault = false;
        }
      });
    }

    this.paymentMethods.set(id, paymentMethod);
    return paymentMethod;
  }

  /**
   * Get user's payment methods
   */
  getPaymentMethods(userId: string): PaymentMethodInfo[] {
    return Array.from(this.paymentMethods.values())
      .filter(pm => pm.userId === userId);
  }

  /**
   * Remove payment method
   */
  removePaymentMethod(paymentMethodId: string, userId: string): boolean {
    const pm = this.paymentMethods.get(paymentMethodId);
    if (!pm || pm.userId !== userId) return false;
    
    // Check if used by active subscription
    const activeSub = Array.from(this.subscriptions.values())
      .find(s => s.paymentMethodId === paymentMethodId && s.status === 'active');
    if (activeSub) return false;

    this.paymentMethods.delete(paymentMethodId);
    return true;
  }

  // ============================================
  // ORDERS & PAYMENTS
  // ============================================

  /**
   * Create order
   */
  createOrder(
    userId: string,
    items: Omit<OrderItem, 'id' | 'totalPrice'>[],
    shippingAddress?: Address,
    couponCode?: string
  ): Order {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate order items with totals
    const orderItems: OrderItem[] = items.map((item, i) => ({
      ...item,
      id: `item_${i}`,
      totalPrice: item.unitPrice * item.quantity,
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Apply coupon discount
    let discount = 0;
    if (couponCode) {
      const coupon = this.coupons.get(couponCode);
      if (coupon && this.isCouponValid(coupon)) {
        discount = this.calculateDiscount(coupon, subtotal);
        coupon.usageCount++;
      }
    }

    // Calculate points earned (1% of purchase)
    const pointsEarned = Math.floor((subtotal - discount) * 0.01);

    // Calculate shipping (free over 50,000 KRW)
    const shipping = subtotal - discount >= 50000 ? 0 : 3000;

    // Calculate tax (included in price for KRW)
    const tax = 0;

    const order: Order = {
      id: orderId,
      userId,
      items: orderItems,
      subtotal,
      discount,
      pointsUsed: 0,
      pointsEarned,
      tax,
      shipping,
      total: subtotal - discount + shipping + tax,
      currency: 'KRW',
      status: 'pending_payment',
      shippingAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.orders.set(orderId, order);
    return order;
  }

  /**
   * Apply points to order
   */
  applyPoints(orderId: string, userId: string, pointsToUse: number): Order | null {
    const order = this.orders.get(orderId);
    if (!order || order.userId !== userId) return null;

    const pointsBalance = this.getPointsBalance(userId);
    if (pointsBalance.available < pointsToUse) return null;

    // Max points usage is 50% of order total
    const maxPoints = Math.floor((order.subtotal - order.discount) * 0.5);
    const actualPoints = Math.min(pointsToUse, maxPoints, pointsBalance.available);

    order.pointsUsed = actualPoints;
    order.total = order.subtotal - order.discount - actualPoints + order.shipping + order.tax;
    order.updatedAt = new Date();

    return order;
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(
    userId: string,
    orderId: string,
    paymentMethod: PaymentMethod,
    paymentMethodId?: string
  ): Promise<PaymentIntent> {
    const order = this.orders.get(orderId);
    if (!order || order.userId !== userId) {
      throw new Error('Order not found');
    }

    const intentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const intent: PaymentIntent = {
      id: intentId,
      userId,
      orderId,
      amount: order.total,
      currency: order.currency,
      paymentMethod,
      paymentMethodId,
      status: 'pending',
      description: `Order ${orderId}`,
      metadata: { itemCount: order.items.length },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.paymentIntents.set(intentId, intent);
    order.paymentIntentId = intentId;

    return intent;
  }

  /**
   * Process payment
   */
  async processPayment(paymentIntentId: string): Promise<PaymentIntent> {
    const intent = this.paymentIntents.get(paymentIntentId);
    if (!intent) throw new Error('Payment intent not found');

    intent.status = 'processing';
    intent.updatedAt = new Date();

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 95% success rate for simulation
    const success = Math.random() > 0.05;

    if (success) {
      intent.status = 'completed';
      intent.completedAt = new Date();
      intent.receiptUrl = `https://manpasik.com/receipts/${intent.id}`;

      // Update order status
      const order = this.orders.get(intent.orderId);
      if (order) {
        order.status = 'paid';
        order.updatedAt = new Date();

        // Deduct points if used
        if (order.pointsUsed > 0) {
          this.deductPoints(order.userId, order.pointsUsed, `Order ${order.id}`);
        }

        // Award points
        this.awardPoints(order.userId, order.pointsEarned, `Order ${order.id}`);
      }
    } else {
      intent.status = 'failed';
      intent.failureReason = 'Payment declined by issuer';
    }

    intent.updatedAt = new Date();
    return intent;
  }

  /**
   * Request refund
   */
  async requestRefund(
    orderId: string,
    userId: string,
    reason: string,
    amount?: number
  ): Promise<RefundRequest> {
    const order = this.orders.get(orderId);
    if (!order || order.userId !== userId) {
      throw new Error('Order not found');
    }

    if (!order.paymentIntentId) {
      throw new Error('No payment found for this order');
    }

    const refundAmount = amount || order.total;

    const refund: RefundRequest = {
      id: `refund_${Date.now()}`,
      orderId,
      paymentIntentId: order.paymentIntentId,
      amount: refundAmount,
      reason,
      status: 'pending',
      requestedAt: new Date(),
      refundMethod: 'original_payment',
    };

    order.status = 'refund_requested';
    order.updatedAt = new Date();

    return refund;
  }

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  /**
   * Create subscription
   */
  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string,
    interval: 'monthly' | 'yearly'
  ): Promise<Subscription> {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) throw new Error('Plan not found');

    const now = new Date();
    const periodEnd = new Date(now);
    if (interval === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const subscription: Subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      planId,
      planName: plan.name,
      status: plan.trialDays > 0 ? 'trialing' : 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      paymentMethodId,
      amount: interval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
      currency: plan.currency,
      interval,
      createdAt: now,
    };

    this.subscriptions.set(subscription.id, subscription);

    // Award bonus points for yearly subscription
    if (interval === 'yearly') {
      this.awardPoints(userId, 10000, 'Annual subscription bonus');
    }

    return subscription;
  }

  /**
   * Cancel subscription
   */
  cancelSubscription(subscriptionId: string, userId: string, immediately = false): Subscription | null {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription || subscription.userId !== userId) return null;

    if (immediately) {
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
    } else {
      subscription.cancelAtPeriodEnd = true;
    }

    return subscription;
  }

  /**
   * Get user subscriptions
   */
  getUserSubscriptions(userId: string): Subscription[] {
    return Array.from(this.subscriptions.values())
      .filter(s => s.userId === userId);
  }

  // ============================================
  // POINTS
  // ============================================

  /**
   * Get points balance
   */
  getPointsBalance(userId: string): PointsBalance {
    let balance = this.pointsBalances.get(userId);
    
    if (!balance) {
      balance = {
        userId,
        available: 0,
        pending: 0,
        lifetime: 0,
        expiringWithin30Days: 0,
        transactions: [],
      };
      this.pointsBalances.set(userId, balance);
    }

    return balance;
  }

  /**
   * Award points
   */
  awardPoints(userId: string, amount: number, description: string, referenceId?: string): void {
    const balance = this.getPointsBalance(userId);
    
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    balance.transactions.push({
      id: `pt_${Date.now()}`,
      type: 'earned',
      amount,
      description,
      referenceId,
      createdAt: new Date(),
      expiresAt,
    });

    balance.available += amount;
    balance.lifetime += amount;
  }

  /**
   * Deduct points
   */
  deductPoints(userId: string, amount: number, description: string): boolean {
    const balance = this.getPointsBalance(userId);
    
    if (balance.available < amount) return false;

    balance.transactions.push({
      id: `pt_${Date.now()}`,
      type: 'spent',
      amount: -amount,
      description,
      createdAt: new Date(),
    });

    balance.available -= amount;
    return true;
  }

  // ============================================
  // COUPONS
  // ============================================

  /**
   * Create coupon
   */
  createCoupon(coupon: Omit<Coupon, 'usageCount'>): Coupon {
    const newCoupon: Coupon = { ...coupon, usageCount: 0 };
    this.coupons.set(coupon.code, newCoupon);
    return newCoupon;
  }

  /**
   * Validate coupon
   */
  validateCoupon(code: string, orderAmount: number): { valid: boolean; message: string; discount?: number } {
    const coupon = this.coupons.get(code);
    
    if (!coupon) {
      return { valid: false, message: '유효하지 않은 쿠폰 코드입니다.' };
    }

    if (!this.isCouponValid(coupon)) {
      return { valid: false, message: '만료된 쿠폰입니다.' };
    }

    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return { 
        valid: false, 
        message: `최소 주문 금액 ${coupon.minOrderAmount.toLocaleString()}원 이상이어야 합니다.` 
      };
    }

    const discount = this.calculateDiscount(coupon, orderAmount);
    return { 
      valid: true, 
      message: `${discount.toLocaleString()}원 할인이 적용됩니다.`,
      discount 
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private isCouponValid(coupon: Coupon): boolean {
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) return false;
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return false;
    return true;
  }

  private calculateDiscount(coupon: Coupon, orderAmount: number): number {
    let discount: number;

    switch (coupon.type) {
      case 'percentage':
        discount = Math.floor(orderAmount * (coupon.value / 100));
        break;
      case 'fixed_amount':
        discount = coupon.value;
        break;
      case 'free_shipping':
        discount = 3000; // Standard shipping cost
        break;
      default:
        discount = 0;
    }

    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }

    return discount;
  }
}

// Singleton instance
export const paymentPlatform = new PaymentPlatform();




