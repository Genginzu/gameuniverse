"use client";

import Image from "next/image";
import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { CharacterFormTabProps } from "@/types/admin-characters";
import type { AvailableCharacter } from "@/hooks/useCharacterForm";
import { RELATIONSHIP_TYPES } from "@/lib/validations/admin-character-form";
import { Icon } from "@iconify/react";

interface RelationsTabProps extends CharacterFormTabProps {
  availableCharacters: AvailableCharacter[];
  /** ID du personnage en cours d'édition (pour l'exclure du picker) */
  currentCharacterId?: string;
}

export function CharacterFormRelationsTab({
  form,
  t,
  availableCharacters,
  currentCharacterId,
}: RelationsTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const watchedRelations = form.watch("relationships");

  // Exclure le personnage courant et ceux déjà ajoutés
  const assignedIds = watchedRelations.map((r) => r.related_character_id);
  const pickableCharacters = availableCharacters.filter(
    (c) => c.id !== currentCharacterId && !assignedIds.includes(c.id)
  );

  const addRelation = (characterId: string) => {
    const current = form.getValues("relationships");
    form.setValue(
      "relationships",
      [
        ...current,
        { related_character_id: characterId, relationship_type: "ally", description: "" },
      ],
      { shouldValidate: true }
    );
    setShowPicker(false);
  };

  const removeRelation = (characterId: string) => {
    const current = form.getValues("relationships");
    form.setValue(
      "relationships",
      current.filter((r) => r.related_character_id !== characterId),
      { shouldValidate: true }
    );
  };

  const updateRelationType = (characterId: string, type: string) => {
    const current = form.getValues("relationships");
    form.setValue(
      "relationships",
      current.map((r) =>
        r.related_character_id === characterId
          ? { ...r, relationship_type: type as typeof r.relationship_type }
          : r
      ),
      { shouldValidate: true }
    );
  };

  const updateRelationDescription = (characterId: string, description: string) => {
    const current = form.getValues("relationships");
    form.setValue(
      "relationships",
      current.map((r) => (r.related_character_id === characterId ? { ...r, description } : r)),
      { shouldValidate: true }
    );
  };

  return (
    <div className="space-y-4">
      {watchedRelations.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("noRelations") ?? "Aucune relation ajoutée."}
        </p>
      ) : (
        <div className="space-y-2">
          {watchedRelations.map((rel) => {
            const character = availableCharacters.find((c) => c.id === rel.related_character_id);
            return (
              <RelationRow
                key={rel.related_character_id}
                characterName={character?.name ?? "Unknown"}
                characterImage={character?.mainImage ?? null}
                relationshipType={rel.relationship_type}
                description={rel.description ?? ""}
                onChangeType={(type) => updateRelationType(rel.related_character_id, type)}
                onChangeDescription={(desc) =>
                  updateRelationDescription(rel.related_character_id, desc)
                }
                onRemove={() => removeRelation(rel.related_character_id)}
                t={t}
              />
            );
          })}
        </div>
      )}

      {showPicker ? (
        <CharacterSearchPicker
          availableCharacters={pickableCharacters}
          onSelect={addRelation}
          onClose={() => setShowPicker(false)}
          t={t}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPicker(true)}
          className="gap-1.5"
          disabled={pickableCharacters.length === 0}
        >
          <Icon icon="fa:plus" className="h-3 w-3" />
          {t("addRelation") ?? "Ajouter une relation"}
        </Button>
      )}

      {form.formState.errors.relationships && (
        <p className="text-destructive text-sm font-medium">
          {form.formState.errors.relationships.message}
        </p>
      )}
    </div>
  );
}

/** Ligne d'une relation existante */
function RelationRow({
  characterName,
  characterImage,
  relationshipType,
  description,
  onChangeType,
  onChangeDescription,
  onRemove,
  t,
}: {
  characterName: string;
  characterImage: string | null;
  relationshipType: string;
  description: string;
  onChangeType: (type: string) => void;
  onChangeDescription: (desc: string) => void;
  onRemove: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="border-primary/20 bg-primary/5 dark:bg-primary/10 rounded-xl border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {characterImage && (
            <Image
              src={characterImage}
              alt={characterName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border border-gray-200 object-cover dark:border-gray-700"
              unoptimized
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {characterName}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          aria-label={`Remove ${characterName}`}
        >
          <Icon icon="fa:times" className="h-3 w-3" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            {t("relationType") ?? "Type de relation"}
          </label>
          <select
            value={relationshipType}
            onChange={(e) => onChangeType(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {RELATIONSHIP_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`relationTypes.${type}`) ?? type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            {t("relationDescription") ?? "Description"}
          </label>
          <Input
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            placeholder={t("relationDescriptionPlaceholder") ?? "Description de la relation..."}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}

/** Picker avec recherche pour trouver un personnage */
function CharacterSearchPicker({
  availableCharacters,
  onSelect,
  onClose,
  t,
}: {
  availableCharacters: AvailableCharacter[];
  onSelect: (characterId: string) => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredCharacters = useMemo(() => {
    if (!search.trim()) return availableCharacters;
    const query = search.toLowerCase().trim();
    return availableCharacters.filter((c) => c.name.toLowerCase().includes(query));
  }, [availableCharacters, search]);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("addRelation") ?? "Ajouter une relation"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Icon icon="fa:times" className="h-3 w-3" />
        </button>
      </div>

      <div className="relative mb-3">
        <Icon
          icon="fa:search"
          className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
        />
        <Input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchCharacterPlaceholder") ?? "Rechercher un personnage..."}
          className="pl-9"
        />
      </div>

      {availableCharacters.length === 0 ? (
        <p className="text-sm text-gray-400">
          {t("allCharactersAdded") ?? "Tous les personnages sont déjà ajoutés"}
        </p>
      ) : filteredCharacters.length === 0 ? (
        <p className="py-3 text-center text-sm text-gray-400">
          {t("noCharacterFound") ?? "Aucun personnage trouvé"}
        </p>
      ) : (
        <ul
          className="max-h-60 space-y-1 overflow-y-auto"
          role="listbox"
          aria-label={t("selectCharacter") ?? "Sélectionner un personnage"}
        >
          {filteredCharacters.map((character) => (
            <li key={character.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => onSelect(character.id)}
                className="hover:bg-primary/10 dark:hover:bg-primary/20 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors"
              >
                {character.mainImage && (
                  <Image
                    src={character.mainImage}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 rounded-full border border-gray-200 object-cover dark:border-gray-700"
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <span className="truncate text-gray-900 dark:text-white">{character.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
