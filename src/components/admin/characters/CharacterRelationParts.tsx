"use client";

import Image from "next/image";
import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { RELATIONSHIP_TYPES } from "@/lib/validations/admin-character-form";
import type { AvailableCharacter } from "@/hooks/useCharacterForm";
import { Icon } from "@iconify/react";

/** Row for an existing relation */
export function RelationRow({
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

/** Picker with search to find a character */
export function CharacterSearchPicker({
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
