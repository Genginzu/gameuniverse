"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import type { CoinRewardConfig } from "@/types/coins";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function RewardConfigTable() {
  const t = useTranslations("coins.admin");
  const tReward = useTranslations("coins.reward");
  const { data, mutate } = useSWR<{ config: CoinRewardConfig[] }>(
    "/api/admin/coins/config",
    fetcher
  );
  const [saving, setSaving] = useState<string | null>(null);

  const updateConfig = async (activityType: string, field: string, value: unknown) => {
    setSaving(activityType);
    try {
      await fetch("/api/admin/coins/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityType, [field]: value }),
      });
      await mutate();
    } finally {
      setSaving(null);
    }
  };

  if (!data?.config) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs text-slate-500 uppercase dark:text-slate-400">
            <th className="px-3 py-2">{t("activityType")}</th>
            <th className="px-3 py-2">{t("amount")}</th>
            <th className="px-3 py-2">{t("cooldown")}</th>
            <th className="px-3 py-2">{t("dailyCap")}</th>
            <th className="px-3 py-2">{t("enabled")}</th>
          </tr>
        </thead>
        <tbody>
          {data.config.map((cfg) => (
            <tr key={cfg.activityType} className="border-b border-white/5">
              <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">
                {tReward(cfg.activityType)}
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  defaultValue={cfg.amount}
                  className="glass-input w-20 rounded px-2 py-1 text-sm"
                  onBlur={(e) =>
                    updateConfig(cfg.activityType, "amount", parseInt(e.target.value, 10))
                  }
                  disabled={saving === cfg.activityType}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  defaultValue={cfg.cooldownSeconds ?? ""}
                  placeholder="—"
                  className="glass-input w-20 rounded px-2 py-1 text-sm"
                  onBlur={(e) =>
                    updateConfig(
                      cfg.activityType,
                      "cooldownSeconds",
                      e.target.value ? parseInt(e.target.value, 10) : null
                    )
                  }
                  disabled={saving === cfg.activityType}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  defaultValue={cfg.dailyCap ?? ""}
                  placeholder="—"
                  className="glass-input w-20 rounded px-2 py-1 text-sm"
                  onBlur={(e) =>
                    updateConfig(
                      cfg.activityType,
                      "dailyCap",
                      e.target.value ? parseInt(e.target.value, 10) : null
                    )
                  }
                  disabled={saving === cfg.activityType}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={cfg.enabled}
                  onChange={(e) => updateConfig(cfg.activityType, "enabled", e.target.checked)}
                  className="size-4 rounded"
                  disabled={saving === cfg.activityType}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
