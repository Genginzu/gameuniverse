/**
 * Sends a JSON request and resolves with the parsed body.
 * Rejects with the server's `error` message on any non-2xx status, so callers
 * (and optimistic mutations) can treat 4xx/5xx and network failures alike.
 */
export async function jsonRequest(url: string, method: string, body?: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "An error occurred");
  return data;
}
