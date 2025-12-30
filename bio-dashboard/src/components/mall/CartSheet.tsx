"use client";

import React from "react";
import { 
  X, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Trash2, 
  Stethoscope,
  ArrowRight,
  Package
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Cart, CartItem, formatPrice } from "@/lib/mall";
import { useI18n } from "@/lib/i18n";

interface CartSheetProps {
  cart: Cart;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  children?: React.ReactNode;
}

export function CartSheet({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  children
}: CartSheetProps) {
  const { t, locale } = useI18n();
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
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
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t("mall.cart.title")} ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Package className="h-16 w-16 mb-4 opacity-30" />
            <p>{t("mall.cart.empty")}</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {cart.items.map((item) => (
                  <CartItemCard
                    key={item.product.id}
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemove={onRemoveItem}
                    locale={locale}
                  />
                ))}
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            {/* Order Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("mall.cart.subtotal")}</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t("mall.cart.discount")}</span>
                  <span>-{formatPrice(cart.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("mall.cart.shipping")}</span>
                <span>{cart.shipping === 0 ? t("mall.cart.freeShipping") : formatPrice(cart.shipping)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>{t("mall.cart.total")}</span>
                <span className="text-blue-700">{formatPrice(cart.total)}</span>
              </div>
            </div>

            <SheetFooter className="mt-4">
              <Button 
                className="w-full h-12 text-base"
                onClick={onCheckout}
              >
                {t("mall.cart.checkout")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  locale: string;
}

function CartItemCard({ item, onUpdateQuantity, onRemove, locale }: CartItemCardProps) {
  const { t } = useI18n();
  
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-slate-50 border">
      {/* Product Image */}
      <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center text-3xl shrink-0">
        {item.product.image}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-medium text-sm line-clamp-2">
              {locale === "ko" ? item.product.nameKo : item.product.name}
            </h4>
            {item.isPrescribed && (
              <Badge className="mt-1 text-[10px] bg-blue-100 text-blue-700">
                <Stethoscope className="w-3 h-3 mr-0.5" />
                {t("mall.prescribedBy")} {item.doctorName}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-red-500"
            onClick={() => onRemove(item.product.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Quantity Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Price */}
          <span className="font-semibold text-blue-700">
            {formatPrice(item.product.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CartSheet;






