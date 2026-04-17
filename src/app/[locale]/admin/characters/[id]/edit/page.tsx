"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCharacterForm } from "@/hooks/useCharacterForm";
import { CharacterForm } from "@/components/admin/characters/CharacterForm";
import { characterPayloadToForm } from "@/lib/utils/character-form-utils";
import { Button } from "@/components/ui/button";
import { AdminFormSkeleton } from "@/components/admin/shared/AdminFormSkeleton";
import { toast } from "@/hooks/use-toast";

import type { AdminCharacterFormData } from "@/lib/validations/admin-character-form";
import type { CharacterPayload } from "@/types/admin-characters";
import { Icon } from "@iconify/react";

/** Raw API response shape from GET /api/admin/characters/[id] */
interface CharacterApiResponse {
  id: string;
  slug: string;
  igdb_id: number | null;
  main_image: string | null;
  background_image: string | null;
  background_color: string | null;
  gender_id: string | null;
  species_id: string | null;
  translations: Array<{
    language_code: string;
    name: string;
    role: string | null;
    description: string | null;
    biography: string | null;
    weapons: string | null;
  }>;
  games: Array<{
    game_id: string;
    is_primary: boolean;
  }>;
  relationships: Array<{
    related_character_id: string;
    relationship_type: string;
    description: string | null;
  }>;
  media: Array<{
    type: "screenshot" | "artwork" | "video";
    url: string;
    thumbnail_url: string | null;
    title: string | null;
    description: string | null;
    alt_text: string | null;
    is_featured: boolean;
    display_order: number;
  }>;
  role_ids?: string[];
}

/** Convert API response to CharacterPayload for use with characterPayloadToForm */
function apiResponseToPayload(response: CharacterApiResponse): CharacterPayload {
  return {
    character: {
      slug: response.slug,
      main_image: response.main_image,
      background_image: response.background_image,
      background_color: response.background_color,
      gender_id: response.gender_id ?? null,
      species_id: response.species_id ?? null,
    },
    translations: response.translations,
    games: response.games,
    relationships: response.relationships,
    media: response.media,
    role_ids: response.role_ids ?? [],
  };
}

/**
 * Inner component that mounts only when initialData is ready,
 * so useCharacterForm receives correct defaultValues on first render.
 */
function EditCharacterForm({
  initialData,
  characterId,
  igdbId,
}: {
  initialData: AdminCharacterFormData;
  characterId: string;
  igdbId: number | null;
}) {
  const t = useTranslations("admin.characters");
  const router = useRouter();

  const {
    form,
    availableGames,
    availableCharacters,
    availableRoles,
    loadingOptions,
    submitCharacter,
    isSubmitting,
  } = useCharacterForm("edit", initialData, characterId);

  const handleSubmit = useCallback(
    async (data: AdminCharacterFormData) => {
      try {
        await submitCharacter(data);
        toast({ title: t("editPage.success"), variant: "success" });
      } catch (err) {
        const message = err instanceof Error ? err.message : t("editPage.errorGeneric");
        toast({ title: message, variant: "destructive" });
      }
    },
    [submitCharacter, t]
  );

  // Keep showing the same loading style until options are ready
  if (loadingOptions) {
    return <AdminFormSkeleton showHeroBanner tabs={9} fields={4} />;
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/characters")}>
          <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
          {t("form.backToList")}
        </Button>
      </div>
      <div className="mx-auto max-w-7xl">
        <CharacterForm
          mode="edit"
          form={form}
          availableGames={availableGames}
          availableCharacters={availableCharacters}
          availableRoles={availableRoles}
          loadingOptions={loadingOptions}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          currentCharacterId={characterId}
          igdbId={igdbId}
        />
      </div>
    </div>
  );
}

export default function EditCharacterPage() {
  const t = useTranslations("admin.characters");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const characterId = params.id;

  const [initialData, setInitialData] = useState<AdminCharacterFormData | undefined>(undefined);
  const [igdbId, setIgdbId] = useState<number | null>(null);
  const [loadingCharacter, setLoadingCharacter] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCharacter = async () => {
      try {
        const res = await fetch(`/api/admin/characters/${characterId}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) setLoadError(t("editPage.notFound"));
          } else {
            if (mounted) setLoadError(t("editPage.loadError"));
          }
          return;
        }
        const data: CharacterApiResponse = await res.json();
        if (mounted) {
          const payload = apiResponseToPayload(data);
          setInitialData(characterPayloadToForm(payload));
          setIgdbId(data.igdb_id ?? null);
        }
      } catch {
        if (mounted) setLoadError(t("editPage.loadError"));
      } finally {
        if (mounted) setLoadingCharacter(false);
      }
    };

    loadCharacter();
    return () => {
      mounted = false;
    };
  }, [characterId]);

  if (loadingCharacter) {
    return <AdminFormSkeleton showHeroBanner tabs={9} fields={4} />;
  }

  if (loadError) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/characters")}>
            <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
            {t("form.backToList")}
          </Button>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {initialData && (
        <EditCharacterForm initialData={initialData} characterId={characterId} igdbId={igdbId} />
      )}
    </>
  );
}
