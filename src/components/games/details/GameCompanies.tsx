"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslations } from "next-intl";
import type { Database } from "@/lib/database.types";

type GameCompany = Database["public"]["Functions"]["get_game_companies"]["Returns"][0];

interface GameCompaniesProps {
  gameId: string;
  gameTitle?: string;
}

async function fetchCompanies(gameId: string): Promise<GameCompany[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_game_companies", {
    game_uuid: gameId,
  });
  if (error) throw error;
  return data ?? [];
}

export default function GameCompanies({ gameId, gameTitle }: GameCompaniesProps) {
  const t = useTranslations("game.companies");

  const { data: companies, error, isLoading } = useSWR(
    `game-companies-${gameId}`,
    () => fetchCompanies(gameId),
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error.message}</div>;
  }

  if (!companies || companies.length === 0) {
    return <div className="text-gray-500">{t("noCompanies")}</div>;
  }

  const groupedCompanies = companies.reduce(
    (acc, company) => {
      if (!acc[company.role]) {
        acc[company.role] = [];
      }
      acc[company.role].push(company);
      return acc;
    },
    {} as Record<string, GameCompany[]>
  );

  return (
    <div className="space-y-4">
      {gameTitle && (
        <h3 className="text-lg font-semibold">
          {t("title")} - {gameTitle}
        </h3>
      )}

      {Object.entries(groupedCompanies).map(([role, roleCompanies]) => (
        <div key={role} className="rounded-lg border p-4">
          <h4 className="mb-2 font-medium text-gray-700">{t(`roles.${role}`) || role}</h4>
          <div className="space-y-2">
            {roleCompanies.map((company) => (
              <div
                key={`${company.company_id}-${company.role}`}
                className={`flex items-center justify-between rounded p-2 ${
                  company.is_primary ? "border border-blue-200 bg-blue-50" : "bg-gray-50"
                }`}
              >
                <div>
                  <span className="font-medium">{company.company_name}</span>
                  {company.is_primary && (
                    <span className="ml-2 rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                      {t("primary")}
                    </span>
                  )}
                </div>
                <a
                  href={`/companies/${company.company_slug}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {t("viewProfile")} →
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GameDevelopers({ gameId }: { gameId: string }) {
  const t = useTranslations("game.companies");

  const { data: developers, isLoading } = useSWR(
    `game-developers-${gameId}`,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_game_companies", {
        game_uuid: gameId,
        company_role: "developer",
      });
      if (error) throw error;
      return data ?? [];
    },
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-2 font-medium">{t("developedBy")}:</h4>
      <div className="flex flex-wrap gap-2">
        {(developers ?? []).map((dev) => (
          <span
            key={dev.company_id}
            className={`rounded-full px-3 py-1 text-sm ${
              dev.is_primary ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"
            }`}
          >
            {dev.company_name}
          </span>
        ))}
      </div>
    </div>
  );
}
