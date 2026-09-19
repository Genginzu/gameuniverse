"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationCenter } from "@/hooks/useNotificationCenter";
import { EditorialContainer } from "@/components/layout/editorial/EditorialContainer";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { NotificationCenterFilters } from "./NotificationCenterFilters";
import { NotificationCenterItem } from "./NotificationCenterItem";

export function NotificationCenterContent() {
  const t = useTranslations("notificationCenter");
  const { user, loading: authLoading } = useAuth();
  const { unreadCount, mutate: mutateBell } = useNotifications();
  const {
    notifications,
    total,
    totalPages,
    page,
    category,
    status,
    isLoading,
    setPage,
    setCategory,
    setStatus,
    toggleRead,
    markAllAsRead,
  } = useNotificationCenter();

  const handleToggleRead = async (id: string, isRead: boolean) => {
    await toggleRead(id, isRead);
    await mutateBell();
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    await mutateBell();
  };

  return (
    <section className="w-full">
      <EditorialContainer>
        {/* Hero */}
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <KickerLabel>{t("kicker")}</KickerLabel>
            <h1 className="mt-2 font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
              {t("titlePrefix")} <span className="text-editorial-accent">{t("titleAccent")}</span>
            </h1>
            <p className="text-editorial-muted mt-4 max-w-[60ch] text-base">{t("subtitle")}</p>
          </div>
          {user && unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAll} className="shrink-0">
              <Icon icon="mdi:email-open-multiple-outline" className="mr-2 size-4" />
              {t("markAllAsRead")}
            </Button>
          )}
        </header>

        {!authLoading && !user ? (
          <AuthRequired />
        ) : (
          <div className="space-y-6">
            <NotificationCenterFilters
              category={category}
              status={status}
              onCategoryChange={setCategory}
              onStatusChange={setStatus}
            />

            {isLoading && notifications.length === 0 ? (
              <ListSkeleton />
            ) : notifications.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <NotificationCenterItem
                    key={notification.id}
                    notification={notification}
                    onToggleRead={handleToggleRead}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalCount={total}
                onPageChange={setPage}
                loading={isLoading}
                variant="editorial"
              />
            )}
          </div>
        )}
      </EditorialContainer>
    </section>
  );
}

function AuthRequired() {
  const t = useTranslations("notificationCenter");
  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:lock" className="h-7 w-7" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">{t("authRequired.title")}</h3>
      <p className="text-editorial-muted max-w-[50ch]">{t("authRequired.description")}</p>
      <Button asChild>
        <Link href="/auth">
          <Icon icon="lucide:log-in" className="mr-2 h-4 w-4" />
          {t("authRequired.signIn")}
        </Link>
      </Button>
    </div>
  );
}

function EmptyState() {
  const t = useTranslations("notificationCenter");
  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="mdi:bell-outline" className="h-7 w-7" />
      </div>
      <p className="text-editorial-muted max-w-[50ch]">{t("empty")}</p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="border-editorial-line bg-editorial-2 flex animate-pulse items-center gap-3 rounded-2xl border p-4"
        >
          <div className="size-9 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-white/10" />
            <div className="h-3 w-24 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
