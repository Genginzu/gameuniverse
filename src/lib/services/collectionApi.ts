import type {
  CreateCollectionInput,
  UpdateCollectionInput,
  AddCollectionItemInput,
} from "@/types/collection";
import { jsonRequest } from "@/lib/utils/json-request";

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

export async function apiUpdateItemNote(
  playerId: string,
  slug: string,
  gameId: string,
  note: string | null
) {
  return jsonRequest(`${itemsUrl(playerId, slug)}/${gameId}`, "PATCH", { note });
}
