/** Un snapshot de prix enregistré dans l'historique */
export interface PriceSnapshot {
  id: string;
  game_id: string;
  store_id: string;
  store_name: string;
  store_logo_url: string | null;
  price: number;
  currency: string;
  platform: string;
  recorded_at: string;
}

/** Statistiques agrégées de l'historique de prix */
export interface PriceHistoryStats {
  min_price: number;
  max_price: number;
  avg_price: number;
  currency: string;
  total_snapshots: number;
}

/** Périodes prédéfinies pour le filtre */
export type PriceHistoryPeriod = "1m" | "3m" | "6m" | "1y" | "all";

/** Filtres pour la requête d'historique */
export interface PriceHistoryFilters {
  period: PriceHistoryPeriod;
  store?: string;
  platform?: string;
}

/** Réponse de l'API d'historique de prix */
export interface PriceHistoryResponse {
  history: PriceSnapshot[];
  stats: PriceHistoryStats;
}

/** Données formatées pour le graphique (un point par date) */
export interface PriceChartDataPoint {
  date: string;
  [storeName: string]: number | string;
}
