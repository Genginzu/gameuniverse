"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

interface AdminGrantFormProps {
  playerId: string;
}

export function AdminGrantForm({ playerId }: AdminGrantFormProps) {
  const t = useTranslations("coins.admin");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/coins/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, amount, description: description.trim() }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: t("grantSuccess") });
        setAmount(0);
        setDescription("");
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || t("grantError") });
      }
    } catch {
      setMessage({ type: "error", text: t("grantError") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("grantAmount")}
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
            className="glass-input w-full rounded-xl px-4 py-2 text-base"
            placeholder="100 ou -50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("grantDescription")}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="glass-input w-full rounded-xl px-4 py-2 text-base"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !amount || !description.trim()}
        className="flex items-center gap-2 rounded-xl bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 px-6 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
      >
        <Icon icon="mdi:check" className="size-4" />
        {t("grantSubmit")}
      </button>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-500" : "text-red-500"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
