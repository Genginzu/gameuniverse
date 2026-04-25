"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";

const STATUS_ICONS: Record<string, string> = {
  requested: "lucide:clock", confirmed: "lucide:check-circle", in_progress: "lucide:play-circle",
  completed: "lucide:check-check", cancelled: "lucide:x-circle", disputed: "lucide:alert-triangle",
};
const STATUS_COLORS: Record<string, string> = {
  requested: "text-yellow-500", confirmed: "text-palette-secondary-400", in_progress: "text-blue-500",
  completed: "text-green-500", cancelled: "text-red-400", disputed: "text-orange-500",
};

interface Session {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  paymentAmount: number | null; paymentStatus: string | null; gameTitle: string; gameCoverImage: string | null;
  otherParty: { username: string; avatarUrl: string | null };
  conversationId: string | null;
}

export function CoachingSessionsContent() {
  const t = useTranslations("coaching.sessions");
  const { user, loading } = useAuth();
  const [role, setRole] = useState<"student" | "coach">("student");
  const [paymentMessage, setPaymentMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data, isLoading, mutate } = useSWR<{ sessions: Session[] }>(
    user ? `/api/coaching/sessions?role=${role}` : null, fetcher
  );

  // Verify payment on return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const sessionId = params.get("session_id");

    if (payment === "success" && sessionId) {
      fetch("/api/coaching/stripe/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutSessionId: sessionId }),
      }).then(async (res) => {
        if (res.ok) {
          setPaymentMessage({ type: "success", text: t("paymentSuccess") });
          await mutate();
        } else {
          const data = await res.json();
          setPaymentMessage({ type: "error", text: data.error || t("paymentError") });
        }
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
      });
    } else if (payment === "cancelled") {
      setPaymentMessage({ type: "error", text: t("paymentCancelled") });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleAction = async (sessionId: string, action: string) => {
    await fetch(`/api/coaching/sessions/${sessionId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await mutate();
  };

  const handlePay = async (sessionId: string) => {
    const res = await fetch("/api/coaching/stripe/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="space-y-6 p-4 md:space-y-8 md:p-6 lg:p-8">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">{t("title")}</h1>

      {paymentMessage && (
        <div className={`flex items-center gap-2 rounded-xl p-3 text-sm font-medium ${paymentMessage.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-400"}`}>
          <Icon icon={paymentMessage.type === "success" ? "lucide:check-circle" : "lucide:alert-circle"} className="size-4" />
          {paymentMessage.text}
          <button onClick={() => setPaymentMessage(null)} className="ml-auto"><Icon icon="lucide:x" className="size-4" /></button>
        </div>
      )}

      <div className="flex gap-2">
        {(["student", "coach"] as const).map((r) => (
          <button key={r} onClick={() => setRole(r)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${role === r ? "bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"}`}>
            {t(`role.${r}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />)}</div>
      ) : data?.sessions.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl p-8 text-center">
          <Icon icon="lucide:calendar" className="mb-3 size-10 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.sessions.map((s) => (
            <div key={s.id} className="glass-card flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                {s.gameCoverImage && <img src={s.gameCoverImage} alt="" className="h-14 w-10 shrink-0 rounded-lg object-cover" />}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{s.gameTitle}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {role === "student" ? t("with") : t("student")}: {s.otherParty.username}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(s.scheduledAt).toLocaleString()} · {s.durationMinutes}min</p>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-between gap-3 sm:justify-end">
                <span className={`flex items-center gap-1 text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                  <Icon icon={STATUS_ICONS[s.status]} className="size-4" /> {t(`status.${s.status}`)}
                  {role === "student" && s.status === "completed" && s.paymentAmount && (
                    <span className="ml-1 text-gray-500">· {s.paymentAmount}€</span>
                  )}
                </span>
                <div className="flex gap-1.5">
                  {role === "coach" && s.status === "requested" && (
                    <>
                      <button onClick={() => handleAction(s.id, "confirm")} className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/20">{t("actions.confirm")}</button>
                      <button onClick={() => handleAction(s.id, "decline")} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20">{t("actions.decline")}</button>
                    </>
                  )}
                  {role === "coach" && s.status === "confirmed" && s.paymentStatus === "paid" && (
                    <button onClick={() => handleAction(s.id, "start")} className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-500 hover:bg-blue-500/20">{t("actions.start")}</button>
                  )}
                  {role === "coach" && s.status === "confirmed" && s.paymentStatus !== "paid" && (
                    <span className="flex items-center gap-1 rounded-lg bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-500">
                      <Icon icon="lucide:clock" className="size-3.5" />{t("awaitingPayment")}
                    </span>
                  )}
                  {role === "student" && s.status === "confirmed" && s.paymentStatus !== "paid" && (
                    <button onClick={() => handlePay(s.id)} className="rounded-lg bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">{t("actions.pay")}</button>
                  )}
                  {s.status === "confirmed" && s.paymentStatus === "paid" && (
                    <span className="flex items-center gap-1 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500">
                      <Icon icon="lucide:check-circle" className="size-3.5" />{t("paymentDone")}
                    </span>
                  )}
                  {role === "coach" && s.status === "in_progress" && (
                    <button onClick={() => handleAction(s.id, "complete")} className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/20">{t("actions.complete")}</button>
                  )}
                  {["requested", "confirmed"].includes(s.status) && (
                    <button onClick={() => handleAction(s.id, "cancel")} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20">{t("actions.cancel")}</button>
                  )}
                  {s.conversationId && (
                    <Link href="/discussions" className="rounded-lg bg-palette-secondary-500/10 px-3 py-1.5 text-xs font-medium text-palette-secondary-400 hover:bg-palette-secondary-500/20">
                      <Icon icon="lucide:message-circle" className="inline size-3.5" /> {t("actions.chat")}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
