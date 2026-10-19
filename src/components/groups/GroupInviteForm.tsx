"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import type { CreateGroupInvitationInput } from "@/types/group";

type InviteMode = "email" | "username";

interface GroupInviteFormProps {
  isSubmitting: boolean;
  error: string | null;
  onInvite: (input: CreateGroupInvitationInput) => Promise<void>;
}

const INPUT_CLASS =
  "border-editorial-line bg-editorial-3 text-white placeholder:text-editorial-muted hover:border-editorial-line focus-visible:border-[rgba(var(--accent-rgb,var(--neon-primary)),0.5)] focus-visible:outline-none! focus-visible:ring-0 focus-visible:ring-offset-0";

/** Formulaire d'invitation par email (joueur non inscrit) ou pseudo (joueur inscrit). */
export function GroupInviteForm({ isSubmitting, error, onInvite }: GroupInviteFormProps) {
  const t = useTranslations("groups.invitations");
  const [mode, setMode] = useState<InviteMode>("username");
  const [value, setValue] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setSuccess(false);
    await onInvite(mode === "email" ? { email: value.trim() } : { username: value.trim() });
    setValue("");
    setSuccess(true);
  };

  return (
    <form onSubmit={handleSubmit} className="border-editorial-line bg-editorial-2 rounded-2xl border p-4">
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("username")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === "username"
              ? "btn-filled"
              : "border-editorial-line bg-editorial-3 border text-white"
          }`}
        >
          {t("byUsername")}
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === "email"
              ? "btn-filled"
              : "border-editorial-line bg-editorial-3 border text-white"
          }`}
        >
          {t("byEmail")}
        </button>
      </div>

      <div className="flex gap-2">
        <Input
          type={mode === "email" ? "email" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={mode === "email" ? t("emailPlaceholder") : t("usernamePlaceholder")}
          className={INPUT_CLASS}
        />
        <LoadingButton type="submit" loading={isSubmitting} disabled={!value.trim()}>
          <Icon icon="lucide:send" className="h-4 w-4" aria-hidden="true" />
          {t("invite")}
        </LoadingButton>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      {success && !error && <p className="mt-2 text-sm text-emerald-400">{t("inviteSuccess")}</p>}
    </form>
  );
}
