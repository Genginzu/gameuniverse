"use client";

import { useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

const MAX_TAGS = 10;
const TAG_PATTERN = /^[a-z0-9_-]+$/;

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const t = useTranslations("players.posts");
  const [inputValue, setInputValue] = useState("");

  const addTag = useCallback(
    (raw: string) => {
      // Le "#" est optionnel — on le retire s'il est présent
      const tag = raw.toLowerCase().replace(/^#+/, "");
      if (!tag || !TAG_PATTERN.test(tag) || tags.includes(tag) || tags.length >= MAX_TAGS) return;
      onChange([...tags, tag]);
    },
    [tags, onChange]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onChange(tags.filter((t) => t !== tagToRemove));
    },
    [tags, onChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Detect "word " or "#word " — space after a word triggers conversion
    const match = value.match(/^#?([a-zA-Z0-9_-]+)\s$/);
    if (match) {
      addTag(match[1]);
      setInputValue("");
      return;
    }

    setInputValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
      setInputValue("");
    }
    // Backspace on empty input removes last tag
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="border-palette-primary-300 focus-within:border-palette-primary-400 focus-within:ring-palette-primary-400/20 dark:border-palette-primary-500/50 dark:focus-within:border-palette-primary-400/60 dark:focus-within:ring-palette-primary-400/15 flex flex-wrap items-center gap-1.5 rounded-xl border-2 bg-white/60 px-3 py-2 shadow-xs backdrop-blur-xs transition-all duration-200 focus-within:ring-2 dark:bg-slate-700/40">
      <Icon
        icon="lucide:hash"
        className="text-palette-primary-400 dark:text-palette-primary-300 h-4 w-4 shrink-0"
      />

      {tags.map((tag) => (
        <span
          key={tag}
          className="bg-palette-primary-500/10 text-palette-primary-500 dark:bg-palette-primary-400/10 dark:text-palette-primary-300 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors"
        >
          #{tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:bg-palette-primary-500/20 dark:hover:bg-palette-primary-400/20 rounded-full p-0.5"
            aria-label={t("tagRemoveAriaLabel", { tag })}
          >
            <Icon icon="lucide:x" className="h-3 w-3" />
          </button>
        </span>
      ))}

      {tags.length < MAX_TAGS && (
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? t("tagInputPlaceholder") : ""}
          aria-label={t("tagInputAriaLabel")}
          className="min-w-[80px] flex-1 border-none bg-transparent text-xs text-gray-800 placeholder-gray-400 ring-0 outline-hidden focus:border-none focus:ring-0 focus:outline-hidden dark:text-slate-100 dark:placeholder-slate-500"
        />
      )}
    </div>
  );
}
