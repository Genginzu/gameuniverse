"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function CharacterNotFound() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("characters.errors");
  const tCommon = useTranslations("common");

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Alert className="border-slate-700 bg-slate-800/50">
          <Icon icon="lucide:user-x" className="h-4 w-4 text-slate-400" />
          <AlertTitle className="text-white">{t("notFoundTitle")}</AlertTitle>
          <AlertDescription className="mt-2 text-slate-300">
            {t("notFoundDescription")}
          </AlertDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Link href={`/${locale}/characters`}>
                <Icon icon="lucide:arrow-left" className="mr-2 h-4 w-4" />
                {t("backToCharacters")}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Link href={`/${locale}/dashboard`}>
                <Icon icon="lucide:home" className="mr-2 h-4 w-4" />
                {tCommon("backToHome")}
              </Link>
            </Button>
          </div>
        </Alert>
      </div>
    </div>
  );
}
