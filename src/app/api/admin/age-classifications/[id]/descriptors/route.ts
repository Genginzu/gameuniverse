import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { adminDescriptorFormSchema } from "@/lib/validations/admin-descriptor-form";
import { logger } from "@/lib/logger";
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";

    const supabase = await createRouteHandlerClient();

    // Verify the parent rating system exists
    const { data: system, error: systemError } = await supabase
      .from("rating_systems")
      .select("id")
      .eq("id", id)
      .single();

    if (systemError || !system) {
      return NextResponse.json({ error: "Rating system not found" }, { status: 404 });
    }

    // Fetch descriptors with translations
    const { data: descriptorsRaw, error } = await supabase
      .from("content_descriptors")
      .select(
        "id, rating_system_id, code, icon_url, content_descriptor_translations(content_descriptor_id, language_code, name, description)"
      )
      .eq("rating_system_id", id);

    if (error) {
      logger.error("Error fetching descriptors", { error });
      return NextResponse.json({ error: "Failed to fetch descriptors" }, { status: 500 });
    }

    type DescriptorRow = {
      id: string;
      rating_system_id: string;
      code: string;
      icon_url: string | null;
      content_descriptor_translations: {
        content_descriptor_id: string;
        language_code: string;
        name: string;
        description: string | null;
      }[];
    };

    const typedDescriptors = (descriptorsRaw || []) as DescriptorRow[];

    // Filter by search term (code or translated name, case-insensitive)
    let filtered = typedDescriptors;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = typedDescriptors.filter((d) => {
        if (d.code.toLowerCase().includes(term)) return true;
        return d.content_descriptor_translations.some((t) => t.name.toLowerCase().includes(term));
      });
    }

    // Count game associations per descriptor
    const descriptorIds = filtered.map((d) => d.id);
    let gameCounts: Record<string, number> = {};

    if (descriptorIds.length > 0) {
      const { data: gameDescriptors } = await supabase
        .from("game_rating_descriptors")
        .select("content_descriptor_id")
        .in("content_descriptor_id", descriptorIds);

      gameCounts = (gameDescriptors || []).reduce(
        (acc, gd) => {
          acc[gd.content_descriptor_id] = (acc[gd.content_descriptor_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }

    const descriptors = filtered.map((d) => ({
      id: d.id,
      rating_system_id: d.rating_system_id,
      code: d.code,
      icon_url: d.icon_url,
      translations: d.content_descriptor_translations.map((t) => ({
        language_code: t.language_code,
        name: t.name,
        description: t.description || "",
      })),
      gameCount: gameCounts[d.id] || 0,
    }));

    return NextResponse.json({ descriptors });
  } catch (error) {
    logger.error("Error in admin descriptors GET", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/age-classifications/[id]/descriptors
 * Create a new content descriptor with translations
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();

    const validationResult = adminDescriptorFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { code, icon_url, translations } = validationResult.data;

    const supabase = await createRouteHandlerClient();

    // Verify the parent rating system exists
    const { data: system, error: systemError } = await supabase
      .from("rating_systems")
      .select("id")
      .eq("id", id)
      .single();

    if (systemError || !system) {
      return NextResponse.json({ error: "Rating system not found" }, { status: 404 });
    }

    // Check for duplicate code within the same system
    const { data: duplicate } = await supabase
      .from("content_descriptors")
      .select("id")
      .eq("rating_system_id", id)
      .eq("code", code)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        { error: "A content descriptor with this code already exists in this system" },
        { status: 409 }
      );
    }

    // Create the descriptor
    const { data: descriptor, error: createError } = await supabase
      .from("content_descriptors")
      .insert({ rating_system_id: id, code, icon_url: icon_url || null })
      .select("id, rating_system_id, code, icon_url")
      .single();

    if (createError || !descriptor) {
      logger.error("Error creating descriptor", { error: createError });
      return NextResponse.json({ error: "Failed to create descriptor" }, { status: 500 });
    }

    // Insert translations
    const translationRows = translations.map((t) => ({
      content_descriptor_id: descriptor.id,
      language_code: t.language_code,
      name: t.name,
      description: t.description || null,
    }));

    const { error: translationError } = await supabase
      .from("content_descriptor_translations")
      .insert(translationRows);

    if (translationError) {
      logger.error("Error creating descriptor translations", { error: translationError });
      // Clean up the descriptor if translations fail
      await supabase.from("content_descriptors").delete().eq("id", descriptor.id);
      return NextResponse.json(
        { error: "Failed to create descriptor translations" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        descriptor: {
          id: descriptor.id,
          rating_system_id: descriptor.rating_system_id,
          code: descriptor.code,
          icon_url: descriptor.icon_url,
          translations: translations.map((t) => ({
            language_code: t.language_code,
            name: t.name,
            description: t.description || "",
          })),
          gameCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error in admin descriptors POST", { error });

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
