"use client";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FaTimes } from "react-icons/fa";
import type { GameFormTabProps, AdminStore, AdminCurrency } from "@/types/admin-games";

interface PricingTabProps extends GameFormTabProps {
  stores: AdminStore[];
  currencies: AdminCurrency[];
  platforms: string[];
}

export function GameFormPricingTab({ form, t, stores, currencies, platforms }: PricingTabProps) {
  const watchedPrices = form.watch("prices");

  const addPrice = () => {
    const current = form.getValues("prices");
    form.setValue("prices", [
      ...current,
      {
        store_id: stores[0]?.id ?? "",
        price: 0,
        currency: "EUR",
        platform: "PC",
        store_url: "",
        is_available: true,
      },
    ]);
  };

  const removePrice = (idx: number) => {
    const current = form.getValues("prices");
    form.setValue(
      "prices",
      current.filter((_, i) => i !== idx),
      { shouldValidate: true }
    );
  };

  const storeName = (storeId: string) => stores.find((s) => s.id === storeId)?.name ?? storeId;

  return (
    <div className="space-y-4">
      {watchedPrices.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">{t("noPrices")}</p>
      ) : (
        <div className="space-y-3">
          {watchedPrices.map((price, idx) => (
            <div
              key={idx}
              className="relative rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <button
                type="button"
                onClick={() => removePrice(idx)}
                className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                aria-label={t("removePrice")}
              >
                <FaTimes className="h-3 w-3" />
              </button>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Store */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t("store")}
                  </label>
                  <select
                    value={price.store_id}
                    onChange={(e) => form.setValue(`prices.${idx}.store_id`, e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t("priceAmount")}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={price.price}
                    onChange={(e) =>
                      form.setValue(`prices.${idx}.price`, parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t("currency")}
                  </label>
                  <select
                    value={price.currency}
                    onChange={(e) => form.setValue(`prices.${idx}.currency`, e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.symbol} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platform */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t("platform")}
                  </label>
                  <select
                    value={price.platform}
                    onChange={(e) => form.setValue(`prices.${idx}.platform`, e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {platforms.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Store URL */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t("storeUrl")}
                  </label>
                  <Input
                    type="url"
                    placeholder="https://store.example.com/game"
                    value={price.store_url ?? ""}
                    onChange={(e) => form.setValue(`prices.${idx}.store_url`, e.target.value)}
                  />
                </div>

                {/* Available */}
                <div className="flex items-end gap-2 pb-2">
                  <Checkbox
                    id={`price-available-${idx}`}
                    checked={price.is_available}
                    onCheckedChange={(checked) =>
                      form.setValue(`prices.${idx}.is_available`, !!checked)
                    }
                  />
                  <label
                    htmlFor={`price-available-${idx}`}
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    {t("available")}
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addPrice}
        disabled={stores.length === 0}
        className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300"
      >
        + {t("addPrice")}
      </button>
    </div>
  );
}
