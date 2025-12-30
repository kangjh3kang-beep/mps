"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Star,
  Download,
  ChevronRight,
  Check,
  Bluetooth,
  RefreshCw,
  ShoppingCart,
  Filter,
  TrendingUp,
  Sparkles,
  Package,
  Shield,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  cartridgeEcosystem, 
  CARTRIDGE_CATEGORIES,
  type DigitalCartridge,
  type CartridgeCategory
} from "@/lib/cartridge-ecosystem";
import { cn } from "@/lib/utils";

/* ============================================
 * Constants
 * ============================================
 */
const USER_ID = "demo-user";
const DEVICE_ID = "MPS-R2-001";

/* ============================================
 * Price Formatter
 * ============================================
 */
function formatPrice(price: number, type: DigitalCartridge["pricing"]["type"]): string {
  if (type === "free") return "Free";
  if (type === "subscription") return `$${(price / 100).toFixed(2)}/mo`;
  return `$${(price / 100).toFixed(2)}`;
}

/* ============================================
 * Rating Stars Component
 * ============================================
 */
function RatingStars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "w-3 h-3",
              star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-300"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {rating.toFixed(1)} ({count})
      </span>
    </div>
  );
}

/* ============================================
 * Category Card Component
 * ============================================
 */
function CategoryCard({ 
  category, 
  count, 
  onClick 
}: { 
  category: typeof CARTRIDGE_CATEGORIES[0]; 
  count: number;
  onClick: () => void;
}) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] overflow-hidden group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center text-2xl">
            {category.icon}
          </div>
          <div className="flex-1">
            <div className="font-medium">{category.name}</div>
            <div className="text-xs text-muted-foreground">{count} cartridges</div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================
 * Cartridge Card Component
 * ============================================
 */
function CartridgeCard({ 
  cartridge, 
  isOwned,
  onBuy,
  onSync,
  isSyncing
}: { 
  cartridge: DigitalCartridge;
  isOwned: boolean;
  onBuy: () => void;
  onSync: () => void;
  isSyncing: boolean;
}) {
  const library = cartridgeEcosystem.getUserLibrary(USER_ID);
  const libraryItem = library.cartridges.find(c => c.cartridgeId === cartridge.id);
  const isSynced = libraryItem?.syncedToDevice || false;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image Header */}
      <div className="h-32 bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 flex items-center justify-center relative">
        <div className="text-4xl">{CARTRIDGE_CATEGORIES.find(c => c.id === cartridge.category)?.icon || "📦"}</div>
        {cartridge.developer.verified && (
          <Badge className="absolute top-2 right-2 bg-emerald-500 text-xs gap-1">
            <Shield className="w-3 h-3" />
            Verified
          </Badge>
        )}
        {cartridge.pricing.type === "free" && (
          <Badge className="absolute top-2 left-2 bg-sky-500 text-xs">
            FREE
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        {/* Title & Developer */}
        <div>
          <h3 className="font-semibold line-clamp-1">{cartridge.marketing.title}</h3>
          <p className="text-xs text-muted-foreground">{cartridge.developer.company}</p>
        </div>

        {/* Rating & Downloads */}
        <div className="flex items-center justify-between">
          <RatingStars rating={cartridge.stats.rating} count={cartridge.stats.reviewCount} />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Download className="w-3 h-3" />
            {cartridge.stats.downloads.toLocaleString()}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {cartridge.marketing.shortDescription}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {cartridge.marketing.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="font-semibold text-sky-600">
            {formatPrice(cartridge.pricing.price, cartridge.pricing.type)}
          </div>
          
          {isOwned ? (
            isSynced ? (
              <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                <Check className="w-3 h-3" />
                Synced
              </Badge>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onSync}
                disabled={isSyncing}
                className="gap-1"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Bluetooth className="w-3 h-3" />
                )}
                Sync
              </Button>
            )
          ) : (
            <Button size="sm" onClick={onBuy} className="gap-1">
              <ShoppingCart className="w-3 h-3" />
              {cartridge.pricing.type === "free" ? "Get" : "Buy"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================
 * BLE Sync Modal
 * ============================================
 */
function SyncModal({ 
  isOpen, 
  onClose, 
  result 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  result: {
    success: boolean;
    message: string;
    firmwareUpdate?: { version: string; changes: string[] };
  } | null;
}) {
  if (!isOpen || !result) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4">
        <Card className="shadow-2xl">
          <CardHeader className={cn(
            "text-white",
            result.success 
              ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
              : "bg-gradient-to-r from-rose-500 to-orange-500"
          )}>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <Bluetooth className="w-5 h-5" />
                  Sync Complete!
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Sync Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <p className="text-sm">{result.message}</p>
            
            {result.firmwareUpdate && (
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <div className="text-xs font-medium flex items-center gap-2">
                  <Package className="w-4 h-4 text-sky-500" />
                  Firmware Updated to v{result.firmwareUpdate.version}
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {result.firmwareUpdate.changes.map((change, i) => (
                    <li key={i}>• {change}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/* ============================================
 * Cartridge Store Page
 * ============================================
 */
export default function CartridgeStorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CartridgeCategory | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    firmwareUpdate?: { version: string; changes: string[] };
  } | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [, forceUpdate] = useState(0);

  // Get cartridges based on filters
  const cartridges = useMemo(() => {
    if (searchQuery) {
      return cartridgeEcosystem.searchCartridges(searchQuery);
    }
    if (selectedCategory) {
      return cartridgeEcosystem.getCartridgesByCategory(selectedCategory);
    }
    return cartridgeEcosystem.getAllCartridges();
  }, [searchQuery, selectedCategory]);

  const featuredCartridges = useMemo(() => 
    cartridgeEcosystem.getFeaturedCartridges(), 
    []
  );

  const newCartridges = useMemo(() => 
    cartridgeEcosystem.getNewCartridges(), 
    []
  );

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CartridgeCategory, number> = {
      medical: 0,
      environmental: 0,
      food_safety: 0,
      industrial: 0
    };
    cartridgeEcosystem.getAllCartridges().forEach(c => counts[c.category]++);
    return counts;
  }, []);

  // Handle buy
  const handleBuy = useCallback((cartridgeId: string) => {
    cartridgeEcosystem.addToLibrary(USER_ID, cartridgeId);
    forceUpdate(n => n + 1);
  }, []);

  // Handle sync
  const handleSync = useCallback(async (cartridgeId: string) => {
    setSyncingId(cartridgeId);
    
    try {
      const result = await cartridgeEcosystem.syncToDevice(USER_ID, cartridgeId, DEVICE_ID);
      setSyncResult(result);
      setShowSyncModal(true);
    } finally {
      setSyncingId(null);
      forceUpdate(n => n + 1);
    }
  }, []);

  // User library
  const userLibrary = cartridgeEcosystem.getUserLibrary(USER_ID);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-cyan-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Package className="w-6 h-6 text-sky-500" />
                  Cartridge Store
                </h1>
                <p className="text-sm text-muted-foreground">
                  Discover sensors for every need
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/developer">
                <Button variant="outline" size="sm" className="gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Developer
                </Button>
              </Link>
              <Badge variant="secondary" className="gap-1">
                <ShoppingCart className="w-3 h-3" />
                {userLibrary.cartridges.length} in Library
              </Badge>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedCategory(null);
              }}
              placeholder="Search cartridges, biomarkers, or tags..."
              className="pl-10"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Category Filter (when searching or in category) */}
        {(searchQuery || selectedCategory) && (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {CARTRIDGE_CATEGORIES.find(c => c.id === selectedCategory)?.icon}
                {CARTRIDGE_CATEGORIES.find(c => c.id === selectedCategory)?.name}
              </Badge>
            )}
            {searchQuery && (
              <span className="text-sm text-muted-foreground">
                {cartridges.length} results for "{searchQuery}"
              </span>
            )}
          </div>
        )}

        {/* Home View (no search, no category) */}
        {!searchQuery && !selectedCategory && (
          <>
            {/* Categories */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-sky-500" />
                Categories
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CARTRIDGE_CATEGORIES.map(cat => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    count={categoryCounts[cat.id]}
                    onClick={() => setSelectedCategory(cat.id)}
                  />
                ))}
              </div>
            </section>

            {/* Featured */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-500" />
                Featured Cartridges
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredCartridges.map(cart => (
                  <CartridgeCard
                    key={cart.id}
                    cartridge={cart}
                    isOwned={cartridgeEcosystem.isInLibrary(USER_ID, cart.id)}
                    onBuy={() => handleBuy(cart.id)}
                    onSync={() => handleSync(cart.id)}
                    isSyncing={syncingId === cart.id}
                  />
                ))}
              </div>
            </section>

            {/* New Arrivals */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-500" />
                New Arrivals
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {newCartridges.map(cart => (
                  <CartridgeCard
                    key={cart.id}
                    cartridge={cart}
                    isOwned={cartridgeEcosystem.isInLibrary(USER_ID, cart.id)}
                    onBuy={() => handleBuy(cart.id)}
                    onSync={() => handleSync(cart.id)}
                    isSyncing={syncingId === cart.id}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Search/Category Results */}
        {(searchQuery || selectedCategory) && (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cartridges.map(cart => (
                <CartridgeCard
                  key={cart.id}
                  cartridge={cart}
                  isOwned={cartridgeEcosystem.isInLibrary(USER_ID, cart.id)}
                  onBuy={() => handleBuy(cart.id)}
                  onSync={() => handleSync(cart.id)}
                  isSyncing={syncingId === cart.id}
                />
              ))}
            </div>

            {cartridges.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">No cartridges found</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Try a different search term or category
                </p>
              </div>
            )}
          </section>
        )}

        {/* My Library Section */}
        {userLibrary.cartridges.length > 0 && !searchQuery && !selectedCategory && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-sky-500" />
              My Library ({userLibrary.cartridges.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {userLibrary.cartridges.map(item => {
                const cart = cartridgeEcosystem.getCartridgeById(item.cartridgeId);
                if (!cart) return null;
                return (
                  <CartridgeCard
                    key={cart.id}
                    cartridge={cart}
                    isOwned={true}
                    onBuy={() => {}}
                    onSync={() => handleSync(cart.id)}
                    isSyncing={syncingId === cart.id}
                  />
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Sync Modal */}
      <SyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        result={syncResult}
      />
    </div>
  );
}






