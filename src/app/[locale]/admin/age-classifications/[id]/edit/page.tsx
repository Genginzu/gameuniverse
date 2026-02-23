"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useRatingSystemForm } from "@/hooks/useRatingSystemForm";
import { RatingSystemForm } from "@/components/admin/age-classifications/RatingSystemForm";
import { RatingsTab } from "@/components/admin/age-classifications/RatingsTab";
import { DescriptorsTab } from "@/components/admin/age-classifications/DescriptorsTab";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { FaArrowLeft } from "react-icons/fa";
import type { RatingSystemFormData } from "@/lib/validations/admin-rating-system-form";

type TabId = "info" | "ratings" | "descriptors";

interface RatingSystemApiResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  country_codes: string[];
  website_url: string | null;
}

/** Inner form component — mounts only when initialData is ready */
function EditSystemForm({
  systemId,
  initialData,
}: {
  systemId: string;
  initialData: RatingSystemFormData;
}) {
  const router = useRouter();
  const { form, submitRatingSystem, isSubmitting } = useRatingSystemForm(
    "edit",
    systemId,
    initialData
  );

  const handleSubmit = useCallback(
    async (data: RatingSystemFormData) => {
      try {
        await submitRatingSystem(data);
        toast({ title: "Système modifié avec succès", variant: "success" });
        setTimeout(() => router.push("/admin/age-classifications"), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors de la modification";
        toast({ title: message, variant: "destructive" });
      }
    },
    [submitRatingSystem, router]
  );

  return (
    <RatingSystemForm mode="edit" form={form} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
  );
}

const TABS: { id: TabId; label: string }[] = [
  { id: "info", label: "Informations" },
  { id: "ratings", label: "Notes" },
  { id: "descriptors", label: "Descripteurs" },
];

export default function EditRatingSystemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const systemId = params.id;

  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [initialData, setInitialData] = useState<RatingSystemFormData | undefined>(undefined);
  const [systemName, setSystemName] = useState("");
  const [loadingSystem, setLoadingSystem] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSystem = async () => {
      try {
        const res = await fetch(`/api/admin/age-classifications/${encodeURIComponent(systemId)}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) {
              toast({ title: "Système introuvable", variant: "destructive" });
              router.push("/admin/age-classifications");
            }
            return;
          }
          if (mounted) setLoadError("Erreur lors du chargement du système");
          return;
        }
        const json: { ratingSystem: RatingSystemApiResponse } = await res.json();
        if (mounted) {
          setSystemName(json.ratingSystem.name);
          setInitialData({
            code: json.ratingSystem.code,
            name: json.ratingSystem.name,
            description: json.ratingSystem.description ?? "",
            country_codes: json.ratingSystem.country_codes ?? [],
            website_url: json.ratingSystem.website_url ?? "",
          });
        }
      } catch {
        if (mounted) setLoadError("Erreur lors du chargement du système");
      } finally {
        if (mounted) setLoadingSystem(false);
      }
    };

    loadSystem();
    return () => {
      mounted = false;
    };
  }, [systemId, router]);

  if (loadingSystem) {
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/age-classifications")}
          >
            <FaArrowLeft className="mr-1 h-3 w-3" />
            Retour à la liste
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

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/age-classifications")}>
          <FaArrowLeft className="mr-1 h-3 w-3" />
          Retour à la liste
        </Button>
      </div>

      <h1 className="neon-text mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Modifier {systemName}
      </h1>

      {/* Tab navigation */}
      <nav className="mb-6 flex gap-1 rounded-xl border border-gray-200/60 bg-white p-1 shadow-sm dark:border-gray-700/40 dark:bg-gray-800/60">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      {activeTab === "info" && initialData && (
        <div className="mx-auto max-w-4xl">
          <EditSystemForm systemId={systemId} initialData={initialData} />
        </div>
      )}

      {activeTab === "ratings" && <RatingsTab ratingSystemId={systemId} />}

      {activeTab === "descriptors" && <DescriptorsTab ratingSystemId={systemId} />}
    </div>
  );
}
