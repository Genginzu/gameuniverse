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
import { getContrastTextColor } from "@/lib/utils/game-utils";
import { ReviewForm } from "./ReviewForm";
import type { ReviewInput } from "@/lib/validations/review";
import type { Review } from "@/types/review";

interface ReviewFormDialogProps {
  gameId: string;
  onSubmitSuccess: () => void;
  onSubmit: (data: ReviewInput) => Promise<boolean>;
  submitting?: boolean;
  accentColor?: string;
  /** Pass existing review to enable edit mode */
  existingReview?: Review;
}

export function ReviewFormDialog({
  gameId,
  onSubmitSuccess,
  onSubmit,
  submitting = false,
  accentColor,
  existingReview,
}: ReviewFormDialogProps) {
  const t = useReviewTranslations();
  const [open, setOpen] = useState(false);
  const isEdit = !!existingReview;

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
          className="hover:opacity-90"
          style={
            accentColor
              ? {
                  backgroundColor: accentColor,
                  color: getContrastTextColor(accentColor),
                }
              : undefined
          }
        >
          <Pencil className="mr-2 h-4 w-4" />
          {isEdit ? t("editReview") : t("writeReview")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader className="mb-2">
          <DialogTitle>{isEdit ? t("editDialogTitle") : t("dialogTitle")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("editDialogDescription") : t("dialogDescription")}
          </DialogDescription>
        </DialogHeader>
        <ReviewForm
          gameId={gameId}
          onSubmitSuccess={onSubmitSuccess}
          onSubmit={handleSubmit}
          submitting={submitting}
          defaultValues={
            existingReview
              ? {
                  rating: existingReview.rating,
                  content: existingReview.content,
                  positivePoints: existingReview.positivePoints,
                  negativePoints: existingReview.negativePoints,
                }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  );
}
