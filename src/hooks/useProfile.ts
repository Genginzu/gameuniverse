"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useProfile() {
  const [profileState, setProfileState] = useState<ProfileState>({
    profile: null,
    loading: true,
    error: null,
  });
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setProfileState({
            profile: null,
            loading: false,
            error: "Not authenticated",
          });
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          setProfileState({
            profile: null,
            loading: false,
            error: error.message,
          });
          return;
        }

        setProfileState({
          profile,
          loading: false,
          error: null,
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch profile";
        setProfileState({
          profile: null,
          loading: false,
          error: errorMessage,
        });
      }
    };

    fetchProfile();
  }, [supabase]);

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setProfileState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const updatedProfile = await response.json();

      setProfileState({
        profile: updatedProfile,
        loading: false,
        error: null,
      });

      return updatedProfile;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
      setProfileState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw err;
    }
  };

  const refreshProfile = async () => {
    setProfileState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        throw error;
      }

      setProfileState({
        profile,
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh profile";
      setProfileState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  };

  return {
    ...profileState,
    updateProfile,
    refreshProfile,
  };
}
