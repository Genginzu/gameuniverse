"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useReviewTranslations } from "@/hooks/useTranslations";
import { ReviewForm } from "./ReviewForm";
import type { ReviewInput } from "@/lib/validations/review";

interface ReviewFormDialogProps {
  gameId: string;
  onSubmitSuccess: () => void;
  onSubmit: (data: ReviewInput) => Promise<boolean>;
  submitting?: boolean;
  accentColor?: string;
}

export function ReviewFormDialog({
  gameId,
  onSubmitSuccess,
  onSubmit,
  submitting = false,
  accentColor,
}: ReviewFormDialogProps) {
  const t = useReviewTranslations();
  const [open, setOpen] = useState(false);

  const handleSubmit = async (data: ReviewInput): Promise<boolean> => {
    const success = await onSubmit(data);
    if (success) {
      setOpen(false);
    }
    return success;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="text-white hover:opacity-90"
          style={accentColor ? { backgroundColor: accentColor } : undefined}
        >
          <Pencil className="mr-2 h-4 w-4" />
          {t("writeReview")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        <ReviewForm
          gameId={gameId}
          onSubmitSuccess={onSubmitSuccess}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </DialogContent>
    </Dialog>
  );
}
