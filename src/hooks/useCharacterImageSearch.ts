import { useState } from "react";
import type { CharacterFormTabProps } from "@/types/admin-characters";
import type { AvailableGame } from "@/hooks/useCharacterForm";

export function useCharacterImageSearch(
  form: CharacterFormTabProps["form"],
  field: "main_image_url" | "background_image_url",
  availableGames: AvailableGame[]
) {
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    setLoading(true);
    setError(null);
    setSource(null);

    const translations = form.getValues("translations") ?? [];
    const name = translations.find((t) => (t.name ?? "").trim())?.name?.trim() ?? "";
    if (!name) { setError("noCharacterName"); setLoading(false); return; }

    const selectedGames = form.getValues("games") ?? [];
    const gameNames = selectedGames.map((g) => availableGames.find((ag) => ag.id === g.game_id)?.title).filter(Boolean) as string[];

    try {
      const res = await fetch("/api/admin/ai-image-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterName: name, gameNames: gameNames.length > 0 ? gameNames : undefined, imageType: field === "main_image_url" ? "main" : "background" }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (data.imageUrl) { form.setValue(field, data.imageUrl, { shouldDirty: true }); setSource(data.source); }
      else { setError("noImageFound"); }
    } catch { setError("searchFailed"); } finally { setLoading(false); }
  };

  return { search, loading, source, error };
}
