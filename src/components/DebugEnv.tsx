"use client";

import { useEffect, useState } from "react";

export function DebugEnv() {
  const [envVars, setEnvVars] = useState<{ url?: string; key?: string }>({});

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setEnvVars({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20),
      });
    }
  }, []);

  if (process.env.NODE_ENV !== "development" || !envVars.url) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md rounded bg-black p-4 text-xs text-white">
      <h3 className="mb-2 font-bold">Debug Environment Variables:</h3>
      <div>
        <strong>SUPABASE_URL:</strong> {envVars.url}
      </div>
      <div>
        <strong>SUPABASE_ANON_KEY:</strong> {envVars.key}...
      </div>
    </div>
  );
}
