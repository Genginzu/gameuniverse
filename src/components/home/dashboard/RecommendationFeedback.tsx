"use client";

/**
 * RecommendationFeedback : outcome of the card actions — errors, then the
 * "not interested" notice (with undo) and the "added to library" notice.
 */

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { RecommendationNotice } from "./RecommendationNotice";

interface NoticeGame {
  slug: string;
  title: string;
}

interface RecommendationFeedbackProps {
  dismissed: NoticeGame | null;
  added: NoticeGame | null;
  dismissFailed: boolean;
  addFailed: boolean;
  onUndo: () => void;
}

function gameLink(slug: string) {
  return function GameLink(title: ReactNode) {
    return (
      <Link
        href={`/games/${slug}`}
        className="text-editorial-accent font-semibold underline-offset-2 hover:underline focus-visible:underline"
      >
        {title}
      </Link>
    );
  };
}

function ErrorLine({ message }: { message: string }) {
  return (
    <p role="alert" className="-mt-2 text-sm text-red-400">
      {message}
    </p>
  );
}

export function RecommendationFeedback({
  dismissed,
  added,
  dismissFailed,
  addFailed,
  onUndo,
}: RecommendationFeedbackProps) {
  const t = useTranslations("homeDashboard.recommendations");

  return (
    <>
      {dismissFailed && <ErrorLine message={t("dismissError")} />}
      {addFailed && <ErrorLine message={t("addError")} />}
      {dismissed && (
        <RecommendationNotice
          icon="lucide:eye-off"
          message={t.rich("dismissed", { game: gameLink(dismissed.slug), title: dismissed.title })}
          undo={{ label: t("undo"), onClick: onUndo }}
        />
      )}
      {added && (
        <RecommendationNotice
          icon="lucide:library-big"
          message={t.rich("added", { game: gameLink(added.slug), title: added.title })}
        />
      )}
    </>
  );
}
