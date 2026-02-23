"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useRatingForm } from "@/hooks/useRatingForm";
import { RatingForm } from "@/components/admin/age-classifications/RatingForm";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { FaArrowLeft } from "react-icons/fa";
import type { RatingFormData } from "@/lib/validations/admin-rating-form";
import type { AdminRating } from "@/types/admin-age-classifications";

export default function EditRatingPage() {
  const router = useRouter();
  const params = useParams<{ id: string; ratingId: string }>();
  const ratingSystemId = params.id;
  const ratingId = params.ratingId;

  const [initialData, setInitialData] = useState<RatingFormData | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadRating = async () => {
      try {
        const url = `/api/admin/age-classifications/${encodeURIComponent(ratingSystemId)}/ratings/${encodeURIComponent(ratingId)}`;
        const res = await fetch(url);

        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) setLoadError("Note introuvable");
            return;
          }
          if (mounted) setLoadError("Erreur lors du chargement de la note");
          return;
        }

        const json: { rating: AdminRating } = await res.json();
        if (mounted) {
          setInitialData({
            code: json.rating.code,
            display_name: json.rating.display_name,
            minimum_age: json.rating.minimum_age,
            color_hex: json.rating.color_hex ?? "",
            icon_url: json.rating.icon_url ?? "",
            sort_order: json.rating.sort_order,
            translations: json.rating.translations ?? [],
          });
        }
      } catch {
        if (mounted) setLoadError("Erreur lors du chargement de la note");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadRating();
    return () => {
      mounted = false;
    };
  }, [ratingSystemId, ratingId]);

  const backUrl = `/admin/age-classifications/${ratingSystemId}/edit`;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-gray-500 dark:text-gray-400">Chargement…</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
            <FaArrowLeft className="mr-1 h-3 w-3" />
            Retour au système
          </Button>
        </div>
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return initialData ? (
    <EditRatingFormWrapper
      ratingSystemId={ratingSystemId}
      ratingId={ratingId}
      initialData={initialData}
      backUrl={backUrl}
    />
  ) : null;
}

/** Inner form — mounts only when initialData is ready */
function EditRatingFormWrapper({
  ratingSystemId,
  ratingId,
  initialData,
  backUrl,
}: {
  ratingSystemId: string;
  ratingId: string;
  initialData: RatingFormData;
  backUrl: string;
}) {
  const router = useRouter();
  const { form, submitRating, isSubmitting, supportedLanguages } = useRatingForm(
    "edit",
    ratingSystemId,
    ratingId,
    initialData
  );

  const handleSubmit = useCallback(
    async (data: RatingFormData) => {
      try {
        await submitRating(data);
        toast({ title: "Note modifiée avec succès", variant: "success" });
        setTimeout(() => router.push(backUrl), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors de la modification";
        toast({ title: message, variant: "destructive" });
      }
    },
    [submitRating, router, backUrl]
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
          <FaArrowLeft className="mr-1 h-3 w-3" />
          Retour au système
        </Button>
      </div>

      <div className="mx-auto max-w-4xl">
        <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Modifier la note
        </h1>

        <RatingForm
          mode="edit"
          form={form}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          supportedLanguages={supportedLanguages}
        />
      </div>
    </div>
  );
}
