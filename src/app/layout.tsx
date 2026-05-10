import "./globals.css";
import { Suspense } from "react";
import { Inter, Tomorrow } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { NavigationProgress } from "@/components/shared/NavigationProgress";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

// Tomorrow font for editorial display titles (refonte editoriale).
// Exposed as CSS variable --font-tomorrow, aliased to --font-display in globals.css @theme.
const tomorrow = Tomorrow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-tomorrow",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gameuniverse.gg"),
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr" className={tomorrow.variable} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {children}
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
