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
    <section className="editorial-goals space-y-6">
      {/* Action buttons */}
      <div className="editorial-goals-actions">
        <button
          type="button"
          onClick={() => {
            setShowSessionComposer((v) => !v);
            if (!showSessionComposer) setShowGoalForm(false);
          }}
          className="editorial-goals-action primary"
        >
          {showSessionComposer ? (
            <Icon icon="lucide:x" className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Icon icon="lucide:gamepad-2" className="h-4 w-4" aria-hidden="true" />
          )}
          {t("newSession")}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowGoalForm((v) => !v);
            if (!showGoalForm) setShowSessionComposer(false);
          }}
          className="editorial-goals-action"
        >
          {showGoalForm ? (
            <Icon icon="lucide:x" className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Icon icon="lucide:target" className="h-4 w-4" aria-hidden="true" />
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
