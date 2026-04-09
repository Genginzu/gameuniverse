import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 80,
          background:
            "linear-gradient(135deg, rgb(6, 182, 212), rgb(139, 92, 246))",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
          borderRadius: 32,
        }}
      >
        GU
      </div>
    ),
    { ...size }
  );
}
