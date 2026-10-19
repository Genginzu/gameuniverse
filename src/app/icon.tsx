import { ImageResponse } from "next/og";
import { BRAND_COLORS } from "@/lib/utils/brand-colors";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 18,
        background: `linear-gradient(135deg, ${BRAND_COLORS.secondary[500]}, ${BRAND_COLORS.primary[600]})`,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 700,
        borderRadius: 6,
      }}
    >
      GU
    </div>,
    { ...size }
  );
}
