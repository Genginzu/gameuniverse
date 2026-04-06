"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLoadingFallback } from "@/components/auth/AuthLoadingFallback";
import { AuthLayout } from "@/components/auth/AuthLayout";

function AuthContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "signup" || modeParam === "signin") {
      setMode(modeParam);
    }
  }, [searchParams]);

  return (
    <AuthLayout>
      <AuthForm mode={mode} onModeChange={setMode} />
    </AuthLayout>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <AuthContent />
    </Suspense>
  );
}
