"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CharacterFormTabProps } from "@/types/admin-characters";
import type { AvailableCharacter } from "@/hooks/useCharacterForm";
import { RelationRow, CharacterSearchPicker } from "./CharacterRelationParts";
import { Icon } from "@iconify/react";

interface RelationsTabProps extends CharacterFormTabProps {
  availableCharacters: AvailableCharacter[];
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
