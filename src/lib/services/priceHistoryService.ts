import type {
  PriceSnapshot,
  PriceHistoryStats,
  PriceHistoryFilters,
  PriceHistoryPeriod,
  PriceHistoryResponse,
  PriceChartDataPoint,
} from "@/types/price-history";

/**
 * Indicateurs de prix calculés à partir du prix courant et des statistiques historiques.
 */
export interface PriceIndicators {
  /** true si le prix courant est égal au prix minimum historique */
  isLowestPrice: boolean;
  /** true si le prix courant est strictement inférieur au prix moyen historique */
  isBelowAverage: boolean;
}

/**
 * Plage de dates calculée pour une période prédéfinie.
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Récupère l'historique de prix d'un jeu via l'API route.
 *
 * @param gameSlug - Le slug du jeu
 * @param filters - Filtres optionnels (période, magasin, plateforme)
 * @returns Les snapshots d'historique et les statistiques agrégées
 */
export async function fetchPriceHistory(
  gameSlug: string,
  filters: PriceHistoryFilters
): Promise<PriceHistoryResponse> {
  const params = new URLSearchParams();
  params.set("period", filters.period);

  if (filters.store) {
    params.set("store", filters.store);
  }
  if (filters.platform) {
    params.set("platform", filters.platform);
  }

  const response = await fetch(
    `/api/games/${encodeURIComponent(gameSlug)}/price-history?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch price history: ${response.status}`);
  }

  return response.json() as Promise<PriceHistoryResponse>;
}

/**
 * Transforme un tableau de PriceSnapshot en PriceChartDataPoint[] groupés par date.
 * Chaque point contient la date et un prix par magasin présent à cette date.
 *
 * @param snapshots - Les snapshots bruts triés par date croissante
 * @returns Les données formatées pour le graphique Recharts
 */
export function formatChartData(snapshots: PriceSnapshot[]): PriceChartDataPoint[] {
  if (snapshots.length === 0) {
    return [];
  }

  // Grouper les snapshots par date (YYYY-MM-DD)
  const groupedByDate = new Map<string, Map<string, number>>();

  for (const snapshot of snapshots) {
    const date = snapshot.recorded_at.slice(0, 10);
    if (!groupedByDate.has(date)) {
      groupedByDate.set(date, new Map());
    }
    // Si plusieurs snapshots pour le même magasin à la même date, garder le dernier
    groupedByDate.get(date)!.set(snapshot.store_name, snapshot.price);
  }

  // Convertir en PriceChartDataPoint[] triés par date croissante
  const sortedDates = [...groupedByDate.keys()].sort();
  const chartData: PriceChartDataPoint[] = [];

  for (const date of sortedDates) {
    const storesPrices = groupedByDate.get(date)!;
    const point: PriceChartDataPoint = { date };
    for (const [storeName, price] of storesPrices) {
      point[storeName] = price;
    }
    chartData.push(point);
  }

  return chartData;
}

/**
 * Détermine les indicateurs de prix à partir du prix courant et des statistiques historiques.
 * - isLowestPrice : true si le prix courant est égal au prix minimum historique
 * - isBelowAverage : true si le prix courant est strictement inférieur au prix moyen
 *
 * @param currentPrice - Le prix courant du jeu
 * @param stats - Les statistiques historiques (min, max, avg)
 * @returns Les indicateurs calculés
 */
export function computePriceIndicators(
  currentPrice: number,
  stats: PriceHistoryStats
): PriceIndicators {
  return {
    isLowestPrice: currentPrice === stats.min_price,
    isBelowAverage: currentPrice < stats.avg_price,
  };
}

/**
 * Calcule les dates de début et de fin pour une période prédéfinie.
 * La date de fin est toujours la date courante.
 * Pour "all", la date de début est fixée au 1er janvier 2000.
 *
 * @param period - La période prédéfinie (1m, 3m, 6m, 1y, all)
 * @returns La plage de dates correspondante
 */
export function getDateRangeForPeriod(period: PriceHistoryPeriod): DateRange {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "1m":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "3m":
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "6m":
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "1y":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case "all":
      startDate.setFullYear(2000, 0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return { startDate, endDate };
}
