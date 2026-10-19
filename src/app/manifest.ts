import type { MetadataRoute } from "next";
import { BRAND_COLORS } from "@/lib/utils/brand-colors";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gamers Universe",
    short_name: "GameUniverse",
    description: "Your gaming universe starts here",
    start_url: "/",
    display: "standalone",
    background_color: BRAND_COLORS.neutral[950],
    theme_color: BRAND_COLORS.primary[500],
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
