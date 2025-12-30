"use client";

import React, { useMemo } from "react";
import { Sparkles, ChevronRight, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  HealthContext, 
  ProductRecommendation, 
  recommendationEngine,
  generateMallRecommendationText,
  Product
} from "@/lib/mall";
import { ProductCard } from "./ProductCard";
import { useI18n } from "@/lib/i18n";

interface RecommendationWidgetProps {
  healthContext: HealthContext;
  onAddToCart?: (product: Product) => void;
  onViewAll?: () => void;
  cartProductIds?: string[];
  className?: string;
  compact?: boolean;
}

/**
 * AI-Powered Recommendation Widget
 * 
 * Displays personalized product recommendations based on user's health metrics
 */
export function RecommendationWidget({
  healthContext,
  onAddToCart,
  onViewAll,
  cartProductIds = [],
  className,
  compact = false
}: RecommendationWidgetProps) {
  const { t, locale } = useI18n();

  // Generate recommendations based on health context
  const recommendationData = useMemo(() => {
    return generateMallRecommendationText(healthContext, locale);
  }, [healthContext, locale]);

  // Don't show if no recommendations
  if (recommendationData.products.length === 0 && !compact) {
    return null;
  }

  if (compact) {
    return (
      <Card className={cn("border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-sm text-blue-800">
              {recommendationData.title}
            </h3>
          </div>

          {recommendationData.products.length > 0 ? (
            <div className="space-y-2">
              {recommendationData.products.slice(0, 2).map((rec) => (
                <ProductCard
                  key={rec.product.id}
                  product={rec.product}
                  compact
                  isInCart={cartProductIds.includes(rec.product.id)}
                  onAddToCart={onAddToCart}
                  showReason={locale === "ko" ? rec.reasonKo : rec.reason}
                />
              ))}
              
              {onViewAll && (
                <Button 
                  variant="ghost" 
                  className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                  onClick={onViewAll}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  {t("mall.viewAll")}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{recommendationData.description}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-blue-100", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-blue-800">{recommendationData.title}</span>
              <Badge variant="secondary" className="ml-2 text-[10px]">
                AI
              </Badge>
            </div>
          </CardTitle>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              {t("mall.viewAll")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {recommendationData.description}
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recommendationData.products.map((rec) => (
            <ProductCard
              key={rec.product.id}
              product={rec.product}
              isInCart={cartProductIds.includes(rec.product.id)}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Inline recommendation for AI Coach Chat
 */
interface ChatRecommendationProps {
  healthContext: HealthContext;
  onAddToCart?: (product: Product) => void;
  onViewMall?: () => void;
}

export function ChatRecommendation({
  healthContext,
  onAddToCart,
  onViewMall
}: ChatRecommendationProps) {
  const { t, locale } = useI18n();

  const recommendations = useMemo(() => {
    return recommendationEngine.generateRecommendations(healthContext, 2);
  }, [healthContext]);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-800">
          {t("mall.recommendedForYou")}
        </span>
      </div>

      <div className="space-y-2">
        {recommendations.map((rec) => (
          <div 
            key={rec.product.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-white/60"
          >
            <span className="text-xl">{rec.product.image}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {locale === "ko" ? rec.product.nameKo : rec.product.name}
              </p>
              <p className="text-xs text-amber-700">
                ${rec.product.price.toFixed(2)}
              </p>
            </div>
            <Button 
              size="sm" 
              variant="secondary"
              className="h-7 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800"
              onClick={() => onAddToCart?.(rec.product)}
            >
              + {t("mall.add")}
            </Button>
          </div>
        ))}
      </div>

      {onViewMall && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2 text-amber-700 hover:text-amber-800 hover:bg-amber-100"
          onClick={onViewMall}
        >
          {t("mall.visitMall")}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
}

export default RecommendationWidget;






