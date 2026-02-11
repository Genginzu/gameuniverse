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
    },
    translations: formData.translations.map((t) => ({
      language_code: t.language_code,
      name: t.name ?? "",
      role: t.role || null,
      description: t.description || null,
      biography: t.biography || null,
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
  };
}

/**
 * Convertit un payload API en données de formulaire.
 * Les valeurs null sont converties en chaînes vides pour les champs du formulaire.
 */
export function characterPayloadToForm(payload: CharacterPayload): AdminCharacterFormData {
  return {
    slug: payload.character.slug,
    main_image_url: payload.character.main_image ?? "",
    background_image_url: payload.character.background_image ?? "",
    background_color: payload.character.background_color ?? "",
    translations: payload.translations.map((t) => ({
      language_code: t.language_code,
      name: t.name,
      role: t.role ?? "",
      description: t.description ?? "",
      biography: t.biography ?? "",
    })),
    games: payload.games,
    relationships: payload.relationships.map((r) => ({
      related_character_id: r.related_character_id,
      relationship_type: r.relationship_type,
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
  };
}
