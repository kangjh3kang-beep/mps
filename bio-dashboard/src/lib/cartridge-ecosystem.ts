/**
 * Manpasik Cartridge Ecosystem
 * 
 * The "App Store" for Sensors - Digital Cartridge Marketplace
 */

/* ============================================
 * 1. Types & Interfaces
 * ============================================
 */

/**
 * Cartridge Category
 */
export type CartridgeCategory = 
  | "medical"       // 의료
  | "environmental" // 환경 (물/공기)
  | "food_safety"   // 식품 안전
  | "industrial";   // 산업용

/**
 * Review Status for Developer Submissions
 */
export type ReviewStatus = 
  | "draft"         // 초안
  | "pending"       // 검토 대기
  | "in_review"     // 검토 중
  | "approved"      // 승인됨
  | "rejected";     // 거부됨

/**
 * Target Analyte Definition
 */
export interface TargetAnalyte {
  id: string;
  name: string;
  nameKo: string;
  unit: string;
  normalRange: { min: number; max: number };
  criticalRange?: { min: number; max: number };
}

/**
 * Sensor Coefficients for Calibration
 */
export interface SensorCoefficients {
  slope: number;
  intercept: number;
  r_squared: number;
  temperature_compensation: number;
  humidity_compensation: number;
}

/**
 * Calibration Logic
 */
export interface CalibrationLogic {
  algorithm: "linear" | "polynomial" | "exponential" | "neural";
  coefficients: SensorCoefficients;
  preprocessing: string[];  // e.g., ["normalize", "filter", "baseline_correction"]
  postprocessing: string[]; // e.g., ["unit_conversion", "range_check"]
}

/**
 * Cartridge Specification (Technical)
 */
export interface CartridgeSpec {
  version: string;
  sensorType: string;
  channelCount: number;
  targetAnalytes: TargetAnalyte[];
  calibrationLogic: CalibrationLogic;
  compatibleReaders: string[];
  firmwareVersion: string;
  validityPeriod: number; // days
}

/**
 * Marketing Information
 */
export interface MarketingInfo {
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  shortDescription: string;
  imageUrl: string;
  iconUrl: string;
  screenshots: string[];
  tags: string[];
  videoUrl?: string;
}

/**
 * Developer Information
 */
export interface DeveloperInfo {
  id: string;
  name: string;
  company: string;
  email: string;
  website?: string;
  verified: boolean;
  joinedAt: number;
}

/**
 * Digital Cartridge Profile (The "App")
 */
export interface DigitalCartridge {
  id: string;
  slug: string;
  category: CartridgeCategory;
  spec: CartridgeSpec;
  marketing: MarketingInfo;
  developer: DeveloperInfo;
  pricing: {
    type: "free" | "paid" | "subscription";
    price: number; // in cents
    currency: string;
  };
  stats: {
    downloads: number;
    rating: number;
    reviewCount: number;
  };
  reviewStatus: ReviewStatus;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Developer Submission
 */
export interface CartridgeSubmission {
  id: string;
  developerId: string;
  cartridgeId: string;
  specJson: string; // Raw JSON uploaded
  marketingData: MarketingInfo;
  status: ReviewStatus;
  reviewNotes: string[];
  submittedAt: number;
  reviewedAt: number | null;
  reviewedBy: string | null;
}

/**
 * User's Cartridge Library
 */
export interface UserCartridgeLibrary {
  userId: string;
  cartridges: {
    cartridgeId: string;
    purchasedAt: number;
    syncedToDevice: boolean;
    lastSyncAt: number | null;
    deviceId: string | null;
  }[];
}

/* ============================================
 * 2. Mock Data - Categories
 * ============================================
 */
export const CARTRIDGE_CATEGORIES: { 
  id: CartridgeCategory; 
  name: string; 
  nameKo: string; 
  icon: string;
  description: string;
}[] = [
  {
    id: "medical",
    name: "Medical",
    nameKo: "의료",
    icon: "🏥",
    description: "Blood glucose, lactate, cortisol, and other health biomarkers"
  },
  {
    id: "environmental",
    name: "Environmental",
    nameKo: "환경",
    icon: "🌍",
    description: "Water quality, air pollution, and environmental monitoring"
  },
  {
    id: "food_safety",
    name: "Food Safety",
    nameKo: "식품 안전",
    icon: "🍎",
    description: "Freshness detection, contamination, and quality control"
  },
  {
    id: "industrial",
    name: "Industrial",
    nameKo: "산업용",
    icon: "🏭",
    description: "Process monitoring, chemical analysis, and quality assurance"
  }
];

/* ============================================
 * 3. Mock Data - Sample Cartridges
 * ============================================
 */
const SAMPLE_DEVELOPER: DeveloperInfo = {
  id: "dev-001",
  name: "BioSense Labs",
  company: "BioSense Technologies Inc.",
  email: "dev@biosense.com",
  website: "https://biosense.com",
  verified: true,
  joinedAt: Date.now() - 365 * 24 * 60 * 60 * 1000
};

const SAMPLE_DEVELOPER_2: DeveloperInfo = {
  id: "dev-002",
  name: "EnviroTech",
  company: "Environmental Technologies Co.",
  email: "support@envirotech.io",
  website: "https://envirotech.io",
  verified: true,
  joinedAt: Date.now() - 180 * 24 * 60 * 60 * 1000
};

const SAMPLE_DEVELOPER_3: DeveloperInfo = {
  id: "dev-003",
  name: "FoodGuard",
  company: "FoodGuard Safety Solutions",
  email: "hello@foodguard.co",
  verified: false,
  joinedAt: Date.now() - 30 * 24 * 60 * 60 * 1000
};

export const MOCK_CARTRIDGES: DigitalCartridge[] = [
  // Medical
  {
    id: "cart-001",
    slug: "glucose-pro-v2",
    category: "medical",
    spec: {
      version: "2.1.0",
      sensorType: "electrochemical",
      channelCount: 3,
      targetAnalytes: [
        { id: "glucose", name: "Blood Glucose", nameKo: "혈당", unit: "mg/dL", normalRange: { min: 70, max: 100 } }
      ],
      calibrationLogic: {
        algorithm: "linear",
        coefficients: { slope: 0.156, intercept: 2.3, r_squared: 0.998, temperature_compensation: 0.02, humidity_compensation: 0.01 },
        preprocessing: ["baseline_correction", "noise_filter"],
        postprocessing: ["unit_conversion", "range_validation"]
      },
      compatibleReaders: ["MPS-R1", "MPS-R2", "MPS-Pro"],
      firmwareVersion: "1.5.0",
      validityPeriod: 365
    },
    marketing: {
      title: "Glucose Pro V2",
      titleKo: "글루코스 프로 V2",
      description: "Professional-grade glucose monitoring with enhanced accuracy. FDA-cleared technology for reliable diabetes management.",
      descriptionKo: "향상된 정확도의 전문가급 혈당 모니터링. FDA 승인 기술로 신뢰할 수 있는 당뇨 관리.",
      shortDescription: "High-accuracy glucose monitoring",
      imageUrl: "/cartridges/glucose-pro.png",
      iconUrl: "/cartridges/icons/glucose.svg",
      screenshots: ["/screenshots/glucose-1.png", "/screenshots/glucose-2.png"],
      tags: ["glucose", "diabetes", "blood sugar", "medical"]
    },
    developer: SAMPLE_DEVELOPER,
    pricing: { type: "paid", price: 2999, currency: "USD" },
    stats: { downloads: 15420, rating: 4.8, reviewCount: 342 },
    reviewStatus: "approved",
    publishedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000
  },
  {
    id: "cart-002",
    slug: "lactate-sensor",
    category: "medical",
    spec: {
      version: "1.3.0",
      sensorType: "electrochemical",
      channelCount: 2,
      targetAnalytes: [
        { id: "lactate", name: "Blood Lactate", nameKo: "혈중 젖산", unit: "mmol/L", normalRange: { min: 0.5, max: 2.0 }, criticalRange: { min: 0, max: 4.0 } }
      ],
      calibrationLogic: {
        algorithm: "polynomial",
        coefficients: { slope: 0.234, intercept: 0.15, r_squared: 0.995, temperature_compensation: 0.015, humidity_compensation: 0.008 },
        preprocessing: ["differential", "kalman_filter"],
        postprocessing: ["unit_conversion"]
      },
      compatibleReaders: ["MPS-R1", "MPS-R2"],
      firmwareVersion: "1.4.0",
      validityPeriod: 180
    },
    marketing: {
      title: "Sports Lactate Sensor",
      titleKo: "스포츠 젖산 센서",
      description: "Real-time lactate monitoring for athletes and fitness enthusiasts. Track your performance and recovery.",
      descriptionKo: "운동선수와 피트니스 애호가를 위한 실시간 젖산 모니터링. 성과와 회복을 추적하세요.",
      shortDescription: "Real-time lactate for athletes",
      imageUrl: "/cartridges/lactate-sport.png",
      iconUrl: "/cartridges/icons/lactate.svg",
      screenshots: [],
      tags: ["lactate", "sports", "fitness", "athlete"]
    },
    developer: SAMPLE_DEVELOPER,
    pricing: { type: "paid", price: 1999, currency: "USD" },
    stats: { downloads: 8750, rating: 4.6, reviewCount: 189 },
    reviewStatus: "approved",
    publishedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 14 * 24 * 60 * 60 * 1000
  },
  {
    id: "cart-003",
    slug: "cortisol-stress",
    category: "medical",
    spec: {
      version: "1.0.0",
      sensorType: "immunoassay",
      channelCount: 4,
      targetAnalytes: [
        { id: "cortisol", name: "Cortisol", nameKo: "코르티솔", unit: "μg/dL", normalRange: { min: 5, max: 25 } }
      ],
      calibrationLogic: {
        algorithm: "exponential",
        coefficients: { slope: 0.089, intercept: 1.2, r_squared: 0.992, temperature_compensation: 0.025, humidity_compensation: 0.012 },
        preprocessing: ["normalize", "baseline_correction"],
        postprocessing: ["logarithmic_transform", "range_check"]
      },
      compatibleReaders: ["MPS-Pro"],
      firmwareVersion: "2.0.0",
      validityPeriod: 90
    },
    marketing: {
      title: "Stress Monitor (Cortisol)",
      titleKo: "스트레스 모니터 (코르티솔)",
      description: "Non-invasive cortisol monitoring for stress management. Understand your body's stress response.",
      descriptionKo: "스트레스 관리를 위한 비침습적 코르티솔 모니터링. 신체의 스트레스 반응을 이해하세요.",
      shortDescription: "Track stress levels easily",
      imageUrl: "/cartridges/cortisol.png",
      iconUrl: "/cartridges/icons/cortisol.svg",
      screenshots: [],
      tags: ["cortisol", "stress", "mental health", "wellness"]
    },
    developer: SAMPLE_DEVELOPER,
    pricing: { type: "paid", price: 3499, currency: "USD" },
    stats: { downloads: 3200, rating: 4.4, reviewCount: 78 },
    reviewStatus: "approved",
    publishedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000
  },
  
  // Environmental
  {
    id: "cart-004",
    slug: "water-quality-basic",
    category: "environmental",
    spec: {
      version: "2.0.0",
      sensorType: "multi-electrode",
      channelCount: 6,
      targetAnalytes: [
        { id: "ph", name: "pH Level", nameKo: "pH 수치", unit: "pH", normalRange: { min: 6.5, max: 8.5 } },
        { id: "chlorine", name: "Chlorine", nameKo: "염소", unit: "ppm", normalRange: { min: 0, max: 4 } },
        { id: "turbidity", name: "Turbidity", nameKo: "탁도", unit: "NTU", normalRange: { min: 0, max: 1 } }
      ],
      calibrationLogic: {
        algorithm: "linear",
        coefficients: { slope: 1.0, intercept: 0, r_squared: 0.999, temperature_compensation: 0.03, humidity_compensation: 0.0 },
        preprocessing: ["temperature_adjust"],
        postprocessing: ["multi_parameter_fusion"]
      },
      compatibleReaders: ["MPS-R1", "MPS-R2", "MPS-Pro"],
      firmwareVersion: "1.5.0",
      validityPeriod: 730
    },
    marketing: {
      title: "Water Quality Basic",
      titleKo: "수질 검사 베이직",
      description: "Essential water quality testing for home and field use. Test pH, chlorine, and turbidity in seconds.",
      descriptionKo: "가정과 현장용 필수 수질 검사. 몇 초 만에 pH, 염소, 탁도를 측정하세요.",
      shortDescription: "Essential water testing kit",
      imageUrl: "/cartridges/water-quality.png",
      iconUrl: "/cartridges/icons/water.svg",
      screenshots: [],
      tags: ["water", "pH", "chlorine", "environmental"]
    },
    developer: SAMPLE_DEVELOPER_2,
    pricing: { type: "free", price: 0, currency: "USD" },
    stats: { downloads: 45200, rating: 4.7, reviewCount: 1024 },
    reviewStatus: "approved",
    publishedAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 200 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000
  },
  {
    id: "cart-005",
    slug: "air-quality-pro",
    category: "environmental",
    spec: {
      version: "3.1.0",
      sensorType: "gas-array",
      channelCount: 12,
      targetAnalytes: [
        { id: "pm25", name: "PM2.5", nameKo: "미세먼지", unit: "μg/m³", normalRange: { min: 0, max: 35 } },
        { id: "co2", name: "CO2", nameKo: "이산화탄소", unit: "ppm", normalRange: { min: 400, max: 1000 } },
        { id: "voc", name: "VOC", nameKo: "휘발성유기화합물", unit: "ppb", normalRange: { min: 0, max: 500 } }
      ],
      calibrationLogic: {
        algorithm: "neural",
        coefficients: { slope: 0, intercept: 0, r_squared: 0.997, temperature_compensation: 0.02, humidity_compensation: 0.035 },
        preprocessing: ["normalize", "feature_extraction"],
        postprocessing: ["ensemble_fusion", "confidence_score"]
      },
      compatibleReaders: ["MPS-Pro"],
      firmwareVersion: "2.0.0",
      validityPeriod: 365
    },
    marketing: {
      title: "Air Quality Pro",
      titleKo: "공기질 프로",
      description: "Comprehensive air quality monitoring with AI-powered analysis. PM2.5, CO2, VOC, and more.",
      descriptionKo: "AI 기반 분석의 종합 공기질 모니터링. PM2.5, CO2, VOC 등.",
      shortDescription: "AI-powered air monitoring",
      imageUrl: "/cartridges/air-quality.png",
      iconUrl: "/cartridges/icons/air.svg",
      screenshots: [],
      tags: ["air", "PM2.5", "CO2", "VOC", "pollution"]
    },
    developer: SAMPLE_DEVELOPER_2,
    pricing: { type: "paid", price: 4999, currency: "USD" },
    stats: { downloads: 12300, rating: 4.9, reviewCount: 456 },
    reviewStatus: "approved",
    publishedAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 150 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000
  },
  
  // Food Safety
  {
    id: "cart-006",
    slug: "freshness-detector",
    category: "food_safety",
    spec: {
      version: "1.5.0",
      sensorType: "gas-array",
      channelCount: 8,
      targetAnalytes: [
        { id: "ammonia", name: "Ammonia", nameKo: "암모니아", unit: "ppm", normalRange: { min: 0, max: 10 } },
        { id: "h2s", name: "Hydrogen Sulfide", nameKo: "황화수소", unit: "ppm", normalRange: { min: 0, max: 1 } }
      ],
      calibrationLogic: {
        algorithm: "polynomial",
        coefficients: { slope: 0.45, intercept: 0.5, r_squared: 0.994, temperature_compensation: 0.02, humidity_compensation: 0.025 },
        preprocessing: ["baseline_correction", "humidity_adjust"],
        postprocessing: ["freshness_index", "spoilage_alert"]
      },
      compatibleReaders: ["MPS-R1", "MPS-R2"],
      firmwareVersion: "1.4.0",
      validityPeriod: 180
    },
    marketing: {
      title: "Food Freshness Detector",
      titleKo: "식품 신선도 검사기",
      description: "Instantly check if your food is fresh or spoiled. Electronic nose technology for safe eating.",
      descriptionKo: "음식의 신선도를 즉시 확인하세요. 안전한 식사를 위한 전자 코 기술.",
      shortDescription: "Check food freshness instantly",
      imageUrl: "/cartridges/food-fresh.png",
      iconUrl: "/cartridges/icons/food.svg",
      screenshots: [],
      tags: ["food", "freshness", "spoilage", "safety"]
    },
    developer: SAMPLE_DEVELOPER_3,
    pricing: { type: "paid", price: 1499, currency: "USD" },
    stats: { downloads: 6800, rating: 4.3, reviewCount: 156 },
    reviewStatus: "approved",
    publishedAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000
  },
  {
    id: "cart-007",
    slug: "allergen-screen",
    category: "food_safety",
    spec: {
      version: "1.0.0",
      sensorType: "immunoassay",
      channelCount: 8,
      targetAnalytes: [
        { id: "gluten", name: "Gluten", nameKo: "글루텐", unit: "ppm", normalRange: { min: 0, max: 20 } },
        { id: "peanut", name: "Peanut", nameKo: "땅콩", unit: "ppm", normalRange: { min: 0, max: 5 } }
      ],
      calibrationLogic: {
        algorithm: "exponential",
        coefficients: { slope: 0.12, intercept: 0.8, r_squared: 0.991, temperature_compensation: 0.018, humidity_compensation: 0.01 },
        preprocessing: ["sample_prep", "incubation_timer"],
        postprocessing: ["allergen_detection", "cross_reactivity_check"]
      },
      compatibleReaders: ["MPS-Pro"],
      firmwareVersion: "2.0.0",
      validityPeriod: 90
    },
    marketing: {
      title: "Allergen Screening Kit",
      titleKo: "알레르기 유발물질 검사 키트",
      description: "Quickly test food for common allergens. Essential for families with food allergies.",
      descriptionKo: "일반적인 알레르기 유발물질을 빠르게 검사하세요. 식품 알레르기가 있는 가족을 위한 필수품.",
      shortDescription: "Detect food allergens fast",
      imageUrl: "/cartridges/allergen.png",
      iconUrl: "/cartridges/icons/allergen.svg",
      screenshots: [],
      tags: ["allergen", "gluten", "peanut", "food safety"]
    },
    developer: SAMPLE_DEVELOPER_3,
    pricing: { type: "paid", price: 2499, currency: "USD" },
    stats: { downloads: 4500, rating: 4.5, reviewCount: 98 },
    reviewStatus: "approved",
    publishedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000
  },
  
  // Industrial
  {
    id: "cart-008",
    slug: "industrial-chemical",
    category: "industrial",
    spec: {
      version: "2.0.0",
      sensorType: "multi-electrode",
      channelCount: 16,
      targetAnalytes: [
        { id: "ethanol", name: "Ethanol", nameKo: "에탄올", unit: "%", normalRange: { min: 0, max: 100 } },
        { id: "methanol", name: "Methanol", nameKo: "메탄올", unit: "ppm", normalRange: { min: 0, max: 100 } }
      ],
      calibrationLogic: {
        algorithm: "neural",
        coefficients: { slope: 0, intercept: 0, r_squared: 0.998, temperature_compensation: 0.01, humidity_compensation: 0.005 },
        preprocessing: ["high_precision_adc", "temperature_stabilize"],
        postprocessing: ["purity_calculation", "contamination_alert"]
      },
      compatibleReaders: ["MPS-Pro", "MPS-Industrial"],
      firmwareVersion: "3.0.0",
      validityPeriod: 365
    },
    marketing: {
      title: "Industrial Chemical Analyzer",
      titleKo: "산업용 화학 분석기",
      description: "High-precision chemical analysis for industrial quality control. ISO-certified accuracy.",
      descriptionKo: "산업용 품질 관리를 위한 고정밀 화학 분석. ISO 인증 정확도.",
      shortDescription: "ISO-certified chemical analysis",
      imageUrl: "/cartridges/industrial.png",
      iconUrl: "/cartridges/icons/industrial.svg",
      screenshots: [],
      tags: ["industrial", "chemical", "quality control", "ISO"]
    },
    developer: SAMPLE_DEVELOPER_2,
    pricing: { type: "subscription", price: 9999, currency: "USD" },
    stats: { downloads: 2100, rating: 4.7, reviewCount: 45 },
    reviewStatus: "approved",
    publishedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 15 * 24 * 60 * 60 * 1000
  }
];

/* ============================================
 * 4. Store Manager
 * ============================================
 */
const LS_LIBRARY_KEY = "bio-dashboard:cartridge-library";
const LS_SUBMISSIONS_KEY = "bio-dashboard:cartridge-submissions";

class CartridgeEcosystemStore {
  private cartridges: DigitalCartridge[] = [...MOCK_CARTRIDGES];
  private submissions: CartridgeSubmission[] = [];
  private userLibrary: UserCartridgeLibrary | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    
    try {
      const libraryJson = localStorage.getItem(LS_LIBRARY_KEY);
      if (libraryJson) {
        this.userLibrary = JSON.parse(libraryJson);
      }
      
      const submissionsJson = localStorage.getItem(LS_SUBMISSIONS_KEY);
      if (submissionsJson) {
        this.submissions = JSON.parse(submissionsJson);
      }
    } catch {
      // Ignore
    }
  }

  private saveLibrary() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LS_LIBRARY_KEY, JSON.stringify(this.userLibrary));
    } catch {
      // Ignore
    }
  }

  private saveSubmissions() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LS_SUBMISSIONS_KEY, JSON.stringify(this.submissions));
    } catch {
      // Ignore
    }
  }

  // ===== Cartridge Store =====
  
  getAllCartridges(): DigitalCartridge[] {
    return this.cartridges.filter(c => c.reviewStatus === "approved");
  }

  getCartridgesByCategory(category: CartridgeCategory): DigitalCartridge[] {
    return this.getAllCartridges().filter(c => c.category === category);
  }

  getCartridgeById(id: string): DigitalCartridge | undefined {
    return this.cartridges.find(c => c.id === id);
  }

  getCartridgeBySlug(slug: string): DigitalCartridge | undefined {
    return this.cartridges.find(c => c.slug === slug);
  }

  searchCartridges(query: string): DigitalCartridge[] {
    const q = query.toLowerCase();
    return this.getAllCartridges().filter(c =>
      c.marketing.title.toLowerCase().includes(q) ||
      c.marketing.titleKo.toLowerCase().includes(q) ||
      c.marketing.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  getFeaturedCartridges(): DigitalCartridge[] {
    return this.getAllCartridges()
      .sort((a, b) => b.stats.downloads - a.stats.downloads)
      .slice(0, 4);
  }

  getNewCartridges(): DigitalCartridge[] {
    return this.getAllCartridges()
      .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
      .slice(0, 4);
  }

  // ===== User Library =====
  
  getUserLibrary(userId: string): UserCartridgeLibrary {
    if (!this.userLibrary || this.userLibrary.userId !== userId) {
      this.userLibrary = { userId, cartridges: [] };
    }
    return this.userLibrary;
  }

  isInLibrary(userId: string, cartridgeId: string): boolean {
    const library = this.getUserLibrary(userId);
    return library.cartridges.some(c => c.cartridgeId === cartridgeId);
  }

  addToLibrary(userId: string, cartridgeId: string): boolean {
    const library = this.getUserLibrary(userId);
    
    if (this.isInLibrary(userId, cartridgeId)) {
      return false; // Already owned
    }

    library.cartridges.push({
      cartridgeId,
      purchasedAt: Date.now(),
      syncedToDevice: false,
      lastSyncAt: null,
      deviceId: null
    });

    // Update download count
    const cartridge = this.getCartridgeById(cartridgeId);
    if (cartridge) {
      cartridge.stats.downloads++;
    }

    this.saveLibrary();
    return true;
  }

  // ===== BLE Sync Simulation =====
  
  async syncToDevice(userId: string, cartridgeId: string, deviceId: string): Promise<{
    success: boolean;
    message: string;
    firmwareUpdate?: { version: string; changes: string[] };
  }> {
    const library = this.getUserLibrary(userId);
    const item = library.cartridges.find(c => c.cartridgeId === cartridgeId);
    
    if (!item) {
      return { success: false, message: "Cartridge not found in library" };
    }

    const cartridge = this.getCartridgeById(cartridgeId);
    if (!cartridge) {
      return { success: false, message: "Cartridge profile not found" };
    }

    // Simulate BLE connection and firmware update
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay

    item.syncedToDevice = true;
    item.lastSyncAt = Date.now();
    item.deviceId = deviceId;
    
    this.saveLibrary();

    return {
      success: true,
      message: `Successfully synced "${cartridge.marketing.title}" to device ${deviceId}`,
      firmwareUpdate: {
        version: cartridge.spec.firmwareVersion,
        changes: [
          `Added calibration for: ${cartridge.spec.targetAnalytes.map(a => a.name).join(", ")}`,
          `Updated lookup table with ${cartridge.spec.channelCount} channels`,
          `Applied ${cartridge.spec.calibrationLogic.algorithm} algorithm`
        ]
      }
    };
  }

  // ===== Developer Console =====
  
  getSubmissions(developerId?: string): CartridgeSubmission[] {
    if (developerId) {
      return this.submissions.filter(s => s.developerId === developerId);
    }
    return this.submissions;
  }

  createSubmission(
    developerId: string, 
    specJson: string, 
    marketingData: MarketingInfo
  ): CartridgeSubmission {
    const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const cartridgeId = `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    const submission: CartridgeSubmission = {
      id,
      developerId,
      cartridgeId,
      specJson,
      marketingData,
      status: "pending",
      reviewNotes: [],
      submittedAt: Date.now(),
      reviewedAt: null,
      reviewedBy: null
    };

    this.submissions.push(submission);
    this.saveSubmissions();
    
    return submission;
  }

  updateSubmissionStatus(
    submissionId: string, 
    status: ReviewStatus, 
    notes?: string
  ): boolean {
    const submission = this.submissions.find(s => s.id === submissionId);
    if (!submission) return false;

    submission.status = status;
    if (notes) {
      submission.reviewNotes.push(notes);
    }
    
    if (status === "approved" || status === "rejected") {
      submission.reviewedAt = Date.now();
      submission.reviewedBy = "admin@manpasik.com";
    }

    this.saveSubmissions();
    return true;
  }

  // Mock approve after delay (for demo)
  async simulateReview(submissionId: string): Promise<void> {
    this.updateSubmissionStatus(submissionId, "in_review", "Review started");
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 80% chance of approval
    if (Math.random() > 0.2) {
      this.updateSubmissionStatus(submissionId, "approved", "All checks passed. Approved for publication.");
    } else {
      this.updateSubmissionStatus(submissionId, "rejected", "Calibration coefficients need verification.");
    }
  }
}

// Singleton instance
export const cartridgeEcosystem = new CartridgeEcosystemStore();

// Export types for components
export type { DigitalCartridge, CartridgeSubmission, UserCartridgeLibrary };






