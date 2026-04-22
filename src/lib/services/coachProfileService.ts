import type { CoachProfile } from "@/types/coaching";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

interface CoachProfileRow {
  id: string;
  player_id: string;
  bio: string | null;
  experience: string | null;
  languages: string[];
  is_active: boolean;
  is_verified: boolean;
  verified_at: string | null;
  average_rating: number;
  total_reviews: number;
  total_sessions: number;
  cancellation_policy: CoachProfile["cancellationPolicy"];
  created_at: string;
}

function mapRow(row: CoachProfileRow): CoachProfile {
  return {
    id: row.id,
    playerId: row.player_id,
    bio: row.bio,
    experience: row.experience,
    languages: row.languages,
    isActive: row.is_active,
    isVerified: row.is_verified,
    verifiedAt: row.verified_at,
    averageRating: row.average_rating,
    totalReviews: row.total_reviews,
    totalSessions: row.total_sessions,
    cancellationPolicy: row.cancellation_policy,
    createdAt: row.created_at,
  };
}

export async function getByPlayerId(
  supabase: SupabaseClient,
  playerId: string
): Promise<CoachProfile | null> {
  const { data, error } = await supabase
    .from("coach_profiles")
    .select("*")
    .eq("player_id", playerId)
    .single();

  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return mapRow(data);
}

export async function create(
  supabase: SupabaseClient,
  playerId: string,
  data: Partial<Pick<CoachProfile, "bio" | "experience" | "languages" | "cancellationPolicy">>
): Promise<CoachProfile> {
  const { data: row, error } = await supabase
    .from("coach_profiles")
    .insert({
      player_id: playerId,
      bio: data.bio ?? null,
      experience: data.experience ?? null,
      languages: data.languages ?? [],
      cancellation_policy: data.cancellationPolicy ?? {
        free_until_hours: 24,
        partial_refund_percentage: 50,
        no_refund_after_hours: 2,
      },
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(row);
}

export async function update(
  supabase: SupabaseClient,
  playerId: string,
  data: Partial<Pick<CoachProfile, "bio" | "experience" | "languages" | "cancellationPolicy">>
): Promise<CoachProfile> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  if (data.bio !== undefined) updates.bio = data.bio;
  if (data.experience !== undefined) updates.experience = data.experience;
  if (data.languages !== undefined) updates.languages = data.languages;
  if (data.cancellationPolicy !== undefined)
    updates.cancellation_policy = data.cancellationPolicy;

  const { data: row, error } = await supabase
    .from("coach_profiles")
    .update(updates)
    .eq("player_id", playerId)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(row);
}

export async function toggleActive(
  supabase: SupabaseClient,
  playerId: string,
  isActive: boolean
): Promise<void> {
  const { error } = await supabase
    .from("coach_profiles")
    .update({ is_active: isActive })
    .eq("player_id", playerId);

  if (error) throw error;
}
