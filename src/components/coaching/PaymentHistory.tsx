"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";

interface Payment {
  id: string;
  date: string;
  durationMinutes: number;
  amount: number;
  platformFee: number;
  coachPayout: number;
  studentUsername: string;
}

interface PaymentsResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}

export function PaymentHistory() {
  const t = useTranslations("coaching.settings.payments");
  const [page, setPage] = useState(1);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const limit = 10;

  const { data, isLoading } = useSWR<PaymentsResponse>(
    `/api/coaching/payments?page=${page}&limit=${limit}`, fetcher
  );

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const totalEarnings = data?.payments.reduce((sum, p) => sum + (p.coachPayout ?? 0), 0) ?? 0;

  const handlePayout = async () => {
    setPayoutLoading(true);
    setPayoutMessage(null);
    try {
      const res = await fetch("/api/coaching/payments/payout", { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        setPayoutMessage({ type: "success", text: t("payoutSuccess", { amount: result.amount, currency: result.currency.toUpperCase() }) });
      } else {
        setPayoutMessage({ type: "error", text: result.error === "No funds available" ? t("noFunds") : t("payoutError") });
      }
    } catch {
      setPayoutMessage({ type: "error", text: t("payoutError") });
    } finally {
      setPayoutLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary + Payout */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("totalEarnings")}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalEarnings.toFixed(2)}€</p>
          <p className="text-xs text-gray-400">{data?.total ?? 0} {t("paidSessions")}</p>
        </div>
        <button onClick={handlePayout} disabled={payoutLoading} className="w-full rounded-lg bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto">
          <Icon icon="lucide:banknote" className="mr-1.5 inline size-4" />
          {payoutLoading ? t("payoutLoading") : t("requestPayout")}
        </button>
      </div>

      {payoutMessage && (
        <div className={`flex items-center gap-2 rounded-xl p-3 text-sm ${payoutMessage.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-400"}`}>
          <Icon icon={payoutMessage.type === "success" ? "lucide:check-circle" : "lucide:alert-circle"} className="size-4" />
          {payoutMessage.text}
        </div>
      )}

      {/* Payment list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />)}
        </div>
      ) : !data?.payments.length ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{t("noPayments")}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-white/20 dark:border-slate-700/50 md:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{t("date")}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{t("student")}</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">{t("amount")}</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">{t("fee")}</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">{t("net")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {data.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/40 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{p.studentUsername}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{p.amount?.toFixed(2)}€</td>
                    <td className="px-4 py-3 text-right text-red-400">-{p.platformFee?.toFixed(2)}€</td>
                    <td className="px-4 py-3 text-right font-medium text-green-500">{p.coachPayout?.toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {data.payments.map((p) => (
              <div key={p.id} className="glass-card flex items-center justify-between rounded-xl p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{p.studentUsername}</p>
                  <p className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-500">{p.coachPayout?.toFixed(2)}€</p>
                  <p className="text-xs text-gray-400">{p.amount?.toFixed(2)}€ - {p.platformFee?.toFixed(2)}€</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800">
                <Icon icon="lucide:chevron-left" className="size-4" />
              </button>
              <span className="text-sm text-gray-500">{page} / {totalPages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800">
                <Icon icon="lucide:chevron-right" className="size-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
