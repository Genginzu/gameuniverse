"use client";

import { Icon } from "@iconify/react";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import type { ReactNode } from "react";

interface InvitationMessageProps {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
}

/** État "informatif" de la page invitation (auth requise, expirée, déjà répondue, introuvable). */
export function InvitationMessage({ icon, title, description, action }: InvitationMessageProps) {
  return (
    <section className="w-full">
      <EditorialContainer>
        <div className="border-editorial-line bg-editorial-2 mx-auto flex max-w-md flex-col items-center gap-5 rounded-3xl border px-8 py-16 text-center">
          <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
            <Icon icon={icon} className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
          <p className="text-editorial-muted max-w-[50ch]">{description}</p>
          {action}
        </div>
      </EditorialContainer>
    </section>
  );
}
