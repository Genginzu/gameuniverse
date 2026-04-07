import type { BatchProgressEvent, BatchSummary } from "@/types/admin-translations";

/**
 * Parses an NDJSON stream from the batch translation API
 */
export async function parseNdjsonStream(
  response: Response,
  onProgress: (event: BatchProgressEvent) => void,
  signal?: AbortSignal
): Promise<BatchSummary> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let succeeded = 0;
  let failed = 0;
  let total = 0;

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const event: BatchProgressEvent = JSON.parse(trimmed);
        total++;
        if (event.status === "success") succeeded++;
        else failed++;
        onProgress(event);
      }
    }

    if (buffer.trim()) {
      const event: BatchProgressEvent = JSON.parse(buffer.trim());
      total++;
      if (event.status === "success") succeeded++;
      else failed++;
      onProgress(event);
    }
  } catch (err) {
    if (!signal?.aborted) throw err;
  }

  return { total, succeeded, failed };
}
