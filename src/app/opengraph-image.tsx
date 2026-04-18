import { ImageResponse } from "next/og";

export const alt = "Gamers Universe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
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
          background: "linear-gradient(90deg, rgb(6, 182, 212), rgb(139, 92, 246))",
          backgroundClip: "text",
          color: "transparent",
          marginBottom: 20,
        }}
      >
        Gamers Universe
      </div>
      <div style={{ fontSize: 30, color: "#94a3b8" }}>Your gaming universe starts here</div>
    </div>,
    { ...size }
  );
}
