"use client";

import { useState, useCallback } from "react";
import { Hash, X } from "lucide-react";
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
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border-2 border-violet-300 bg-white/60 px-3 py-2 shadow-xs backdrop-blur-xs transition-all duration-200 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-400/20 dark:border-violet-500/50 dark:bg-slate-700/40 dark:focus-within:border-violet-400/60 dark:focus-within:ring-violet-400/15">
      <Hash className="h-4 w-4 shrink-0 text-violet-400 dark:text-violet-300" />

      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-500 transition-colors dark:bg-violet-400/10 dark:text-violet-300"
        >
          #{tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="rounded-full p-0.5 hover:bg-violet-500/20 dark:hover:bg-violet-400/20"
            aria-label={t("tagRemoveAriaLabel", { tag })}
          >
            <X className="h-3 w-3" />
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
          className="min-w-[80px] flex-1 border-none bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-hidden ring-0 focus:border-none focus:outline-hidden focus:ring-0 dark:text-slate-100 dark:placeholder-slate-500"
        />
      )}
    </div>
  );
}
