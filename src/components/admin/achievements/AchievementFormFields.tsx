"use client";

import { useTranslations } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import type { AchievementFormData } from "@/lib/validations/admin-achievement-form";
import {
  AchievementTranslationsSection,
  AchievementNumericSection,
} from "./AchievementFormSections";

const CATEGORIES = ["library", "playtime", "reviews", "social", "collections"] as const;
const TIERS = ["bronze", "silver", "gold"] as const;

interface AchievementFormFieldsProps {
  form: UseFormReturn<AchievementFormData>;
  mode: "create" | "edit";
}

export function AchievementFormFields({ form, mode }: AchievementFormFieldsProps) {
  const t = useTranslations("adminAchievements.form");
  const tCat = useTranslations("adminAchievements.categories");
  const tTier = useTranslations("adminAchievements.tiers");

  return (
    <div className="space-y-6">
      {/* Key & identifiers section */}
      <div className="rounded-2xl border border-gray-200/60 bg-white/40 p-6 shadow-xs dark:border-gray-700/40 dark:bg-gray-800/60">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("key")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("keyPlaceholder")}
                    {...field}
                    disabled={mode === "edit"}
                    className={mode === "edit" ? "bg-gray-50 dark:bg-gray-900/50" : ""}
                    maxLength={100}
                  />
                </FormControl>
                <FormDescription>{t("keyDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("icon")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("iconPlaceholder")} {...field} maxLength={50} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("category")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("categoryPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {tCat(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("tier")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("tierPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIERS.map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {tTier(tier)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <AchievementNumericSection form={form} t={t} />
      <AchievementTranslationsSection form={form} t={t} />
    </div>
  );
}
