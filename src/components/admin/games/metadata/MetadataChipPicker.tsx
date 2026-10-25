"use client";

export interface ChipPickerOption {
  id: string;
  label: string;
}

interface MetadataChipPickerProps {
  title: string;
  options: ChipPickerOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  indicator?: React.ReactNode;
}

/** Toggle chips over a short reference list (themes, game modes, perspectives). */
export function MetadataChipPicker({ title, options, selectedIds, onToggle, indicator }: MetadataChipPickerProps) {
  return (
    <fieldset>
      <legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {title}
        <span className="font-normal text-gray-400">({selectedIds.length})</span>
        {indicator}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = selectedIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggle(option.id)}
              aria-pressed={selected}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ${
                selected
                  ? "border-primary bg-primary/10 text-primary dark:bg-primary/20 shadow-xs"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
