import { ImageResponse } from "next/og";
import { BRAND_COLORS } from "@/lib/utils/brand-colors";

export const alt = "Gamers Universe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: `linear-gradient(135deg, ${BRAND_COLORS.neutral[950]} 0%, ${BRAND_COLORS.neutral[900]} 50%, ${BRAND_COLORS.neutral[950]} 100%)`,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: 700,
          background: `linear-gradient(90deg, ${BRAND_COLORS.secondary[500]}, ${BRAND_COLORS.primary[600]})`,
          backgroundClip: "text",
          color: "transparent",
          marginBottom: 20,
        }}
      >
        Gamers Universe
      </div>
      <div style={{ fontSize: 30, color: BRAND_COLORS.neutral[400] }}>
        Your gaming universe starts here
      </div>
    </div>,
    { ...size }
  );
}
