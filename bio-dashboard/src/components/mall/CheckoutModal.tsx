"use client";

import React, { useState } from "react";
import { 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Package,
  MapPin,
  ChevronRight,
  Loader2,
  Shield
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Cart, CartItem, formatPrice } from "@/lib/mall";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart;
  onOrderComplete: (orderId: string) => void;
}

type CheckoutStep = "shipping" | "payment" | "review" | "complete";

export function CheckoutModal({
  isOpen,
  onClose,
  cart,
  onOrderComplete
}: CheckoutModalProps) {
  const { t, locale } = useI18n();
  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form state
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    address: "",
    city: "",
    phone: ""
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    expiry: "",
    cvv: ""
  });

  const [orderId, setOrderId] = useState<string | null>(null);

  const handleNext = () => {
    if (step === "shipping") setStep("payment");
    else if (step === "payment") setStep("review");
    else if (step === "review") handlePlaceOrder();
  };

  const handleBack = () => {
    if (step === "payment") setStep("shipping");
    else if (step === "review") setStep("payment");
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newOrderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    setOrderId(newOrderId);
    setStep("complete");
    setIsProcessing(false);
    
    onOrderComplete(newOrderId);
  };

  const resetAndClose = () => {
    setStep("shipping");
    setOrderId(null);
    onClose();
  };

  const steps = [
    { id: "shipping", label: t("mall.checkout.shipping"), icon: Truck },
    { id: "payment", label: t("mall.checkout.payment"), icon: CreditCard },
    { id: "review", label: t("mall.checkout.review"), icon: Package },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t("mall.checkout.title")}
          </DialogTitle>
          <DialogDescription>
            {t("mall.checkout.description")}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        {step !== "complete" && (
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  i <= currentStepIndex 
                    ? "bg-blue-100 text-blue-700" 
                    : "bg-gray-100 text-gray-400"
                )}>
                  <s.icon className="w-4 h-4" />
                  <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Step Content */}
        <div className="min-h-[300px]">
          {step === "shipping" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-700 mb-4">
                <MapPin className="w-5 h-5" />
                <h3 className="font-semibold">{t("mall.checkout.shippingAddress")}</h3>
              </div>
              
              <Input
                placeholder={t("mall.checkout.fullName")}
                value={shippingInfo.name}
                onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
              />
              <Input
                placeholder={t("mall.checkout.address")}
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder={t("mall.checkout.city")}
                  value={shippingInfo.city}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                />
                <Input
                  placeholder={t("mall.checkout.phone")}
                  value={shippingInfo.phone}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                />
              </div>

              <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {cart.shipping === 0 ? t("mall.checkout.freeShipping") : t("mall.checkout.standardShipping")}
                  </p>
                  <p className="text-xs text-green-600">
                    {t("mall.checkout.estimatedDelivery", { days: "2-3" })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-700 mb-4">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-semibold">{t("mall.checkout.paymentMethod")}</h3>
              </div>
              
              <Input
                placeholder="Card Number"
                value={paymentInfo.cardNumber}
                onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="MM/YY"
                  value={paymentInfo.expiry}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, expiry: e.target.value })}
                />
                <Input
                  placeholder="CVV"
                  type="password"
                  value={paymentInfo.cvv}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, cvv: e.target.value })}
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-600" />
                <p className="text-xs text-muted-foreground">
                  {t("mall.checkout.securePayment")}
                </p>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-700 mb-4">
                <Package className="w-5 h-5" />
                <h3 className="font-semibold">{t("mall.checkout.orderSummary")}</h3>
              </div>

              {/* Order Items */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-2 p-2 rounded bg-slate-50">
                    <span className="text-lg">{item.product.image}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {locale === "ko" ? item.product.nameKo : item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("mall.checkout.qty")}: {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{t("mall.cart.subtotal")}</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("mall.cart.shipping")}</span>
                  <span>{cart.shipping === 0 ? t("mall.cart.freeShipping") : formatPrice(cart.shipping)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>{t("mall.cart.total")}</span>
                  <span className="text-blue-700">{formatPrice(cart.total)}</span>
                </div>
              </div>

              {/* Shipping Summary */}
              <div className="p-3 rounded-lg bg-slate-50 text-sm">
                <p className="font-medium">{t("mall.checkout.shipTo")}:</p>
                <p className="text-muted-foreground">
                  {shippingInfo.name}, {shippingInfo.address}, {shippingInfo.city}
                </p>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-2">
                {t("mall.checkout.orderConfirmed")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t("mall.checkout.orderNumber")}: <span className="font-mono font-bold">{orderId}</span>
              </p>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-left">
                <p className="text-sm text-blue-800">
                  📦 {t("mall.checkout.confirmationEmail")}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {t("mall.checkout.trackingAvailable")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          {step !== "complete" ? (
            <>
              <Button
                variant="outline"
                onClick={step === "shipping" ? resetAndClose : handleBack}
              >
                {step === "shipping" ? t("mall.checkout.cancel") : t("mall.checkout.back")}
              </Button>
              <Button
                onClick={handleNext}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("mall.checkout.processing")}
                  </>
                ) : step === "review" ? (
                  t("mall.checkout.placeOrder")
                ) : (
                  t("mall.checkout.continue")
                )}
              </Button>
            </>
          ) : (
            <Button className="w-full" onClick={resetAndClose}>
              {t("mall.checkout.done")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CheckoutModal;






