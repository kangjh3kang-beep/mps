"use client";

import React from "react";
import { 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  ChevronRight,
  Calendar,
  AlertCircle,
  Package,
  ShoppingBag
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface CareServicesWidgetProps {
  hasLowHealthScore: boolean;
  upcomingAppointments: number;
  activePrescriptions: number;
  cartridgeLibraryCount?: number;
  cartItemCount?: number;
  onAnalyzeSmellTaste?: () => void;
  onBookDoctor?: () => void;
  onViewPrescriptions?: () => void;
  onOpenStore?: () => void;
  onOpenMall?: () => void;
  className?: string;
}

/**
 * Care Services Widget
 * 
 * 헬스케어 서비스 바로가기 위젯
 * - Analyze Smell/Taste
 * - Book Doctor
 * - My Prescriptions
 */
export function CareServicesWidget({
  hasLowHealthScore,
  upcomingAppointments,
  activePrescriptions,
  cartridgeLibraryCount = 0,
  cartItemCount = 0,
  onAnalyzeSmellTaste,
  onBookDoctor,
  onViewPrescriptions,
  onOpenStore,
  onOpenMall,
  className
}: CareServicesWidgetProps) {
  const { t } = useI18n();
  
  return (
    <Card className={cn("border shadow-md", className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-sm">{t("services.title")}</h3>
          <span className="text-xs text-muted-foreground">{t("services.subtitle")}</span>
        </div>

        {/* Service Buttons */}
        <div className="space-y-2">
          {/* Analyze Smell/Taste - Electronic Nose */}
          <ServiceButton
            icon={<FlaskConical className="w-5 h-5 text-purple-500" />}
            title={t("services.analyzeSmell")}
            subtitle={t("services.analyzeSubtitle")}
            onClick={onAnalyzeSmellTaste}
            gradient="from-purple-50 to-fuchsia-50"
            borderColor="border-purple-100"
          />

          {/* Book Doctor - Telemedicine */}
          <ServiceButton
            icon={<Stethoscope className="w-5 h-5 text-sky-500" />}
            title={t("services.bookDoctor")}
            subtitle={t("services.bookSubtitle")}
            onClick={onBookDoctor}
            gradient="from-sky-50 to-cyan-50"
            borderColor="border-sky-100"
            badge={upcomingAppointments > 0 ? (
              <Badge variant="secondary" className="text-[10px] bg-sky-100 text-sky-700">
                <Calendar className="w-3 h-3 mr-0.5" />
                {upcomingAppointments}
              </Badge>
            ) : undefined}
            highlight={hasLowHealthScore}
            highlightMessage={t("services.lowHealthWarning")}
          />

          {/* My Prescriptions */}
          <ServiceButton
            icon={<Pill className="w-5 h-5 text-emerald-500" />}
            title={t("services.prescriptions")}
            subtitle={t("services.prescriptionSubtitle")}
            onClick={onViewPrescriptions}
            gradient="from-emerald-50 to-green-50"
            borderColor="border-emerald-100"
            badge={activePrescriptions > 0 ? (
              <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700">
                {activePrescriptions}건
              </Badge>
            ) : undefined}
          />

          {/* Cartridge Store */}
          <ServiceButton
            icon={<Package className="w-5 h-5 text-amber-500" />}
            title="카트리지 스토어"
            subtitle="센서 앱 스토어"
            onClick={onOpenStore}
            gradient="from-amber-50 to-orange-50"
            borderColor="border-amber-100"
            badge={cartridgeLibraryCount > 0 ? (
              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">
                {cartridgeLibraryCount}개 보유
              </Badge>
            ) : undefined}
          />

          {/* Health Mall */}
          <ServiceButton
            icon={<ShoppingBag className="w-5 h-5 text-rose-500" />}
            title={t("mall.title")}
            subtitle={t("mall.subtitle")}
            onClick={onOpenMall}
            gradient="from-rose-50 to-pink-50"
            borderColor="border-rose-100"
            badge={cartItemCount > 0 ? (
              <Badge variant="secondary" className="text-[10px] bg-rose-100 text-rose-700">
                🛒 {cartItemCount}
              </Badge>
            ) : undefined}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface ServiceButtonProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  gradient: string;
  borderColor: string;
  badge?: React.ReactNode;
  highlight?: boolean;
  highlightMessage?: string;
}

function ServiceButton({
  icon,
  title,
  subtitle,
  onClick,
  gradient,
  borderColor,
  badge,
  highlight,
  highlightMessage
}: ServiceButtonProps) {
  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all",
        "hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
        `bg-gradient-to-r ${gradient} ${borderColor}`,
        highlight && "ring-2 ring-rose-300 ring-offset-2 animate-pulse"
      )}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          {badge}
          {highlight && (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          )}
        </div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
        {highlight && highlightMessage && (
          <div className="text-[10px] text-rose-600 mt-0.5">{highlightMessage}</div>
        )}
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  );
}

export default CareServicesWidget;

