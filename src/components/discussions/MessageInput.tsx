"use client";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  isSending: boolean;
  maxLength: number;
}

export default function MessageInput({ onSend, isSending, maxLength }: MessageInputProps) {
  const t = useTranslations("discussions");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    const trimmed = content.trim();

    if (!trimmed) {
      setError(t("messageEmpty"));
      inputRef.current?.focus();
      return;
    }

    if (trimmed.length > maxLength) {
      setError(t("messageTooLong", { max: maxLength }));
      inputRef.current?.focus();
      return;
    }

    setError(null);

    try {
      await onSend(trimmed);
      setContent("");
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    if (error) setError(null);
  };

  return (
    <div className="space-y-1" data-testid="message-input-container">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t("inputPlaceholder")}
          disabled={isSending}
          className="glass-input flex-1 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-50 dark:text-slate-100 dark:placeholder:text-slate-500"
          data-testid="message-input"
          aria-label={t("inputPlaceholder")}
          aria-invalid={!!error}
          aria-describedby={error ? "message-input-error" : undefined}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isSending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 via-purple-600 to-purple-700 text-white shadow-lg transition-all duration-300 hover:opacity-90 disabled:opacity-50"
          data-testid="message-send-button"
          aria-label={t("send")}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <p
          id="message-input-error"
          className="text-xs text-red-500 dark:text-red-400"
          data-testid="message-input-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
