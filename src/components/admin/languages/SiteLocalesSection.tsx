"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";

export interface SiteLocale {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  translationKeyCount: number;
}

export interface SiteLocalesSectionProps {
  locales: SiteLocale[];
}

export function SiteLocalesSection({ locales }: SiteLocalesSectionProps) {
  const t = useTranslations("admin.languages.siteLocales");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon icon="fa:globe" className="text-palette-primary-500 h-5 w-5" />
          <CardTitle>{t("title")}</CardTitle>
        </div>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {locales.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("noLocales")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm" role="table">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    {t("code")}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    {t("name")}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    <div className="flex items-center gap-1">
                      <Icon icon="fa:key" className="h-3 w-3" />
                      <span>{t("translationKeys", { count: 0 }).replace("0 ", "")}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {locales.map((locale) => (
                  <tr key={locale.code}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          {locale.code}
                        </span>
                        {locale.isDefault && (
                          <Badge variant="secondary" className="gap-1">
                            <Icon icon="fa:star" className="h-3 w-3 text-yellow-500" />
                            {t("default")}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {locale.name}
                        </span>
                        {locale.nativeName && locale.nativeName !== locale.name && (
                          <span className="ml-1 text-gray-500 dark:text-gray-400">
                            ({locale.nativeName})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {t("translationKeys", { count: locale.translationKeyCount })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info message about source code management */}
        <div className="border-palette-primary-200 bg-palette-primary-50 dark:border-palette-primary-800 dark:bg-palette-primary-950 flex items-start gap-2 rounded-lg border p-3">
          <Icon
            icon="fa:info-circle"
            className="text-palette-primary-500 mt-0.5 h-4 w-4 shrink-0"
          />
          <p className="text-palette-primary-700 dark:text-palette-primary-300 text-sm">
            {t("managedViaCode", {
              routingFile: "src/i18n/routing.ts",
              messagesDir: "src/messages/*.json",
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
