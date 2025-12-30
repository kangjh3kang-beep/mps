/**
 * AI Commerce Manager
 * Generative UI, Smart Inventory, CS Automation
 */

/* ============================================
 * Types
 * ============================================ */

// Mall Theme & UI
export interface MallTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
}

export interface BannerConfig {
  id: string;
  imageUrl: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
  theme: "light" | "dark";
  overlayColor: string;
  overlayOpacity: number;
}

export interface MallUIState {
  theme: MallTheme;
  heroBanner: BannerConfig;
  promotionBanners: BannerConfig[];
  featuredProducts: string[];
  announcementBar: {
    enabled: boolean;
    text: string;
    backgroundColor: string;
    textColor: string;
  };
  lastUpdated: string;
  updatedBy: string;
}

// AI Design Commands
export interface DesignCommand {
  type: "theme_change" | "banner_update" | "promotion_add" | "layout_change" | "announcement";
  params: Record<string, unknown>;
  preview: MallUIState;
  confidence: number;
  reasoning: string;
}

// Inventory & Pricing
export interface InventoryPrediction {
  productId: string;
  productName: string;
  currentStock: number;
  predictedDemand: number;
  recommendedOrder: number;
  urgency: "low" | "medium" | "high" | "critical";
  reason: string;
  triggerSignal: string;
}

export interface DynamicBundle {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  products: {
    productId: string;
    name: string;
    originalPrice: number;
    bundlePrice: number;
  }[];
  totalOriginalPrice: number;
  bundlePrice: number;
  discountPct: number;
  targetUserIds: string[];
  triggerCondition: string;
  expiresAt: string;
  status: "draft" | "active" | "expired";
}

// CS Automation
export interface CSTicket {
  id: string;
  userId: string;
  userName: string;
  type: "refund" | "shipping" | "quality" | "general";
  subject: string;
  description: string;
  orderId?: string;
  productId?: string;
  createdAt: string;
  status: "open" | "processing" | "resolved" | "escalated";
  priority: "low" | "medium" | "high";
  aiResolution?: AIResolution;
}

export interface AIResolution {
  action: "approve" | "deny" | "escalate" | "respond";
  reasoning: string;
  confidence: number;
  autoExecuted: boolean;
  response?: string;
  refundAmount?: number;
  executedAt?: string;
}

/* ============================================
 * Default States
 * ============================================ */

export const DEFAULT_THEME: MallTheme = {
  id: "medical-blue",
  name: "Medical Blue",
  primaryColor: "#0ea5e9",
  secondaryColor: "#0284c7",
  accentColor: "#f59e0b",
  backgroundColor: "#ffffff",
  textColor: "#1e293b",
  fontFamily: "Inter, sans-serif",
  borderRadius: "0.75rem"
};

export const CHRISTMAS_THEME: MallTheme = {
  id: "christmas",
  name: "Christmas",
  primaryColor: "#dc2626",
  secondaryColor: "#16a34a",
  accentColor: "#fbbf24",
  backgroundColor: "#fef2f2",
  textColor: "#1e293b",
  fontFamily: "Inter, sans-serif",
  borderRadius: "1rem"
};

export const DEFAULT_BANNER: BannerConfig = {
  id: "hero-1",
  imageUrl: "/banners/default-health.jpg",
  headline: "Your Health, Our Mission",
  subheadline: "Advanced biosensing for personalized wellness",
  ctaText: "Shop Now",
  ctaLink: "/store/products",
  theme: "dark",
  overlayColor: "#000000",
  overlayOpacity: 0.4
};

export const CHRISTMAS_BANNER: BannerConfig = {
  id: "hero-christmas",
  imageUrl: "/banners/christmas-health.jpg",
  headline: "🎄 Gift Health This Season",
  subheadline: "Special holiday bundles for your loved ones",
  ctaText: "Shop Holiday Gifts",
  ctaLink: "/store/products?category=gifts",
  theme: "light",
  overlayColor: "#dc2626",
  overlayOpacity: 0.2
};

export function getDefaultMallState(): MallUIState {
  return {
    theme: DEFAULT_THEME,
    heroBanner: DEFAULT_BANNER,
    promotionBanners: [],
    featuredProducts: ["prod_vitamin_b", "prod_omega3", "prod_cartridge_5pack"],
    announcementBar: {
      enabled: false,
      text: "",
      backgroundColor: "#0ea5e9",
      textColor: "#ffffff"
    },
    lastUpdated: new Date().toISOString(),
    updatedBy: "system"
  };
}

/* ============================================
 * Generative UI Designer (Prompt-to-UI)
 * ============================================ */

export interface PromptAnalysis {
  intent: string;
  entities: {
    theme?: string;
    color?: string;
    slogan?: string;
    product?: string;
    event?: string;
  };
  commands: DesignCommand[];
}

/**
 * Parse natural language prompt and generate UI changes
 */
export function parseDesignPrompt(prompt: string, currentState: MallUIState): PromptAnalysis {
  const lowerPrompt = prompt.toLowerCase();
  const commands: DesignCommand[] = [];
  
  // Detect theme changes
  if (lowerPrompt.includes("christmas") || lowerPrompt.includes("holiday") || lowerPrompt.includes("크리스마스")) {
    const newState = {
      ...currentState,
      theme: CHRISTMAS_THEME,
      heroBanner: CHRISTMAS_BANNER,
      announcementBar: {
        enabled: true,
        text: "🎄 Holiday Sale! Free shipping on orders over ₩50,000",
        backgroundColor: "#dc2626",
        textColor: "#ffffff"
      }
    };
    
    commands.push({
      type: "theme_change",
      params: { theme: "christmas" },
      preview: newState,
      confidence: 0.95,
      reasoning: "Detected 'Christmas/holiday' keywords. Applying festive red/green theme with holiday banner."
    });
  }
  
  // Detect slogan updates
  const sloganMatch = prompt.match(/slogan[:\s]+["']?([^"']+)["']?/i) || 
                      prompt.match(/with\s+["']([^"']+)["']/i);
  if (sloganMatch) {
    const slogan = sloganMatch[1].trim();
    const newState = {
      ...currentState,
      heroBanner: {
        ...currentState.heroBanner,
        headline: slogan
      }
    };
    
    commands.push({
      type: "banner_update",
      params: { headline: slogan },
      preview: newState,
      confidence: 0.9,
      reasoning: `Detected slogan request: "${slogan}". Updating hero banner headline.`
    });
  }
  
  // Detect banner image requests
  if (lowerPrompt.includes("banner") && (lowerPrompt.includes("change") || lowerPrompt.includes("update"))) {
    // Mock DALL-E generation
    const generatedImageUrl = `/banners/ai-generated-${Date.now()}.jpg`;
    const newState = {
      ...currentState,
      heroBanner: {
        ...currentState.heroBanner,
        imageUrl: generatedImageUrl
      }
    };
    
    commands.push({
      type: "banner_update",
      params: { imageUrl: generatedImageUrl },
      preview: newState,
      confidence: 0.85,
      reasoning: "Generating new banner image using AI. (DALL-E mock)"
    });
  }
  
  // Detect color changes
  const colorMatch = lowerPrompt.match(/(red|green|blue|purple|orange|pink|gold)/);
  if (colorMatch) {
    const colorMap: Record<string, string> = {
      red: "#dc2626",
      green: "#16a34a",
      blue: "#0ea5e9",
      purple: "#9333ea",
      orange: "#f97316",
      pink: "#ec4899",
      gold: "#fbbf24"
    };
    const color = colorMap[colorMatch[1]] ?? "#0ea5e9";
    const newState = {
      ...currentState,
      theme: {
        ...currentState.theme,
        primaryColor: color
      }
    };
    
    commands.push({
      type: "theme_change",
      params: { primaryColor: color },
      preview: newState,
      confidence: 0.88,
      reasoning: `Detected color preference: ${colorMatch[1]}. Updating primary color.`
    });
  }
  
  // Detect announcement bar
  if (lowerPrompt.includes("announcement") || lowerPrompt.includes("notice") || lowerPrompt.includes("공지")) {
    const textMatch = prompt.match(/["']([^"']+)["']/);
    const text = textMatch?.[1] ?? "Special announcement!";
    const newState = {
      ...currentState,
      announcementBar: {
        enabled: true,
        text,
        backgroundColor: currentState.theme.primaryColor,
        textColor: "#ffffff"
      }
    };
    
    commands.push({
      type: "announcement",
      params: { text, enabled: true },
      preview: newState,
      confidence: 0.92,
      reasoning: `Adding announcement bar with text: "${text}"`
    });
  }
  
  // Default response if no commands detected
  if (commands.length === 0) {
    commands.push({
      type: "theme_change",
      params: {},
      preview: currentState,
      confidence: 0.3,
      reasoning: "Could not parse specific design intent. Please try: 'Change to Christmas theme', 'Update slogan to ...', or 'Add announcement: ...'"
    });
  }
  
  return {
    intent: detectIntent(lowerPrompt),
    entities: {
      theme: lowerPrompt.includes("christmas") ? "christmas" : undefined,
      slogan: sloganMatch?.[1],
      color: colorMatch?.[1]
    },
    commands
  };
}

function detectIntent(prompt: string): string {
  if (prompt.includes("christmas") || prompt.includes("holiday")) return "apply_seasonal_theme";
  if (prompt.includes("banner")) return "update_banner";
  if (prompt.includes("color")) return "change_color";
  if (prompt.includes("announcement")) return "add_announcement";
  if (prompt.includes("slogan")) return "update_slogan";
  return "general_update";
}

/* ============================================
 * Smart Inventory & Dynamic Pricing
 * ============================================ */

export interface HealthSignal {
  region: string;
  signal: "flu_rising" | "glucose_high" | "lactate_high" | "stress_high" | "air_quality_poor";
  intensity: number; // 0-100
  affectedUsers: number;
}

/**
 * Generate inventory predictions based on health signals
 */
export function predictInventoryNeeds(
  healthSignals: HealthSignal[],
  currentInventory: { productId: string; productName: string; stock: number; warehouseId: string }[]
): InventoryPrediction[] {
  const predictions: InventoryPrediction[] = [];
  
  for (const signal of healthSignals) {
    if (signal.intensity < 30) continue; // Ignore weak signals
    
    // Map signals to products
    const productMappings: Record<string, { productId: string; productName: string; multiplier: number }[]> = {
      flu_rising: [
        { productId: "ctg_immunity", productName: "Immunity Cartridge Pack", multiplier: 2.5 },
        { productId: "sup_vitamin_c", productName: "Vitamin C Complex", multiplier: 2.0 },
        { productId: "sup_zinc", productName: "Zinc Supplement", multiplier: 1.8 }
      ],
      glucose_high: [
        { productId: "ctg_glucose", productName: "Glucose Cartridge Pack", multiplier: 2.0 },
        { productId: "sup_chromium", productName: "Chromium Picolinate", multiplier: 1.5 },
        { productId: "meal_diabetic", productName: "Diabetic Care Meal Kit", multiplier: 1.8 }
      ],
      lactate_high: [
        { productId: "ctg_lactate", productName: "Lactate Pro Cartridge", multiplier: 1.8 },
        { productId: "sup_magnesium", productName: "Magnesium Supplement", multiplier: 2.0 },
        { productId: "sup_bcaa", productName: "BCAA Recovery", multiplier: 1.5 }
      ],
      stress_high: [
        { productId: "sup_ashwagandha", productName: "Ashwagandha Extract", multiplier: 2.0 },
        { productId: "sup_melatonin", productName: "Melatonin Sleep Aid", multiplier: 1.8 }
      ],
      air_quality_poor: [
        { productId: "ctg_radon", productName: "Radon/VOC Sensor Cartridge", multiplier: 3.0 },
        { productId: "filter_hepa", productName: "HEPA Air Filter", multiplier: 2.5 }
      ]
    };
    
    const products = productMappings[signal.signal] ?? [];
    
    for (const product of products) {
      const currentStock = currentInventory.find(i => i.productId === product.productId)?.stock ?? 100;
      const baseDemand = Math.round(signal.affectedUsers * 0.1); // 10% conversion rate
      const predictedDemand = Math.round(baseDemand * product.multiplier * (signal.intensity / 100));
      const recommendedOrder = Math.max(0, predictedDemand - currentStock + 50); // Buffer of 50
      
      let urgency: InventoryPrediction["urgency"] = "low";
      if (currentStock < predictedDemand * 0.3) urgency = "critical";
      else if (currentStock < predictedDemand * 0.5) urgency = "high";
      else if (currentStock < predictedDemand) urgency = "medium";
      
      predictions.push({
        productId: product.productId,
        productName: product.productName,
        currentStock,
        predictedDemand,
        recommendedOrder,
        urgency,
        reason: `${signal.signal.replace(/_/g, " ")} detected in ${signal.region} (${signal.intensity}% intensity)`,
        triggerSignal: signal.signal
      });
    }
  }
  
  // Sort by urgency
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  predictions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  
  return predictions;
}

/**
 * Create personalized recovery bundle for a user
 */
export function createRecoveryBundle(
  userId: string,
  healthScore: number,
  lowMetrics: string[], // e.g., ["glucose", "lactate"]
  availableProducts: { id: string; name: string; price: number; tags: string[] }[]
): DynamicBundle | null {
  if (healthScore > 70) return null; // No bundle needed for healthy users
  
  const selectedProducts: DynamicBundle["products"] = [];
  
  // Always include a cartridge
  const cartridge = availableProducts.find(p => p.tags.includes("cartridge"));
  if (cartridge) {
    selectedProducts.push({
      productId: cartridge.id,
      name: cartridge.name,
      originalPrice: cartridge.price,
      bundlePrice: Math.round(cartridge.price * 0.85) // 15% off
    });
  }
  
  // Add supplements based on low metrics
  for (const metric of lowMetrics) {
    const supplement = availableProducts.find(p => 
      p.tags.includes("supplement") && 
      p.tags.includes(metric) &&
      !selectedProducts.some(sp => sp.productId === p.id)
    );
    if (supplement) {
      selectedProducts.push({
        productId: supplement.id,
        name: supplement.name,
        originalPrice: supplement.price,
        bundlePrice: Math.round(supplement.price * 0.8) // 20% off
      });
    }
  }
  
  // Add a general recovery supplement if bundle is small
  if (selectedProducts.length < 3) {
    const recovery = availableProducts.find(p => 
      p.tags.includes("recovery") &&
      !selectedProducts.some(sp => sp.productId === p.id)
    );
    if (recovery) {
      selectedProducts.push({
        productId: recovery.id,
        name: recovery.name,
        originalPrice: recovery.price,
        bundlePrice: Math.round(recovery.price * 0.75) // 25% off
      });
    }
  }
  
  if (selectedProducts.length < 2) return null; // Not enough products for a bundle
  
  const totalOriginal = selectedProducts.reduce((sum, p) => sum + p.originalPrice, 0);
  const totalBundle = selectedProducts.reduce((sum, p) => sum + p.bundlePrice, 0);
  const discountPct = Math.round((1 - totalBundle / totalOriginal) * 100);
  
  return {
    id: `bundle_${userId}_${Date.now()}`,
    name: "Personalized Recovery Bundle",
    nameKo: "맞춤 회복 번들",
    description: `Curated for your health recovery based on recent measurements`,
    descriptionKo: "최근 측정 결과를 기반으로 맞춤 구성된 회복 번들",
    products: selectedProducts,
    totalOriginalPrice: totalOriginal,
    bundlePrice: totalBundle,
    discountPct,
    targetUserIds: [userId],
    triggerCondition: `Health score dropped to ${healthScore}. Low metrics: ${lowMetrics.join(", ")}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    status: "active"
  };
}

/* ============================================
 * CS Automation Agent
 * ============================================ */

export interface QCRecord {
  cartridgeId: string;
  hasError: boolean;
  errorType?: string;
  errorDate?: string;
}

/**
 * Process a CS ticket with AI automation
 */
export function processCSTicket(
  ticket: CSTicket,
  qcRecords: QCRecord[],
  orderHistory: { orderId: string; status: string; deliveryDate?: string }[]
): AIResolution {
  // Rule 1: Auto-approve refund for QC errors
  if (ticket.type === "refund" && ticket.productId) {
    const qcRecord = qcRecords.find(r => r.cartridgeId === ticket.productId);
    if (qcRecord?.hasError) {
      return {
        action: "approve",
        reasoning: `Cartridge ${ticket.productId} has recorded QC Error (${qcRecord.errorType}). Auto-approving refund per policy.`,
        confidence: 0.98,
        autoExecuted: true,
        refundAmount: 100, // Would be actual order amount
        executedAt: new Date().toISOString()
      };
    }
  }
  
  // Rule 2: Auto-respond to shipping inquiries
  if (ticket.type === "shipping" && ticket.orderId) {
    const order = orderHistory.find(o => o.orderId === ticket.orderId);
    if (order) {
      if (order.status === "delivered") {
        return {
          action: "respond",
          reasoning: "Order has been delivered. Providing confirmation to customer.",
          confidence: 0.95,
          autoExecuted: true,
          response: `Your order ${ticket.orderId} was delivered on ${order.deliveryDate}. If you haven't received it, please check with your building reception or contact us again.`
        };
      } else if (order.status === "in_transit") {
        return {
          action: "respond",
          reasoning: "Order is in transit. Providing tracking update.",
          confidence: 0.95,
          autoExecuted: true,
          response: `Your order ${ticket.orderId} is currently in transit. Expected delivery: within 2-3 business days. You can track your package using the link sent to your email.`
        };
      }
    }
  }
  
  // Rule 3: Quality issues - check QC records
  if (ticket.type === "quality" && ticket.productId) {
    const qcRecord = qcRecords.find(r => r.cartridgeId === ticket.productId);
    if (qcRecord?.hasError) {
      return {
        action: "approve",
        reasoning: `Product ${ticket.productId} has known QC issue. Offering replacement or refund.`,
        confidence: 0.92,
        autoExecuted: false, // Needs human confirmation for quality issues
        response: `We apologize for the quality issue. Our records show this batch had a manufacturing concern. We'd like to offer you a replacement or full refund. Which would you prefer?`
      };
    }
  }
  
  // Rule 4: High priority tickets - escalate
  if (ticket.priority === "high") {
    return {
      action: "escalate",
      reasoning: "High priority ticket requires human attention.",
      confidence: 0.7,
      autoExecuted: false
    };
  }
  
  // Default: Try to provide helpful response
  return {
    action: "respond",
    reasoning: "No automatic resolution rule matched. Providing general assistance response.",
    confidence: 0.6,
    autoExecuted: false,
    response: `Thank you for contacting us regarding your ${ticket.type} inquiry. A customer service representative will review your case and respond within 24 hours. Your ticket ID is ${ticket.id}.`
  };
}

/**
 * Generate mock CS tickets for demo
 */
export function generateMockTickets(): CSTicket[] {
  return [
    {
      id: "CS-001",
      userId: "user_123",
      userName: "Kim Minsu",
      type: "refund",
      subject: "Cartridge not working",
      description: "The glucose cartridge I received doesn't produce any readings. Error code E003 appears.",
      orderId: "ORD-9876",
      productId: "CTG-QC-ERROR-001",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      status: "open",
      priority: "medium"
    },
    {
      id: "CS-002",
      userId: "user_456",
      userName: "Park Jiyeon",
      type: "shipping",
      subject: "Where is my order?",
      description: "I ordered 5 days ago and haven't received anything yet.",
      orderId: "ORD-9877",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      status: "open",
      priority: "low"
    },
    {
      id: "CS-003",
      userId: "user_789",
      userName: "Lee Dongwook",
      type: "quality",
      subject: "Inconsistent readings",
      description: "The lactate readings are varying by ±50% between measurements. This seems abnormal.",
      productId: "CTG-LACTATE-045",
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      status: "open",
      priority: "high"
    },
    {
      id: "CS-004",
      userId: "user_321",
      userName: "Choi Eunji",
      type: "general",
      subject: "How to use hydrogel cartridge?",
      description: "I bought the solid-state hydrogel cartridge but the instructions are unclear.",
      createdAt: new Date(Date.now() - 21600000).toISOString(),
      status: "open",
      priority: "low"
    }
  ];
}

export function generateMockQCRecords(): QCRecord[] {
  return [
    { cartridgeId: "CTG-QC-ERROR-001", hasError: true, errorType: "Enzyme Degradation", errorDate: "2025-01-15" },
    { cartridgeId: "CTG-QC-ERROR-002", hasError: true, errorType: "Calibration Drift", errorDate: "2025-01-18" },
    { cartridgeId: "CTG-LACTATE-045", hasError: false },
    { cartridgeId: "CTG-GLUCOSE-123", hasError: false }
  ];
}

export function generateMockOrders(): { orderId: string; status: string; deliveryDate?: string }[] {
  return [
    { orderId: "ORD-9876", status: "delivered", deliveryDate: "2025-01-20" },
    { orderId: "ORD-9877", status: "in_transit" },
    { orderId: "ORD-9878", status: "processing" }
  ];
}






