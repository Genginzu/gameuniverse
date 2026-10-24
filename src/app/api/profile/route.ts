import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute, validationError } from "@/lib/api/route";
import { logger } from "@/lib/logger";

const profileUpdateSchema = z.looseObject({});

export const GET = defineRoute({ auth: "required" }, async ({ user }) => {
  const supabase = await createRouteHandlerClient();

  // Get user profile from profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    logger.error("Profile fetch error", { error: profileError });
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }

  // Email is no longer stored in profiles (issue #375); surface the caller's own
  // email from auth.users so the account page keeps showing it.
  return NextResponse.json({ user, profile: { ...profile, email: user.email ?? null } });
});

export const PATCH = defineRoute(
  { auth: "required", rateLimit: "profileUpdate", writesContent: true, body: profileUpdateSchema },
  async ({ user, body: updates }) => {
    const supabase = await createRouteHandlerClient();

    // Validate allowed fields
    const allowedFields = ["username", "preferred_locale", "stats_private"];
    const filteredUpdates = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj: Record<string, unknown>, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdates).length === 0) {
      throw validationError(undefined, "No valid fields to update");
    }

    if ("stats_private" in filteredUpdates && typeof filteredUpdates.stats_private !== "boolean") {
      throw validationError(undefined, "stats_private must be a boolean");
    }

    // Add updated_at timestamp
    filteredUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("profiles")
      .update(filteredUpdates as Record<string, never>)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      logger.error("Profile update error", { error });
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json(data);
  }
);
