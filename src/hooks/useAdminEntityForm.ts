"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, type DefaultValues, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSWRConfig } from "swr";

import { routing } from "@/i18n/routing";
import { resolveAdminPath, submitAdminEntity } from "@/lib/admin-resource/defineAdminForm";
import type { AdminFormConfig, AdminFormMode } from "@/types/admin-resource";
import type { SupportedLanguage } from "@/types/admin-languages";

interface UseAdminEntityFormOptions<TData> {
  initialData?: TData;
  id?: string;
  pathParams?: Record<string, string>;
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = routing.locales.map((code) => ({
  code,
  name: code,
  native_name: code,
}));

function isCollectionKey(key: unknown, collection: string): boolean {
  if (typeof key !== "string" || !key.startsWith(collection)) return false;
  const next = key.charAt(collection.length);
  return next === "" || next === "?" || next === "/";
}

export function useAdminEntityForm<TData extends FieldValues>(
  config: AdminFormConfig<TData>,
  mode: AdminFormMode,
  { initialData, id, pathParams = {} }: UseAdminEntityFormOptions<TData> = {}
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutate } = useSWRConfig();
  const pathKey = JSON.stringify(pathParams);
  const collection = useMemo(
    () => resolveAdminPath(config.path, JSON.parse(pathKey)),
    [config.path, pathKey]
  );

  const form = useForm<TData, unknown, TData>({
    resolver: zodResolver(config.schema) as unknown as Resolver<TData, unknown, TData>,
    defaultValues: (initialData ?? config.defaultValues()) as DefaultValues<TData>,
  });

  const lastInitialData = useRef<string | null>(null);
  useEffect(() => {
    if (!initialData) return;
    const serialized = JSON.stringify(initialData);
    if (serialized === lastInitialData.current) return;
    lastInitialData.current = serialized;
    form.reset(initialData);
  }, [initialData, form]);

  const submit = useCallback(
    async (data: TData) => {
      setIsSubmitting(true);
      try {
        const key = config.editKey?.(data) ?? id ?? "";
        const url = mode === "create" ? collection : `${collection}/${encodeURIComponent(key)}`;
        const payload = config.toPayload ? config.toPayload(data, mode) : data;
        await submitAdminEntity(
          url,
          mode === "create" ? "POST" : "PUT",
          payload,
          `Failed to ${mode}`
        );
        await mutate((cacheKey) => isCollectionKey(cacheKey, collection));
      } finally {
        setIsSubmitting(false);
      }
    },
    [config, collection, id, mode, mutate]
  );

  return { form, submit, isSubmitting, supportedLanguages: SUPPORTED_LANGUAGES };
}
