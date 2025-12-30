"use client";

import React, { useState, useMemo } from "react";
import {
  MapPin,
  Star,
  Clock,
  Phone,
  Truck,
  CheckCircle2,
  ArrowRight,
  Navigation
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  searchPharmacies, 
  type Pharmacy,
  type Prescription
} from "@/lib/prescription";

interface PharmacySelectorProps {
  prescription: Prescription;
  onSelectPharmacy: (pharmacy: Pharmacy) => void;
  onCancel?: () => void;
}

type SortOption = "distance" | "rating";

/**
 * Pharmacy Selector Component
 * 
 * 약국 선택 컴포넌트
 * - 거리순/평점순 정렬
 * - 영업 상태 표시
 * - 배달 가능 여부
 */
export function PharmacySelector({ 
  prescription, 
  onSelectPharmacy,
  onCancel 
}: PharmacySelectorProps) {
  const [sortBy, setSortBy] = useState<SortOption>("distance");
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);

  const pharmacies = useMemo(() => {
    return searchPharmacies(sortBy);
  }, [sortBy]);

  const handleConfirm = () => {
    if (selectedPharmacy) {
      onSelectPharmacy(selectedPharmacy);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">약국 선택</CardTitle>
            <CardDescription>
              처방전을 수령할 약국을 선택해주세요
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Prescription Summary */}
        <div className="bg-muted/50 p-3 rounded-lg text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">처방전 번호</span>
            <span className="font-mono">{prescription.id}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-muted-foreground">약품 수</span>
            <span>{prescription.medications.length}종</span>
          </div>
        </div>

        {/* Sort Options */}
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="distance" className="text-xs">
              <Navigation className="w-3 h-3 mr-1" />
              거리순
            </TabsTrigger>
            <TabsTrigger value="rating" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              평점순
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Pharmacy List */}
        <div className="space-y-2 max-h-80 overflow-auto">
          {pharmacies.map(pharmacy => (
            <PharmacyCard
              key={pharmacy.id}
              pharmacy={pharmacy}
              isSelected={selectedPharmacy?.id === pharmacy.id}
              onSelect={() => setSelectedPharmacy(pharmacy)}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onCancel && (
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button 
            className="flex-1" 
            onClick={handleConfirm}
            disabled={!selectedPharmacy}
          >
            처방전 전송
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {selectedPharmacy && (
          <div className="text-xs text-center text-muted-foreground">
            {selectedPharmacy.name}에 처방전이 전송됩니다
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Pharmacy Card Component
 */
function PharmacyCard({ 
  pharmacy, 
  isSelected, 
  onSelect 
}: { 
  pharmacy: Pharmacy; 
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`p-3 border rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? "border-primary bg-primary/5 ring-1 ring-primary" 
          : "hover:border-primary/50"
      } ${!pharmacy.isOpen ? "opacity-60" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{pharmacy.name}</span>
            {isSelected && (
              <CheckCircle2 className="w-4 h-4 text-primary" />
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {pharmacy.distance}km
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              {pharmacy.rating} ({pharmacy.reviewCount})
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground mt-1">
            {pharmacy.address}
          </div>
        </div>
        
        <div className="text-right space-y-1">
          <Badge 
            variant={pharmacy.isOpen ? "default" : "secondary"}
            className="text-xs"
          >
            {pharmacy.isOpen ? "영업 중" : "영업 종료"}
          </Badge>
          <div className="flex justify-end gap-1">
            {pharmacy.hasDelivery && (
              <Badge variant="outline" className="text-xs">
                <Truck className="w-3 h-3 mr-1" />
                배달
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3 h-3" />
          {pharmacy.hours}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Phone className="w-3 h-3" />
          {pharmacy.phone}
        </div>
      </div>
    </div>
  );
}

export default PharmacySelector;






