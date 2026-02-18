import type {
  CreateCollectionInput,
  UpdateCollectionInput,
  AddCollectionItemInput,
} from "@/types/collection";

const BASE = "/api/players";

function collectionsUrl(playerId: string) {
  return `${BASE}/${playerId}/collections`;
}

function collectionUrl(playerId: string, slug: string) {
  return `${collectionsUrl(playerId)}/${slug}`;
}

function itemsUrl(playerId: string, slug: string) {
  return `${collectionUrl(playerId, slug)}/items`;
}

async function handleResponse(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "An error occurred");
  return data;
}

async function jsonRequest(url: string, method: string, body?: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
  return handleResponse(res);
}

export async function apiCreateCollection(playerId: string, input: CreateCollectionInput) {
  return jsonRequest(collectionsUrl(playerId), "POST", input);
}

export async function apiUpdateCollection(
  playerId: string,
  slug: string,
  input: UpdateCollectionInput
) {
  return jsonRequest(collectionUrl(playerId, slug), "PATCH", input);
}

export async function apiDeleteCollection(playerId: string, slug: string) {
  return jsonRequest(collectionUrl(playerId, slug), "DELETE");
}

export async function apiToggleVisibility(playerId: string, slug: string, isPublic: boolean) {
  return jsonRequest(collectionUrl(playerId, slug), "PATCH", { isPublic });
}

export async function apiAddItem(playerId: string, slug: string, input: AddCollectionItemInput) {
  return jsonRequest(itemsUrl(playerId, slug), "POST", input);
}

export async function apiRemoveItem(playerId: string, slug: string, gameId: string) {
  return jsonRequest(`${itemsUrl(playerId, slug)}/${gameId}`, "DELETE");
}

export async function apiReorderItems(
  playerId: string,
  slug: string,
  items: Array<{ gameId: string; position: number }>
) {
  return jsonRequest(`${itemsUrl(playerId, slug)}/reorder`, "PATCH", { items });
}
