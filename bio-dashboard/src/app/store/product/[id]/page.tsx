'use client';

/**
 * Product Detail Page
 * Dynamic route for individual product viewing
 */

import React from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  Package,
  Check,
  Minus,
  Plus,
} from 'lucide-react';

// Mock product data (in production, fetch from API)
const mockProducts: Record<string, {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  images: string[];
  category: string;
  inStock: boolean;
  features: string[];
}> = {
  'cartridge-glucose': {
    id: 'cartridge-glucose',
    name: '혈당 측정 카트리지 (30개입)',
    description: '정밀 바이오센서 기반 혈당 측정 카트리지입니다. 비침습적 측정으로 편리하게 혈당을 모니터링하세요.',
    price: 89000,
    originalPrice: 120000,
    rating: 4.8,
    reviews: 1247,
    images: ['/products/glucose-cartridge.jpg'],
    category: '카트리지',
    inStock: true,
    features: [
      '비침습적 측정 기술',
      '정확도 99.2% (FDA 승인 기준)',
      '결과 확인 30초',
      '의료기기 품질 인증',
      '30회 사용 가능',
    ],
  },
  'cartridge-lactate': {
    id: 'cartridge-lactate',
    name: '젖산 측정 카트리지 (20개입)',
    description: '운동 성과와 회복 상태를 추적하는 젖산 측정 카트리지입니다.',
    price: 75000,
    rating: 4.6,
    reviews: 532,
    images: ['/products/lactate-cartridge.jpg'],
    category: '카트리지',
    inStock: true,
    features: [
      '운동 중 실시간 측정',
      '피로도 분석 AI 연동',
      '20회 사용 가능',
    ],
  },
  'reader-pro': {
    id: 'reader-pro',
    name: 'MPS 리더기 Pro',
    description: '만파식 바이오센서 리더기 최신 모델입니다. 더 빠르고 정확한 측정을 경험하세요.',
    price: 299000,
    originalPrice: 350000,
    rating: 4.9,
    reviews: 2891,
    images: ['/products/reader-pro.jpg'],
    category: '디바이스',
    inStock: true,
    features: [
      'Bluetooth 5.0 연결',
      '배터리 수명 30일',
      '방수 등급 IPX7',
      '고급 알루미늄 바디',
      '2년 무상 보증',
    ],
  },
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  
  const [quantity, setQuantity] = React.useState(1);
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  
  // Get product data
  const product = mockProducts[productId];
  
  // Handle invalid product ID
  if (!product) {
    notFound();
  }

  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/store/products"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="aspect-square bg-muted rounded-2xl flex items-center justify-center"
          >
            <Package className="w-32 h-32 text-muted-foreground/30" />
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-sm text-primary mb-2">{product.category}</div>
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{product.rating}</span>
              </div>
              <span className="text-muted-foreground">
                ({product.reviews.toLocaleString()}개 리뷰)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold">
                ₩{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    ₩{product.originalPrice.toLocaleString()}
                  </span>
                  <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-medium rounded">
                    {discount}% 할인
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground mb-6">
              {product.description}
            </p>

            {/* Features */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">주요 특징</h3>
              <ul className="space-y-2">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="font-medium">수량</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-6">
              {product.inStock ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-green-600">재고 있음</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm text-red-600">품절</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={!product.inStock}
              >
                <ShoppingCart className="w-5 h-5" />
                장바구니 담기
              </button>
              <button
                className="flex-1 py-4 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50"
                disabled={!product.inStock}
              >
                바로 구매
              </button>
            </div>

            {/* Benefits */}
            <div className="mt-8 pt-8 border-t border-border grid grid-cols-3 gap-4">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">무료 배송</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">1년 보증</p>
              </div>
              <div className="text-center">
                <Package className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">안전 포장</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}


