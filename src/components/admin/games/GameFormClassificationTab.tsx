"use client";

/**
 * "Classification" tab of the admin game form: IGDB themes, game modes,
 * perspectives (chips), multiplayer modes, franchises, series, engines,
 * keywords (search) and the IGDB rating.
 */

import { Fragment } from "react";
import { useTranslations } from "next-intl";

import { useAdminGameMetadataOptions } from "@/hooks/useAdminGameMetadataOptions";
import { igdbLabel, type IgdbLabelGroup } from "@/lib/utils/igdbLabels";
import type { GameFormTabProps, TrackableField } from "@/types/admin-games";
import type { AdminMetadataOption, AdminMetadataSearchKind } from "@/types/game-metadata";
import { IgdbFieldIndicator } from "./IgdbFieldIndicator";
import { MetadataChipPicker } from "./metadata/MetadataChipPicker";
import { MetadataSearchPicker, type PickedReference } from "./metadata/MetadataSearchPicker";
import { IgdbRatingFields } from "./metadata/IgdbRatingFields";
import { MultiplayerEditor, type MultiplayerPlatformOption } from "./metadata/MultiplayerEditor";

type ChipField = "themes" | "game_modes" | "player_perspectives";
type SearchField = "franchises" | "series" | "game_engines" | "keywords";

const CHIP_FIELDS: Array<{
  field: ChipField;
  idKey: string;
  group: IgdbLabelGroup;
  labelKey: string;
}> = [
  { field: "themes", idKey: "theme_id", group: "themes", labelKey: "themes" },
  { field: "game_modes", idKey: "game_mode_id", group: "gameModes", labelKey: "gameModes" },
  {
    field: "player_perspectives",
    idKey: "player_perspective_id",
    group: "playerPerspectives",
    labelKey: "playerPerspectives",
  },
];

const SEARCH_FIELDS: Array<{
  field: SearchField;
  idKey: string;
  tracked: TrackableField;
  labelKey: string;
}> = [
  { field: "franchises", idKey: "franchise_id", tracked: "franchises", labelKey: "franchiseList" },
  { field: "series", idKey: "series_id", tracked: "franchises", labelKey: "seriesList" },
  {
    field: "game_engines",
    idKey: "game_engine_id",
    tracked: "game_engines",
    labelKey: "gameEngines",
  },
  { field: "keywords", idKey: "keyword_id", tracked: "keywords", labelKey: "keywords" },
];

type Rows = Array<Record<string, string | undefined>>;

interface GameFormClassificationTabProps extends GameFormTabProps {
  gamePlatforms: MultiplayerPlatformOption[];
}

export function GameFormClassificationTab({
  form,
  t,
  isIgdbField,
  gamePlatforms,
}: GameFormClassificationTabProps) {
  const tMeta = useTranslations("admin.games.form.metadata");
  const tLabels = useTranslations("igdbMetadata");
  const { options } = useAdminGameMetadataOptions();

  const indicator = (field: TrackableField) =>
    isIgdbField ? <IgdbFieldIndicator fieldName={field} isIgdbField={isIgdbField(field)} /> : null;

  const toChipOptions = (rows: AdminMetadataOption[], group: IgdbLabelGroup) =>
    rows.map((row) => ({
      id: row.id,
      label: igdbLabel(tLabels, group, row.igdb_id, row.name ?? row.id),
    }));

  const setRows = (field: ChipField | SearchField, rows: Rows) =>
    // Each field has its own row shape; the zod schema validates them on submit.
    form.setValue(field, rows as never, { shouldDirty: true });

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="space-y-6">
        {CHIP_FIELDS.map(({ field, idKey, group, labelKey }) => {
          const selectedIds = (form.watch(field) as Rows).map((row) => row[idKey] as string);
          return (
            <Fragment key={field}>
              <MetadataChipPicker
                title={t(labelKey)}
                options={toChipOptions(options[field], group)}
                selectedIds={selectedIds}
                indicator={indicator(field)}
                onToggle={(id) =>
                  setRows(
                    field,
                    selectedIds.includes(id)
                      ? selectedIds
                          .filter((other) => other !== id)
                          .map((other) => ({ [idKey]: other }))
                      : [...selectedIds, id].map((other) => ({ [idKey]: other }))
                  )
                }
              />
              {field === "game_modes" && (
                <MultiplayerEditor
                  form={form}
                  isIgdbField={isIgdbField}
                  platforms={gamePlatforms}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {SEARCH_FIELDS.map(({ field, idKey, tracked, labelKey }) => {
          const selected: PickedReference[] = (form.watch(field) as Rows).map((row) => ({
            id: row[idKey] as string,
            name: row.name,
          }));
          return (
            <MetadataSearchPicker
              key={field}
              kind={field as AdminMetadataSearchKind}
              title={tMeta(labelKey)}
              selected={selected}
              indicator={indicator(tracked)}
              onChange={(next) =>
                setRows(
                  field,
                  next.map((item) => ({ [idKey]: item.id, name: item.name }))
                )
              }
            />
          );
        })}
      </div>

      <IgdbRatingFields form={form} isIgdbField={isIgdbField} />
    </div>
  );
}
