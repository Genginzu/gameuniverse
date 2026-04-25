import type {
  CreateGamingSessionPayload,
  GamingSession,
  GamingSessionsResponse,
} from "@/types/gaming-session";

/** Client service for player gaming sessions (issue #2). */
export class GameSessionsService {
  static async fetchSessions(
    playerId: string,
    page?: number,
    locale?: string
  ): Promise<GamingSessionsResponse> {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (locale) params.set("locale", locale);

    const query = params.toString();
    const url = `/api/players/${playerId}/sessions${query ? `?${query}` : ""}`;

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to fetch sessions (${response.status})`);
    }
    return response.json();
  }

  static async createSession(
    playerId: string,
    payload: CreateGamingSessionPayload,
    locale?: string
  ): Promise<GamingSession> {
    const url = locale
      ? `/api/players/${playerId}/sessions?locale=${encodeURIComponent(locale)}`
      : `/api/players/${playerId}/sessions`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to create session (${response.status})`);
    }
    return response.json();
  }

  static async deleteSession(playerId: string, sessionId: string): Promise<void> {
    const response = await fetch(`/api/players/${playerId}/sessions/${sessionId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to delete session (${response.status})`);
    }
  }
}
