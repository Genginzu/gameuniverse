"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Icon } from "@iconify/react";
import useSWR from "swr";
import { SessionComposer } from "../sessions/SessionComposer";
import { PersonalGoals } from "../stats/PersonalGoals";
import { usePlayerSessions } from "@/hooks/usePlayerSessions";
import type { DashboardStatsResponse } from "@/types/dashboard-stats";
import type { CreateGamingSessionPayload } from "@/types/gaming-session";
import dynamic from "next/dynamic";

const SessionStats = dynamic(() => import("../stats/SessionStats").then((m) => m.SessionStats), {
  ssr: false,
});

interface GoalsTabProps {
  playerId: string;
  locale: string;
}

async function dashboardFetcher(url: string): Promise<DashboardStatsResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch_error");
  return res.json();
}

export function GoalsTab({ playerId, locale }: GoalsTabProps) {
  const t = useTranslations("players.sessions");
  const tGoals = useTranslations("playerStats.goals");
  const tLocale = useLocale();
  const sessionHook = usePlayerSessions(playerId, tLocale);
  const [showSessionComposer, setShowSessionComposer] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);

  const { data } = useSWR<DashboardStatsResponse>(
    `/api/players/${playerId}/stats/dashboard?locale=${locale}`,
    dashboardFetcher,
    { revalidateOnFocus: false }
  );

  const handleSessionCreated = async (payload: CreateGamingSessionPayload) => {
    await sessionHook.createSession(payload);
    setShowSessionComposer(false);
  };

  return (
    <section className="space-y-6">
      {/* Action buttons */}
      <div className="xs:flex-row xs:items-center flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            setShowSessionComposer((v) => !v);
            if (!showSessionComposer) setShowGoalForm(false);
          }}
          className="from-palette-secondary-500 to-palette-primary-500 shadow-palette-secondary-500/20 inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-br px-5 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:opacity-90"
        >
          {showSessionComposer ? (
            <Icon icon="lucide:x" className="h-4 w-4" />
          ) : (
            <Icon icon="lucide:gamepad-2" className="h-4 w-4" />
          )}
          {t("newSession")}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowGoalForm((v) => !v);
            if (!showGoalForm) setShowSessionComposer(false);
          }}
          className="from-palette-primary-500 shadow-palette-primary-500/20 inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-br to-blue-500 px-5 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:opacity-90"
        >
          {showGoalForm ? (
            <Icon icon="lucide:x" className="h-4 w-4" />
          ) : (
            <Icon icon="lucide:target" className="h-4 w-4" />
          )}
          {tGoals("create.title")}
        </button>
      </div>

      {/* Session composer */}
      {showSessionComposer && (
        <SessionComposer
          locale={locale}
          isCreating={sessionHook.isCreating}
          onSubmit={handleSessionCreated}
        />
      )}

      {/* Goals section */}
      <PersonalGoals
        goals={data?.goals ?? []}
        isOwnProfile
        playerId={playerId}
        showFormExternal={showGoalForm}
        onFormClosed={() => setShowGoalForm(false)}
      />

      {/* Session stats */}
      {data?.sessions && <SessionStats sessions={data.sessions} />}
    </section>
  );
}
