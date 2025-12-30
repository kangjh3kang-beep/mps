"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Search,
  Filter,
  ShoppingCart,
  Sparkles,
  Grid3X3,
  List,
  SlidersHorizontal,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { 
  ProductCard, 
  CartSheet, 
  RecommendationWidget,
  CheckoutModal 
} from "@/components/mall";
import { 
  productsDB, 
  productCategories,
  Product,
  ProductCategory,
  Cart,
  HealthContext,
  getCartManager,
  recommendationEngine
} from "@/lib/mall";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ============================================
 * Mall Page Content
 * ============================================ */

function MallPageContent() {
  const router = useRouter();
  const { t, locale } = useI18n();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0, discount: 0, shipping: 0, total: 0 });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [minRating, setMinRating] = useState(0);

  // Mock health context for recommendations (in real app, this would come from UserContext)
  const [healthContext] = useState<HealthContext>({
    lactateLevel: 2.8,
    healthScore: 68,
    sleepScore: 55,
    stressLevel: 72,
    heartRate: 78
  });

  // Initialize cart from localStorage
  useEffect(() => {
    const cartManager = getCartManager();
    setCart(cartManager.getCart());
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    let products = productsDB;

    // Category filter
    if (selectedCategory !== "all") {
      products = products.filter(p => p.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.nameKo.includes(searchQuery) ||
        p.description.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.tags.some(t => t.includes(query))
      );
    }

    // Price filter
    products = products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Rating filter
    if (minRating > 0) {
      products = products.filter(p => p.rating >= minRating);
    }

    return products;
  }, [selectedCategory, searchQuery, priceRange, minRating]);

  // Featured products
  const featuredProducts = useMemo(() => {
    return productsDB.filter(p => p.featured);
  }, []);

  // Cart product IDs for checking if item is in cart
  const cartProductIds = useMemo(() => {
    return cart.items.map(item => item.product.id);
  }, [cart]);

  // Add to cart handler
  const handleAddToCart = useCallback((product: Product) => {
    const cartManager = getCartManager();
    const updatedCart = cartManager.addItem(product, 1);
    setCart(updatedCart);
  }, []);

  // Update quantity handler
  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    const cartManager = getCartManager();
    const updatedCart = cartManager.updateQuantity(productId, quantity);
    setCart(updatedCart);
  }, []);

  // Remove item handler
  const handleRemoveItem = useCallback((productId: string) => {
    const cartManager = getCartManager();
    const updatedCart = cartManager.removeItem(productId);
    setCart(updatedCart);
  }, []);

  // Checkout handler
  const handleCheckout = useCallback(() => {
    setIsCheckoutOpen(true);
  }, []);

  // Order complete handler
  const handleOrderComplete = useCallback((orderId: string) => {
    const cartManager = getCartManager();
    const clearedCart = cartManager.clearCart();
    setCart(clearedCart);
  }, []);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.push("/")}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                  🛒 {t("mall.title")}
                </h1>
                <p className="text-xs text-muted-foreground">{t("mall.subtitle")}</p>
              </div>
            </div>

            {/* Right: Search & Cart */}
            <div className="flex items-center gap-2">
              {/* Search (Desktop) */}
              <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("mall.searchPlaceholder")}
                  className="border-0 bg-transparent h-8 w-64 focus-visible:ring-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter Button */}
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>{t("mall.filters")}</SheetTitle>
                  </SheetHeader>
                  <div className="py-4 space-y-6">
                    {/* Price Range */}
                    <div>
                      <h4 className="font-medium mb-3">{t("mall.priceRange")}</h4>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                          className="w-20"
                        />
                        <span>-</span>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                          className="w-20"
                        />
                      </div>
                    </div>

                    {/* Rating */}
                    <div>
                      <h4 className="font-medium mb-3">{t("mall.minRating")}</h4>
                      <div className="flex gap-2">
                        {[0, 3, 4, 4.5].map((rating) => (
                          <Button
                            key={rating}
                            variant={minRating === rating ? "default" : "outline"}
                            size="sm"
                            onClick={() => setMinRating(rating)}
                          >
                            {rating === 0 ? t("mall.all") : (
                              <>
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                {rating}+
                              </>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <Button 
                      className="w-full"
                      onClick={() => setFilterOpen(false)}
                    >
                      {t("mall.applyFilters")}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Cart */}
              <CartSheet
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
              >
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-blue-600 text-[10px]"
                    >
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </CartSheet>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-3">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("mall.searchPlaceholder")}
                className="border-0 bg-transparent h-8 focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* AI Recommendations */}
        <RecommendationWidget
          healthContext={healthContext}
          onAddToCart={handleAddToCart}
          cartProductIds={cartProductIds}
        />

        {/* Category Tabs */}
        <Tabs 
          value={selectedCategory} 
          onValueChange={(v) => setSelectedCategory(v as ProductCategory | "all")}
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-white border h-auto p-1 flex-wrap">
              <TabsTrigger value="all" className="text-xs px-3 py-1.5">
                🏪 {t("mall.allProducts")}
              </TabsTrigger>
              {Object.entries(productCategories).map(([key, cat]) => (
                <TabsTrigger key={key} value={key} className="text-xs px-3 py-1.5">
                  {cat.icon} {locale === "ko" ? cat.nameKo : cat.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* View Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-white rounded-lg border p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className={cn(
            "grid gap-4",
            viewMode === "grid" 
              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-1"
          )}>
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>{t("mall.noProducts")}</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isInCart={cartProductIds.includes(product.id)}
                  onAddToCart={handleAddToCart}
                  compact={viewMode === "list"}
                />
              ))
            )}
          </div>
        </Tabs>

        {/* Featured Section */}
        {selectedCategory === "all" && !searchQuery && (
          <section className="pt-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {t("mall.featured")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isInCart={cartProductIds.includes(product.id)}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onOrderComplete={handleOrderComplete}
      />
    </div>
  );
}

/* ============================================
 * Exported Page
 * ============================================ */

export default function MallPage() {
  return (
    <I18nProvider>
      <MallPageContent />
    </I18nProvider>
  );
}






