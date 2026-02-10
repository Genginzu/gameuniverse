"use client";

import { useTranslations } from "next-intl";
import { FaGlobe, FaStar, FaKey, FaInfoCircle } from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
          <FaGlobe className="h-5 w-5 text-blue-500" />
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
                      <FaKey className="h-3 w-3" />
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
                            <FaStar className="h-3 w-3 text-yellow-500" />
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
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
          <FaInfoCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
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
