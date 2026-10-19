"use client";

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AdminStoreAffiliateData,
  AdminStoreAffiliateInput,
} from "@/lib/validations/admin-store-affiliate";
import { AFFILIATE_NETWORKS, type AffiliateNetwork } from "@/types/affiliate";
import { StoreAffiliateFieldError } from "./StoreAffiliateFieldError";

interface StoreAffiliateNetworkSelectProps {
  control: Control<AdminStoreAffiliateInput, unknown, AdminStoreAffiliateData>;
}

export function StoreAffiliateNetworkSelect({ control }: StoreAffiliateNetworkSelectProps) {
  const t = useTranslations("admin.stores");

  return (
    <FormField
      control={control}
      name="affiliateNetwork"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.network")}</FormLabel>
          <Select
            value={field.value ?? undefined}
            onValueChange={(value) => field.onChange(value as AffiliateNetwork)}
          >
            <FormControl>
              <SelectTrigger className="min-h-[44px] text-base md:text-sm">
                <SelectValue placeholder={t("fields.networkPlaceholder")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {AFFILIATE_NETWORKS.map((network) => (
                <SelectItem key={network} value={network}>
                  {t(`networks.${network}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <StoreAffiliateFieldError />
        </FormItem>
      )}
    />
  );
}
