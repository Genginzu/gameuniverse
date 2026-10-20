import { createRouteHandlerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
  const supabase = await createRouteHandlerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
}

export async function PATCH(request: NextRequest) {
  const supabase = await createRouteHandlerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updates = await request.json();

    // Validate allowed fields
    const allowedFields = ["username", "preferred_locale", "stats_private"];
    const filteredUpdates = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj: Record<string, unknown>, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    if ("stats_private" in filteredUpdates && typeof filteredUpdates.stats_private !== "boolean") {
      return NextResponse.json({ error: "stats_private must be a boolean" }, { status: 400 });
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
  } catch (error) {
    logger.error("Profile update error", { error });
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
