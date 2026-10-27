import { AppImage } from "@/components/ui/app-image";
import { Icon } from "@iconify/react";

import type { HomeShowcaseKind } from "@/types/home";

export function ShowcaseThumb({
  imageUrl,
  kind,
}: {
  imageUrl: string | null;
  kind: HomeShowcaseKind;
}) {
  return (
    <span className="relative block h-12 w-9 shrink-0 overflow-hidden rounded-md bg-slate-200 dark:bg-slate-700">
      {imageUrl ? (
        <AppImage src={imageUrl} alt="" fill sizes="36px" className="object-cover" />
      ) : (
        <Icon
          icon={kind === "game" ? "lucide:gamepad-2" : "lucide:user-round"}
          className="absolute inset-0 m-auto size-4 text-gray-400"
          aria-hidden
        />
      )}
    </span>
  );
}
