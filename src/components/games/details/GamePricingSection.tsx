"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { GameColors } from "@/lib/utils/game-utils";

interface GamePricing {
  store: {
    name: string;
  };
  platform: string;
  price: number;
  currency: string;
}

interface GamePricingSectionProps {
  pricing: GamePricing[];
  colors: GameColors;
  formatPrice: (price: number, currency: string) => string;
}

export function GamePricingSection({ pricing, colors, formatPrice }: GamePricingSectionProps) {
  const tDetails = useTranslations("gameDetails");

  if (pricing.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="space-y-3">
        {pricing.slice(0, 3).map((price, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/80 p-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div>
                <div className="text-sm font-medium text-white">{price.store.name}</div>
                <div className="text-xs text-slate-400">{price.platform}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: colors.accent }}>
                {formatPrice(price.price, price.currency)}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                {tDetails("view")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
