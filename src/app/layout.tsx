import "./globals.css";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

const SUPPORTED_LOCALES = new Set(["fr", "en"]);

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const headersList = await headers();
  const pathname = headersList.get("x-next-url") ?? headersList.get("x-invoke-path") ?? "";
  const segment = pathname.split("/").filter(Boolean)[0] ?? "fr";
  const locale = SUPPORTED_LOCALES.has(segment) ? segment : "fr";

  return (
    <html lang={locale} suppressHydrationWarning>
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
