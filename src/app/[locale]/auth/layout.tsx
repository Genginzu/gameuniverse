import type { Metadata } from "next";

import { EditorialShell } from "@/components/layout/editorial/EditorialShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shared shell for every /auth route (sign in, sign up, password reset,
 * email confirmation, errors). Mounting it at the layout level keeps the
 * editorial navigation stable when switching between auth screens.
 */
export default function AuthRouteLayout({ children }: { children: React.ReactNode }) {
  return <EditorialShell>{children}</EditorialShell>;
}
