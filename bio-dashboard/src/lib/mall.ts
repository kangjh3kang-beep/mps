/**
 * Manpasik Mall - E-Commerce & AI Recommendation Engine
 * 
 * Part 5: Organic AI Recommendation System
 * - Health-based product recommendations
 * - Tag matching with health metrics
 * - Prescription integration
 */

/* ============================================
 * Types
 * ============================================ */

export type ProductCategory = 
  | "supplements"
  | "nutrition"
  | "devices"
  | "lifestyle"
  | "medical_food";

export type HealthTag = 
  | "energy"
  | "sleep"
  | "stress"
  | "immunity"
  | "digestion"
  | "heart"
  | "blood_sugar"
  | "anti_inflammatory"
  | "recovery"
  | "cognitive"
  | "hydration"
  | "detox";

export interface Product {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  currency: string;
  image: string;
  rating: number;
  reviewCount: number;
  tags: HealthTag[];
  inStock: boolean;
  isPrescriptionRequired?: boolean;
  dosage?: string;
  brand: string;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  isPrescribed?: boolean;
  prescriptionId?: string;
  doctorName?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export interface ProductRecommendation {
  product: Product;
  reason: string;
  reasonKo: string;
  matchScore: number;
  healthMetric: string;
}

export interface HealthContext {
  lactateLevel?: number;      // mmol/L
  healthScore?: number;       // 0-100
  sleepScore?: number;        // 0-100
  stressLevel?: number;       // 0-100
  heartRate?: number;         // BPM
  bloodSugar?: number;        // mg/dL
  recentSymptoms?: string[];
}

/* ============================================
 * Mock Product Database
 * ============================================ */

export const productsDB: Product[] = [
  // Supplements - Energy
  {
    id: "prod-001",
    name: "Vitamin B Complex Premium",
    nameKo: "비타민 B 콤플렉스 프리미엄",
    description: "High-potency B vitamins for energy and metabolism support",
    descriptionKo: "에너지와 대사 지원을 위한 고함량 비타민 B",
    category: "supplements",
    price: 24.99,
    originalPrice: 29.99,
    currency: "USD",
    image: "💊",
    rating: 4.7,
    reviewCount: 1234,
    tags: ["energy", "cognitive", "stress"],
    inStock: true,
    dosage: "1 tablet daily with meal",
    brand: "VitaHealth",
    featured: true
  },
  {
    id: "prod-002",
    name: "Omega-3 Fish Oil 1000mg",
    nameKo: "오메가-3 피쉬 오일 1000mg",
    description: "Pure fish oil for heart and brain health",
    descriptionKo: "심장과 뇌 건강을 위한 순수 어유",
    category: "supplements",
    price: 19.99,
    currency: "USD",
    image: "🐟",
    rating: 4.8,
    reviewCount: 2456,
    tags: ["heart", "cognitive", "anti_inflammatory"],
    inStock: true,
    dosage: "2 softgels daily",
    brand: "OceanPure",
    featured: true
  },
  {
    id: "prod-003",
    name: "Magnesium Glycinate 400mg",
    nameKo: "마그네슘 글리시네이트 400mg",
    description: "Highly absorbable magnesium for relaxation and sleep",
    descriptionKo: "휴식과 수면을 위한 고흡수 마그네슘",
    category: "supplements",
    price: 22.99,
    currency: "USD",
    image: "🌙",
    rating: 4.9,
    reviewCount: 892,
    tags: ["sleep", "stress", "recovery"],
    inStock: true,
    dosage: "1-2 capsules before bed",
    brand: "SleepWell",
    featured: true
  },
  {
    id: "prod-004",
    name: "Tart Cherry Extract",
    nameKo: "타트 체리 추출물",
    description: "Natural melatonin source for better sleep and recovery",
    descriptionKo: "숙면과 회복을 위한 천연 멜라토닌 원료",
    category: "supplements",
    price: 18.99,
    currency: "USD",
    image: "🍒",
    rating: 4.6,
    reviewCount: 567,
    tags: ["sleep", "recovery", "anti_inflammatory"],
    inStock: true,
    dosage: "500mg 30 min before bed",
    brand: "NaturalRest"
  },
  {
    id: "prod-005",
    name: "Ashwagandha KSM-66",
    nameKo: "아슈와간다 KSM-66",
    description: "Clinically proven adaptogen for stress and energy",
    descriptionKo: "스트레스와 에너지를 위한 임상 검증 적응제",
    category: "supplements",
    price: 27.99,
    currency: "USD",
    image: "🌿",
    rating: 4.7,
    reviewCount: 1089,
    tags: ["stress", "energy", "cognitive"],
    inStock: true,
    dosage: "300mg twice daily",
    brand: "AdaptogenPro"
  },
  {
    id: "prod-006",
    name: "CoQ10 Ubiquinol 100mg",
    nameKo: "코엔자임 Q10 유비퀴놀 100mg",
    description: "Active form of CoQ10 for heart and cellular energy",
    descriptionKo: "심장과 세포 에너지를 위한 활성형 CoQ10",
    category: "supplements",
    price: 34.99,
    currency: "USD",
    image: "❤️",
    rating: 4.8,
    reviewCount: 678,
    tags: ["heart", "energy", "recovery"],
    inStock: true,
    dosage: "100mg daily with meal",
    brand: "CardioLife"
  },
  // Nutrition - Functional Foods
  {
    id: "prod-007",
    name: "Diabetic Care Meal Kit",
    nameKo: "당뇨 케어 식단 키트",
    description: "Low-GI balanced meals for blood sugar management",
    descriptionKo: "혈당 관리를 위한 저GI 균형 식단",
    category: "nutrition",
    price: 89.99,
    originalPrice: 109.99,
    currency: "USD",
    image: "🥗",
    rating: 4.5,
    reviewCount: 234,
    tags: ["blood_sugar", "heart", "digestion"],
    inStock: true,
    isPrescriptionRequired: false,
    brand: "HealthyMeals",
    featured: true
  },
  {
    id: "prod-008",
    name: "Electrolyte Hydration Mix",
    nameKo: "전해질 수분 보충 믹스",
    description: "Optimal hydration with balanced electrolytes",
    descriptionKo: "균형 잡힌 전해질로 최적의 수분 보충",
    category: "nutrition",
    price: 14.99,
    currency: "USD",
    image: "💧",
    rating: 4.6,
    reviewCount: 456,
    tags: ["hydration", "energy", "recovery"],
    inStock: true,
    brand: "HydraBoost"
  },
  {
    id: "prod-009",
    name: "Probiotic Yogurt Drink Pack",
    nameKo: "프로바이오틱 요거트 드링크 팩",
    description: "Live cultures for digestive health",
    descriptionKo: "장 건강을 위한 생균 발효유",
    category: "nutrition",
    price: 12.99,
    currency: "USD",
    image: "🥛",
    rating: 4.4,
    reviewCount: 789,
    tags: ["digestion", "immunity", "detox"],
    inStock: true,
    brand: "GutHealth"
  },
  {
    id: "prod-010",
    name: "Green Detox Smoothie Mix",
    nameKo: "그린 디톡스 스무디 믹스",
    description: "Organic greens blend for daily detoxification",
    descriptionKo: "일상적인 디톡스를 위한 유기농 그린 블렌드",
    category: "nutrition",
    price: 29.99,
    currency: "USD",
    image: "🥬",
    rating: 4.3,
    reviewCount: 345,
    tags: ["detox", "immunity", "energy"],
    inStock: true,
    brand: "GreenLife"
  },
  // Devices
  {
    id: "prod-011",
    name: "HEPA Air Purifier Filter",
    nameKo: "헤파 공기청정기 필터",
    description: "Replacement filter for clean indoor air",
    descriptionKo: "깨끗한 실내 공기를 위한 교체용 필터",
    category: "devices",
    price: 39.99,
    currency: "USD",
    image: "🌬️",
    rating: 4.7,
    reviewCount: 567,
    tags: ["immunity", "detox"],
    inStock: true,
    brand: "CleanAir"
  },
  {
    id: "prod-012",
    name: "Smart Sleep Tracker Band",
    nameKo: "스마트 수면 추적 밴드",
    description: "Advanced sleep monitoring with heart rate",
    descriptionKo: "심박수 측정 기능의 고급 수면 모니터링",
    category: "devices",
    price: 79.99,
    originalPrice: 99.99,
    currency: "USD",
    image: "⌚",
    rating: 4.5,
    reviewCount: 234,
    tags: ["sleep", "heart", "stress"],
    inStock: true,
    brand: "SleepTech"
  },
  // Medical Food (Prescription)
  {
    id: "prod-013",
    name: "Medical Glucose Control Formula",
    nameKo: "의료용 혈당 조절 포뮬러",
    description: "Clinically formulated for diabetes management",
    descriptionKo: "당뇨 관리를 위한 임상 포뮬러",
    category: "medical_food",
    price: 49.99,
    currency: "USD",
    image: "🏥",
    rating: 4.8,
    reviewCount: 123,
    tags: ["blood_sugar", "heart"],
    inStock: true,
    isPrescriptionRequired: true,
    brand: "MediNutrition"
  },
  {
    id: "prod-014",
    name: "Kidney Support Medical Nutrition",
    nameKo: "신장 지원 의료용 영양제",
    description: "Specialized nutrition for kidney health",
    descriptionKo: "신장 건강을 위한 특수 영양제",
    category: "medical_food",
    price: 54.99,
    currency: "USD",
    image: "💉",
    rating: 4.7,
    reviewCount: 89,
    tags: ["detox", "hydration"],
    inStock: true,
    isPrescriptionRequired: true,
    brand: "RenalCare"
  },
  // Lifestyle
  {
    id: "prod-015",
    name: "Lavender Sleep Aromatherapy Set",
    nameKo: "라벤더 수면 아로마테라피 세트",
    description: "Calming essential oils for better sleep",
    descriptionKo: "숙면을 위한 진정 에센셜 오일",
    category: "lifestyle",
    price: 24.99,
    currency: "USD",
    image: "🪻",
    rating: 4.6,
    reviewCount: 456,
    tags: ["sleep", "stress"],
    inStock: true,
    brand: "AromaDream"
  },
  {
    id: "prod-016",
    name: "Stress Relief Herbal Tea Collection",
    nameKo: "스트레스 해소 허브티 컬렉션",
    description: "Organic calming herbs for relaxation",
    descriptionKo: "휴식을 위한 유기농 진정 허브",
    category: "lifestyle",
    price: 16.99,
    currency: "USD",
    image: "🍵",
    rating: 4.5,
    reviewCount: 678,
    tags: ["stress", "sleep", "digestion"],
    inStock: true,
    brand: "ZenTea"
  }
];

/* ============================================
 * Category Definitions
 * ============================================ */

export const productCategories: Record<ProductCategory, { name: string; nameKo: string; icon: string }> = {
  supplements: { name: "Supplements", nameKo: "건강기능식품", icon: "💊" },
  nutrition: { name: "Nutrition", nameKo: "영양식품", icon: "🥗" },
  devices: { name: "Devices", nameKo: "건강기기", icon: "⌚" },
  lifestyle: { name: "Lifestyle", nameKo: "라이프스타일", icon: "🌿" },
  medical_food: { name: "Medical Food", nameKo: "의료용 식품", icon: "🏥" }
};

/* ============================================
 * Health Tag to Metric Mapping
 * ============================================ */

interface HealthTagMapping {
  tag: HealthTag;
  metrics: {
    metric: keyof HealthContext;
    condition: (value: number) => boolean;
    priority: number;
  }[];
  description: string;
  descriptionKo: string;
}

const healthTagMappings: HealthTagMapping[] = [
  {
    tag: "energy",
    metrics: [
      { metric: "lactateLevel", condition: (v) => v > 2.0, priority: 3 },
      { metric: "healthScore", condition: (v) => v < 70, priority: 2 }
    ],
    description: "Boost your energy levels",
    descriptionKo: "에너지 레벨 향상"
  },
  {
    tag: "sleep",
    metrics: [
      { metric: "sleepScore", condition: (v) => v < 60, priority: 3 },
      { metric: "stressLevel", condition: (v) => v > 70, priority: 2 }
    ],
    description: "Improve sleep quality",
    descriptionKo: "수면 품질 개선"
  },
  {
    tag: "stress",
    metrics: [
      { metric: "stressLevel", condition: (v) => v > 60, priority: 3 },
      { metric: "heartRate", condition: (v) => v > 90, priority: 2 }
    ],
    description: "Reduce stress and anxiety",
    descriptionKo: "스트레스와 불안 감소"
  },
  {
    tag: "recovery",
    metrics: [
      { metric: "lactateLevel", condition: (v) => v > 2.5, priority: 3 },
      { metric: "healthScore", condition: (v) => v < 60, priority: 2 }
    ],
    description: "Support muscle recovery",
    descriptionKo: "근육 회복 지원"
  },
  {
    tag: "heart",
    metrics: [
      { metric: "heartRate", condition: (v) => v > 85 || v < 55, priority: 3 }
    ],
    description: "Support cardiovascular health",
    descriptionKo: "심혈관 건강 지원"
  },
  {
    tag: "blood_sugar",
    metrics: [
      { metric: "bloodSugar", condition: (v) => v > 140 || v < 70, priority: 3 }
    ],
    description: "Manage blood sugar levels",
    descriptionKo: "혈당 수치 관리"
  },
  {
    tag: "cognitive",
    metrics: [
      { metric: "sleepScore", condition: (v) => v < 50, priority: 2 },
      { metric: "stressLevel", condition: (v) => v > 80, priority: 2 }
    ],
    description: "Enhance mental clarity",
    descriptionKo: "정신 명료성 향상"
  }
];

/* ============================================
 * AI Recommendation Engine
 * ============================================ */

export class RecommendationEngine {
  private products: Product[];

  constructor(products: Product[] = productsDB) {
    this.products = products;
  }

  /**
   * Generate personalized recommendations based on health context
   */
  generateRecommendations(
    context: HealthContext,
    maxResults: number = 4
  ): ProductRecommendation[] {
    const recommendations: ProductRecommendation[] = [];
    const matchedTags = this.matchHealthToTags(context);

    // Score each product based on matched tags
    for (const product of this.products) {
      if (!product.inStock) continue;
      if (product.isPrescriptionRequired) continue; // Don't auto-recommend prescription items

      let totalScore = 0;
      let matchedTag: HealthTag | null = null;
      let highestPriority = 0;

      for (const tagMatch of matchedTags) {
        if (product.tags.includes(tagMatch.tag)) {
          const tagScore = tagMatch.priority * (product.featured ? 1.5 : 1);
          if (tagScore > totalScore) {
            totalScore = tagScore;
            matchedTag = tagMatch.tag;
            highestPriority = tagMatch.priority;
          }
        }
      }

      if (totalScore > 0 && matchedTag) {
        const reason = this.generateRecommendationReason(matchedTag, context);
        recommendations.push({
          product,
          reason: reason.en,
          reasonKo: reason.ko,
          matchScore: totalScore,
          healthMetric: matchedTag
        });
      }
    }

    // Sort by score and return top results
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, maxResults);
  }

  /**
   * Match health context to relevant tags
   */
  private matchHealthToTags(context: HealthContext): { tag: HealthTag; priority: number }[] {
    const matchedTags: { tag: HealthTag; priority: number }[] = [];

    for (const mapping of healthTagMappings) {
      for (const metric of mapping.metrics) {
        const value = context[metric.metric] as number | undefined;
        if (value !== undefined && metric.condition(value)) {
          matchedTags.push({ tag: mapping.tag, priority: metric.priority });
          break; // Only add tag once
        }
      }
    }

    return matchedTags;
  }

  /**
   * Generate human-readable reason for recommendation
   */
  private generateRecommendationReason(
    tag: HealthTag,
    context: HealthContext
  ): { en: string; ko: string } {
    const reasons: Record<HealthTag, { en: string; ko: string }> = {
      energy: {
        en: `Based on your elevated lactate levels (${context.lactateLevel?.toFixed(1) || "high"} mmol/L), you may benefit from energy support.`,
        ko: `젖산 수치 상승(${context.lactateLevel?.toFixed(1) || "높음"} mmol/L)에 따라 에너지 보충이 도움될 수 있습니다.`
      },
      sleep: {
        en: `Your sleep score of ${context.sleepScore || "low"} suggests you could use sleep support.`,
        ko: `수면 점수(${context.sleepScore || "낮음"})에 따라 수면 보조제가 도움될 수 있습니다.`
      },
      stress: {
        en: `With a stress level of ${context.stressLevel || "elevated"}, stress relief supplements may help.`,
        ko: `스트레스 수준(${context.stressLevel || "높음"})에 따라 스트레스 해소 제품이 도움될 수 있습니다.`
      },
      recovery: {
        en: `Your body shows signs of fatigue. Recovery support is recommended.`,
        ko: `피로 징후가 감지되었습니다. 회복 보조제를 권장합니다.`
      },
      heart: {
        en: `Your heart rate patterns suggest cardiovascular support could be beneficial.`,
        ko: `심박수 패턴에 따라 심혈관 건강 지원이 도움될 수 있습니다.`
      },
      blood_sugar: {
        en: `Blood sugar management products may help maintain stable levels.`,
        ko: `혈당 관리 제품이 안정적인 수치 유지에 도움될 수 있습니다.`
      },
      immunity: {
        en: `Boost your immune system for overall wellness.`,
        ko: `전반적인 건강을 위한 면역력 강화를 권장합니다.`
      },
      digestion: {
        en: `Support your digestive health for better nutrient absorption.`,
        ko: `영양소 흡수를 위한 소화 건강 지원을 권장합니다.`
      },
      anti_inflammatory: {
        en: `Anti-inflammatory support may aid in recovery.`,
        ko: `항염 지원이 회복에 도움될 수 있습니다.`
      },
      cognitive: {
        en: `Enhance mental clarity and focus with cognitive support.`,
        ko: `인지 지원으로 정신 명료성과 집중력을 향상시키세요.`
      },
      hydration: {
        en: `Proper hydration is essential for optimal health.`,
        ko: `최적의 건강을 위해 적절한 수분 보충이 필수입니다.`
      },
      detox: {
        en: `Support your body's natural detoxification process.`,
        ko: `신체의 자연 해독 과정을 지원합니다.`
      }
    };

    return reasons[tag] || { en: "Recommended for your health profile.", ko: "건강 프로필에 맞춰 추천합니다." };
  }

  /**
   * Get products by category
   */
  getProductsByCategory(category: ProductCategory): Product[] {
    return this.products.filter(p => p.category === category && p.inStock);
  }

  /**
   * Get featured products
   */
  getFeaturedProducts(): Product[] {
    return this.products.filter(p => p.featured && p.inStock);
  }

  /**
   * Search products
   */
  searchProducts(query: string): Product[] {
    const lowerQuery = query.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.nameKo.includes(query) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.tags.some(t => t.includes(lowerQuery))
    );
  }

  /**
   * Get product by ID
   */
  getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }
}

/* ============================================
 * Cart Manager
 * ============================================ */

const CART_STORAGE_KEY = "manpasik-cart";

export class CartManager {
  private cart: Cart;

  constructor() {
    this.cart = this.loadCart();
  }

  private loadCart(): Cart {
    if (typeof window === "undefined") {
      return this.getEmptyCart();
    }
    
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return this.recalculateTotals(parsed);
      }
    } catch {
      console.warn("Failed to load cart from storage");
    }
    return this.getEmptyCart();
  }

  private saveCart(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cart));
    }
  }

  private getEmptyCart(): Cart {
    return {
      items: [],
      subtotal: 0,
      discount: 0,
      shipping: 0,
      total: 0
    };
  }

  private recalculateTotals(cart: Cart): Cart {
    const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discount = cart.items.reduce((sum, item) => {
      if (item.product.originalPrice) {
        return sum + (item.product.originalPrice - item.product.price) * item.quantity;
      }
      return sum;
    }, 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + shipping;

    return {
      ...cart,
      subtotal,
      discount,
      shipping,
      total
    };
  }

  getCart(): Cart {
    return this.cart;
  }

  addItem(product: Product, quantity: number = 1, prescriptionInfo?: { prescriptionId: string; doctorName: string }): Cart {
    const existingIndex = this.cart.items.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      this.cart.items[existingIndex].quantity += quantity;
    } else {
      this.cart.items.push({
        product,
        quantity,
        isPrescribed: !!prescriptionInfo,
        prescriptionId: prescriptionInfo?.prescriptionId,
        doctorName: prescriptionInfo?.doctorName
      });
    }

    this.cart = this.recalculateTotals(this.cart);
    this.saveCart();
    return this.cart;
  }

  removeItem(productId: string): Cart {
    this.cart.items = this.cart.items.filter(item => item.product.id !== productId);
    this.cart = this.recalculateTotals(this.cart);
    this.saveCart();
    return this.cart;
  }

  updateQuantity(productId: string, quantity: number): Cart {
    const item = this.cart.items.find(i => i.product.id === productId);
    if (item) {
      if (quantity <= 0) {
        return this.removeItem(productId);
      }
      item.quantity = quantity;
    }
    this.cart = this.recalculateTotals(this.cart);
    this.saveCart();
    return this.cart;
  }

  clearCart(): Cart {
    this.cart = this.getEmptyCart();
    this.saveCart();
    return this.cart;
  }

  getItemCount(): number {
    return this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Add prescribed item from doctor
   */
  addPrescribedItem(productId: string, prescriptionId: string, doctorName: string): Cart {
    const product = productsDB.find(p => p.id === productId);
    if (product) {
      return this.addItem(product, 1, { prescriptionId, doctorName });
    }
    return this.cart;
  }
}

/* ============================================
 * Singleton Instances
 * ============================================ */

export const recommendationEngine = new RecommendationEngine();

// Cart manager singleton (client-side only)
let cartManagerInstance: CartManager | null = null;

export function getCartManager(): CartManager {
  if (!cartManagerInstance) {
    cartManagerInstance = new CartManager();
  }
  return cartManagerInstance;
}

/* ============================================
 * Helper Functions
 * ============================================ */

export function formatPrice(price: number, currency: string = "USD"): string {
  if (currency === "USD") {
    return `$${price.toFixed(2)}`;
  }
  return `${price.toFixed(0)}원`;
}

export function getDiscountPercentage(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100);
}

/**
 * Generate AI coach recommendation text based on health context
 */
export function generateMallRecommendationText(
  context: HealthContext,
  locale: string = "ko"
): { title: string; description: string; products: ProductRecommendation[] } {
  const recommendations = recommendationEngine.generateRecommendations(context, 3);
  
  if (recommendations.length === 0) {
    return {
      title: locale === "ko" ? "오늘의 추천" : "Today's Picks",
      description: locale === "ko" 
        ? "현재 건강 상태가 양호합니다. 건강 유지를 위한 제품을 확인해보세요."
        : "Your health looks good! Check out products to maintain your wellness.",
      products: []
    };
  }

  // Determine primary health concern
  const primaryTag = recommendations[0].healthMetric as HealthTag;
  const titles: Record<string, { ko: string; en: string }> = {
    energy: { ko: "에너지 부스터 추천", en: "Energy Boosters for You" },
    sleep: { ko: "숙면을 위한 추천", en: "Sleep Better Tonight" },
    stress: { ko: "스트레스 해소 추천", en: "Stress Relief Picks" },
    recovery: { ko: "회복 지원 추천", en: "Recovery Support" },
    default: { ko: "맞춤 건강 추천", en: "Personalized for You" }
  };

  const titlePair = titles[primaryTag] || titles.default;

  return {
    title: locale === "ko" ? titlePair.ko : titlePair.en,
    description: locale === "ko" ? recommendations[0].reasonKo : recommendations[0].reason,
    products: recommendations
  };
}






