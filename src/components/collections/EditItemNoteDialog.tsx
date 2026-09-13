"use client";

/**
 * EditItemNoteDialog : dialog d'édition de la note d'un jeu dans une collection
 * (look éditorial, owner-only). Pré-remplit la note existante et permet de la
 * modifier ou de la vider.
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Textarea } from "@/components/ui/textarea";

import type { CollectionItem } from "@/types/collection";

const NOTE_MAX_LENGTH = 250;

interface EditItemNoteDialogProps {
  item: CollectionItem | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (note: string) => Promise<void>;
}

export function EditItemNoteDialog({ item, isSaving, onClose, onSave }: EditItemNoteDialogProps) {
  const t = useTranslations("collections.editorial.detail.editNote");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (item) setNote(item.note ?? "");
  }, [item]);

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="border-editorial-line bg-editorial-2 text-white">
        <DialogHeader>
          <DialogTitle className="font-display text-white">
            {t("title", { title: item?.title ?? "" })}
          </DialogTitle>
        </DialogHeader>

        <div>
          <Textarea
            placeholder={t("placeholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={NOTE_MAX_LENGTH}
            rows={3}
            className="border-editorial-line bg-editorial-3 resize-none text-white placeholder:text-editorial-muted focus-visible:outline-none! focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <p className="text-editorial-muted mt-1 text-xs">
            {note.length}/{NOTE_MAX_LENGTH}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t("cancel")}
          </Button>
          <LoadingButton
            onClick={() => onSave(note)}
            loading={isSaving}
            loadingText={t("saving")}
            className="border border-[rgba(var(--accent-rgb,var(--neon-primary)),0.5)] bg-[rgba(var(--accent-rgb,var(--neon-primary)),0.15)] text-[rgb(var(--accent-rgb,var(--neon-primary)))] shadow-none hover:bg-[rgba(var(--accent-rgb,var(--neon-primary)),0.25)]"
          >
            {t("save")}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
