"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase";
import { useAccountDeletion } from "@/hooks/useAccountDeletion";

/** Pages a deactivated account may still open. */
const ALLOWED_PATHS = ["/account-deletion", "/confidentialite"];

/**
 * A signed-in account in its deletion grace period can only cancel the
 * deletion or sign out: every other page redirects to /account-deletion.
 */
export function AccountDeletionGate() {
  const [hasSession, setHasSession] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { pending } = useAccountDeletion(hasSession);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => setHasSession(Boolean(data.session)));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setHasSession(Boolean(session)));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!pending || ALLOWED_PATHS.some((path) => pathname.startsWith(path))) return;
    router.replace("/account-deletion");
  }, [pending, pathname, router]);

  return null;
}
