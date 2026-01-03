"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type GameCompany = Database["public"]["Functions"]["get_game_companies"]["Returns"][0];

interface GameCompaniesProps {
  gameId: string;
  gameTitle?: string;
}

export default function GameCompanies({ gameId, gameTitle }: GameCompaniesProps) {
  const [companies, setCompanies] = useState<GameCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGameCompanies() {
      try {
        const supabase = createClient();

        // Utiliser la fonction get_game_companies pour récupérer toutes les entreprises
        const { data, error } = await supabase.rpc("get_game_companies", {
          game_uuid: gameId,
        });

        if (error) {
          throw error;
        }

        setCompanies(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    }

    fetchGameCompanies();
  }, [gameId]);

  if (loading) {
    return <div className="animate-pulse">Chargement des entreprises...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erreur: {error}</div>;
  }

  if (companies.length === 0) {
    return <div className="text-gray-500">Aucune entreprise trouvée</div>;
  }

  // Grouper les entreprises par rôle
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

  // Traduction des rôles
  const roleTranslations: Record<string, string> = {
    developer: "Développeur",
    publisher: "Éditeur",
    "co-developer": "Co-développeur",
    "co-publisher": "Co-éditeur",
  };

  return (
    <div className="space-y-4">
      {gameTitle && <h3 className="text-lg font-semibold">Entreprises - {gameTitle}</h3>}

      {Object.entries(groupedCompanies).map(([role, roleCompanies]) => (
        <div key={role} className="rounded-lg border p-4">
          <h4 className="mb-2 font-medium text-gray-700">{roleTranslations[role] || role}</h4>

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
                      Principal
                    </span>
                  )}
                </div>

                <a
                  href={`/companies/${company.company_slug}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Voir profil →
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Exemple d'utilisation avec des développeurs spécifiques
export function GameDevelopers({ gameId, gameTitle }: GameCompaniesProps) {
  const [developers, setDevelopers] = useState<GameCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDevelopers() {
      try {
        const supabase = createClient();

        // Récupérer seulement les développeurs
        const { data, error } = await supabase.rpc("get_game_companies", {
          game_uuid: gameId,
          company_role: "developer",
        });

        if (error) throw error;
        setDevelopers(data || []);
      } catch (err) {
        console.error("Erreur lors du chargement des développeurs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDevelopers();
  }, [gameId]);

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h4 className="mb-2 font-medium">Développé par:</h4>
      <div className="flex flex-wrap gap-2">
        {developers.map((dev) => (
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
