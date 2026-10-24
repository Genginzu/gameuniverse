import type { FieldValues } from "react-hook-form";
import type { AdminFormConfig } from "@/types/admin-resource";

export function defineAdminForm<TData extends FieldValues>(
  config: AdminFormConfig<TData>
): AdminFormConfig<TData> {
  return config;
}

export function resolveAdminPath(
  path: string | ((pathParams: Record<string, string>) => string),
  pathParams: Record<string, string>
): string {
  return typeof path === "function" ? path(pathParams) : path;
}

export async function submitAdminEntity(
  url: string,
  method: "POST" | "PUT",
  payload: unknown,
  fallbackError: string
): Promise<unknown> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || fallbackError);
  return body;
}
