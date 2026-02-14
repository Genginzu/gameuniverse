"use client";

import { ExternalLink } from "lucide-react";
import { GameColors } from "@/lib/utils/game-utils";
import Image from "next/image";

interface GamePricing {
  store: {
    name: string;
    logoUrl?: string;
  };
  platform: string;
  price: number;
  currency: string;
  storeUrl?: string;
}

interface GamePricingSectionProps {
  pricing: GamePricing[];
  colors: GameColors;
  formatPrice: (price: number, currency: string) => string;
}

export function GamePricingSection({ pricing, colors, formatPrice }: GamePricingSectionProps) {
  if (pricing.length === 0) {
    return null;
  }

  const sortedPricing = [...pricing].sort((a, b) => a.price - b.price);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        {sortedPricing.slice(0, 5).map((price, index) => {
          const Wrapper = price.storeUrl ? "a" : "div";
          const wrapperProps = price.storeUrl
            ? { href: price.storeUrl, target: "_blank", rel: "noopener noreferrer" }
            : {};

          return (
            <Wrapper
              key={index}
              {...wrapperProps}
              className="group flex items-center gap-2 rounded-md border px-3 py-1.5 backdrop-blur-sm transition-colors"
              style={{
                backgroundColor: `${colors.backgroundColor}e6`,
                borderColor: `${colors.backgroundColor}80`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  `${colors.backgroundColor}f2`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  `${colors.backgroundColor}e6`;
              }}
            >
              {price.store.logoUrl ? (
                <Image
                  src={price.store.logoUrl}
                  alt={price.store.name}
                  width={16}
                  height={16}
                  className="h-4 w-4 object-contain"
                />
              ) : (
                <span className="text-[11px]" style={{ color: colors.labelColor }}>
                  {price.store.name}
                </span>
              )}
              <span className="text-sm font-semibold" style={{ color: colors.accent }}>
                {formatPrice(price.price, price.currency)}
              </span>
              {price.storeUrl && (
                <ExternalLink
                  className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: colors.labelColor }}
                />
              )}
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
