"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AdminCommentForm } from "@/components/admin/comments/AdminCommentForm";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";

import type { AdminCommentDetail } from "@/types/admin-comments";
import type { CommentInput } from "@/lib/validations/comment";
import { Icon } from "@iconify/react";

export default function EditCommentPage() {
  const t = useTranslations("admin.comments");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const commentId = params.id;

  const [comment, setComment] = useState<AdminCommentDetail | null>(null);
  const [loadingComment, setLoadingComment] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadComment = async () => {
      try {
        const res = await fetch(`/api/admin/comments/${commentId}`);
        if (!res.ok) {
          if (mounted) {
            setLoadError(res.status === 404 ? t("editPage.notFound") : t("editPage.errorGeneric"));
          }
          return;
        }
        const data: AdminCommentDetail = await res.json();
        if (mounted) setComment(data);
      } catch {
        if (mounted) setLoadError(t("editPage.errorGeneric"));
      } finally {
        if (mounted) setLoadingComment(false);
      }
    };

    loadComment();
    return () => {
      mounted = false;
    };
  }, [commentId, t]);

  const handleSubmit = useCallback(
    async (data: CommentInput) => {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/admin/comments/${commentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || t("editPage.errorGeneric"));
        }

        toast({ title: t("editPage.success"), variant: "success" });
        router.push("/admin/comments");
      } catch (err) {
        const message = err instanceof Error ? err.message : t("editPage.errorGeneric");
        toast({ title: message, variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [commentId, router, t]
  );

  if (loadingComment) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-gray-500 dark:text-gray-400">{t("editPage.loading")}</span>
        </div>
      </div>
    );
  }

  if (loadError || !comment) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/comments")}>
            <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
            {t("editPage.backToList")}
          </Button>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">
            {loadError ?? t("editPage.errorGeneric")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/comments")}>
          <Icon icon="fa:arrow-left" className="mr-1 h-3 w-3" />
          {t("editPage.backToList")}
        </Button>
        <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">
          {t("editPage.title")}
        </h1>
      </div>
      <div className="mx-auto max-w-5xl">
        <AdminCommentForm comment={comment} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
