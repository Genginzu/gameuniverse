/**
 * Queue-based Supabase client mock for API route tests.
 *
 * Each `from(table)` call consumes the next result queued for that table, so
 * tests describe "what the database answers" in call order instead of
 * hand-building nested chain mocks. Every chained method call is recorded so
 * tests can assert on the queries the route actually issued.
 */

export interface QueuedResult {
  data?: unknown;
  error?: { code?: string; message?: string } | null;
  count?: number | null;
}

export interface RecordedCall {
  table: string;
  method: string;
  args: unknown[];
}

const EMPTY_RESULT: Required<QueuedResult> = { data: null, error: null, count: null };

export function createSupabaseQueryMock() {
  const queues = new Map<string, QueuedResult[]>();
  const calls: RecordedCall[] = [];

  function enqueue(table: string, ...results: QueuedResult[]) {
    const queue = queues.get(table) ?? [];
    queue.push(...results);
    queues.set(table, queue);
  }

  function buildChain(table: string): unknown {
    const result = { ...EMPTY_RESULT, ...queues.get(table)?.shift() };
    const chain: unknown = new Proxy(
      {},
      {
        get(_target, prop) {
          // Awaiting the chain at any point resolves the queued result
          if (prop === "then") {
            return (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
              Promise.resolve(result).then(resolve, reject);
          }
          return (...args: unknown[]) => {
            calls.push({ table, method: String(prop), args });
            return chain;
          };
        },
      }
    );
    return chain;
  }

  function callsFor(table: string, method: string): unknown[][] {
    return calls.filter((c) => c.table === table && c.method === method).map((c) => c.args);
  }

  function reset() {
    queues.clear();
    calls.length = 0;
  }

  const client = { from: (table: string) => buildChain(table) };

  return { client, enqueue, calls, callsFor, reset };
}

export type SupabaseQueryMock = ReturnType<typeof createSupabaseQueryMock>;
