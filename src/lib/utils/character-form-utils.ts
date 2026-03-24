import type { AdminCharacterFormData } from "@/lib/validations/admin-character-form";
import type { CharacterPayload } from "@/types/admin-characters";

/**
 * Convertit les données du formulaire en payload API.
 * Les chaînes vides sont converties en null pour les champs optionnels.
 */
export function characterFormToPayload(formData: AdminCharacterFormData): CharacterPayload {
  return {
    character: {
      slug: formData.slug,
      main_image: formData.main_image_url || null,
      background_image: formData.background_image_url || null,
      background_color: formData.background_color || null,
      gender_id: formData.gender_id ?? null,
      species_id: formData.species_id ?? null,
    },
    translations: formData.translations.map((t) => ({
      language_code: t.language_code,
      name: t.name ?? "",
      role: t.role || null,
      description: t.description || null,
      biography: t.biography || null,
      weapons: t.weapons || null,
    })),
    games: formData.games ?? [],
    relationships: (formData.relationships ?? []).map((r) => ({
      related_character_id: r.related_character_id,
      relationship_type: r.relationship_type,
      description: r.description || null,
    })),
    media: (formData.media ?? []).map((m) => ({
      type: m.type,
      url: m.url,
      thumbnail_url: m.thumbnail_url || null,
      title: m.title || null,
      description: m.description || null,
      alt_text: m.alt_text || null,
      is_featured: m.is_featured ?? false,
      display_order: m.display_order ?? 0,
    })),
    role_ids: formData.role_ids ?? [],
  };
}

/**
 * Convertit un payload API en données de formulaire.
 * Les valeurs null sont converties en chaînes vides pour les champs du formulaire.
 */
export function characterPayloadToForm(payload: CharacterPayload): AdminCharacterFormData {
  // Garantir que toutes les langues supportées sont présentes dans le formulaire.
  // Si une traduction manque, on l'initialise avec des valeurs vides pour éviter
  // de perdre les traductions existantes lors de la sauvegarde (DELETE + INSERT).
  const SUPPORTED_CODES = ["fr", "en"];
  const existingTranslations = payload.translations.map((t) => ({
    language_code: t.language_code,
    name: t.name,
    role: t.role ?? "",
    description: t.description ?? "",
    biography: t.biography ?? "",
    weapons: t.weapons ?? "",
  }));
  const existingCodes = new Set(existingTranslations.map((t) => t.language_code));
  const missingTranslations = SUPPORTED_CODES.filter((code) => !existingCodes.has(code)).map(
    (code) => ({
      language_code: code,
      name: "",
      role: "",
      description: "",
      biography: "",
      weapons: "",
    })
  );
  // Trier fr en premier pour cohérence avec l'UI
  const allTranslations = [...existingTranslations, ...missingTranslations].sort((a, b) =>
    a.language_code === "fr" ? -1 : b.language_code === "fr" ? 1 : 0
  );

  return {
    slug: payload.character.slug,
    main_image_url: payload.character.main_image ?? "",
    background_image_url: payload.character.background_image ?? "",
    background_color: payload.character.background_color ?? "",
    gender_id: payload.character.gender_id ?? null,
    species_id: payload.character.species_id ?? null,
    translations: allTranslations,
    games: payload.games,
    relationships: payload.relationships.map((r) => ({
      related_character_id: r.related_character_id,
      relationship_type: r.relationship_type as
        | "ally"
        | "enemy"
        | "rival"
        | "family"
        | "romantic"
        | "mentor"
        | "friend",
      description: r.description ?? "",
    })),
    media: payload.media.map((m) => ({
      type: m.type,
      url: m.url,
      thumbnail_url: m.thumbnail_url ?? "",
      title: m.title ?? "",
      description: m.description ?? "",
      alt_text: m.alt_text ?? "",
      is_featured: m.is_featured,
      display_order: m.display_order,
    })),
    role_ids: payload.role_ids ?? [],
  };
}
