"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { createApiError } from "@/lib/services/apiError";
import type {
  AccountDeletionRequestPayload,
  AccountDeletionStatus,
} from "@/types/account-deletion";

export const ACCOUNT_DELETION_KEY = "/api/account/deletion";

async function sendDeletionRequest(
  method: "POST" | "DELETE",
  payload?: AccountDeletionRequestPayload
): Promise<AccountDeletionStatus> {
  const response = await fetch(ACCOUNT_DELETION_KEY, {
    method,
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!response.ok) throw await createApiError(response, "Account deletion request failed");
  return response.json();
}

/**
 * Signed-in user's account deletion status, plus request / cancel actions.
 * Guests get a 401 and are treated as not pending.
 */
export function useAccountDeletion(enabled = true) {
  const { data, isLoading, mutate } = useSWR<AccountDeletionStatus>(
    enabled ? ACCOUNT_DELETION_KEY : null,
    fetcher,
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  const requestDeletion = async (payload: AccountDeletionRequestPayload) => {
    const status = await sendDeletionRequest("POST", payload);
    await mutate(status, { revalidate: false });
    return status;
  };

  const cancelDeletion = async () => {
    const status = await sendDeletionRequest("DELETE");
    await mutate(status, { revalidate: false });
    return status;
  };

  return {
    pending: data?.pending ?? false,
    scheduledFor: data?.scheduledFor ?? null,
    isLoading,
    requestDeletion,
    cancelDeletion,
  };
}
