"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { IoChevronDown } from "react-icons/io5";
import { cn } from "@/lib/utils";
import FR from "country-flag-icons/react/3x2/FR";
import US from "country-flag-icons/react/3x2/US";

const locales = [
  { code: "fr", name: "Français", FlagComponent: FR },
  { code: "en", name: "English", FlagComponent: US },
];

// Composant SelectItem personnalisé sans checkmark
const LanguageSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center justify-center rounded-lg px-4 py-3 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
LanguageSelectItem.displayName = "LanguageSelectItem";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    router.push(pathname, { locale: newLocale });
  };

  const currentLocale = locales.find((l) => l.code === locale);
  const CurrentFlagComponent = currentLocale?.FlagComponent;

  return (
    <SelectPrimitive.Root value={locale} onValueChange={handleLocaleChange}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-12 w-20 items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2 transition-all hover:border-gray-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <SelectPrimitive.Value>
          {CurrentFlagComponent && (
            <CurrentFlagComponent className="h-6 w-8 rounded-sm shadow-sm" />
          )}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <IoChevronDown className="h-4 w-4 text-gray-600" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 relative z-50 min-w-20 overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-xl"
          )}
          position="popper"
          sideOffset={8}
        >
          <SelectPrimitive.Viewport className="p-2">
            {locales.map((localeItem) => {
              const FlagComponent = localeItem.FlagComponent;
              return (
                <LanguageSelectItem key={localeItem.code} value={localeItem.code}>
                  <FlagComponent className="h-6 w-8 rounded-sm shadow-sm" />
                </LanguageSelectItem>
              );
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
