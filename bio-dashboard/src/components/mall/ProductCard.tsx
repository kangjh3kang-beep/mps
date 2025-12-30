"use client";

import React from "react";
import { Star, ShoppingCart, Check, Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Product, 
  formatPrice, 
  getDiscountPercentage 
} from "@/lib/mall";
import { useI18n } from "@/lib/i18n";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  isInCart?: boolean;
  isPrescribed?: boolean;
  compact?: boolean;
  showReason?: string;
}

export function ProductCard({
  product,
  onAddToCart,
  isInCart = false,
  isPrescribed = false,
  compact = false,
  showReason
}: ProductCardProps) {
  const { t, locale } = useI18n();

  const handleAddToCart = () => {
    if (onAddToCart && !product.isPrescriptionRequired) {
      onAddToCart(product);
    }
  };

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border bg-white transition-all",
          "hover:shadow-md hover:border-blue-200"
        )}
      >
        {/* Product Image */}
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center text-2xl">
          {product.image}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">
            {locale === "ko" ? product.nameKo : product.name}
          </h4>
          {showReason && (
            <p className="text-xs text-blue-600 truncate">{showReason}</p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-semibold text-sm text-blue-700">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart */}
        <Button
          size="sm"
          variant={isInCart ? "secondary" : "default"}
          className={cn(
            "h-8 w-8 p-0",
            isInCart && "bg-green-100 text-green-700"
          )}
          onClick={handleAddToCart}
          disabled={product.isPrescriptionRequired && !isPrescribed}
        >
          {isInCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all group">
      {/* Header with badges */}
      <div className="relative">
        {/* Product Image Area */}
        <div className="h-32 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">
          {product.image}
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.featured && (
            <Badge className="bg-amber-500 text-white text-[10px]">
              ⭐ {t("mall.featured")}
            </Badge>
          )}
          {product.originalPrice && (
            <Badge className="bg-red-500 text-white text-[10px]">
              -{getDiscountPercentage(product.originalPrice, product.price)}%
            </Badge>
          )}
          {isPrescribed && (
            <Badge className="bg-blue-600 text-white text-[10px]">
              <Stethoscope className="w-3 h-3 mr-0.5" />
              {t("mall.prescribed")}
            </Badge>
          )}
        </div>

        {/* Category Badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 text-[10px] bg-white/80"
        >
          {product.category === "medical_food" && "🏥"}
          {product.category === "supplements" && "💊"}
          {product.category === "nutrition" && "🥗"}
          {product.category === "devices" && "⌚"}
          {product.category === "lifestyle" && "🌿"}
        </Badge>
      </div>

      <CardContent className="p-3 space-y-2">
        {/* Brand */}
        <p className="text-[10px] text-muted-foreground">{product.brand}</p>

        {/* Name */}
        <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
          {locale === "ko" ? product.nameKo : product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3 h-3",
                  i < Math.floor(product.rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-200"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {product.rating} ({product.reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {product.tags.slice(0, 3).map((tag) => (
            <Badge 
              key={tag} 
              variant="outline" 
              className="text-[10px] px-1.5 py-0"
            >
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="font-bold text-lg text-blue-700">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through ml-1">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          
          {product.isPrescriptionRequired && !isPrescribed ? (
            <Badge variant="outline" className="text-xs">
              <Stethoscope className="w-3 h-3 mr-1" />
              {t("mall.prescriptionRequired")}
            </Badge>
          ) : (
            <Button
              size="sm"
              variant={isInCart ? "secondary" : "default"}
              className={cn(
                "h-8",
                isInCart && "bg-green-100 text-green-700 hover:bg-green-200"
              )}
              onClick={handleAddToCart}
            >
              {isInCart ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {t("mall.inCart")}
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  {t("mall.addToCart")}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProductCard;






