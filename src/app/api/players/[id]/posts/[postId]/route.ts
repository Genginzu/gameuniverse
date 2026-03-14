import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { PlayerPostsServerService } from "@/lib/services/playerPostsServerService";
import { logger } from "@/lib/logger";

/**
 * DELETE /api/players/[id]/posts/[postId] — Delete a post.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { postId } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const post = await PlayerPostsServerService.getPost(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.playerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await PlayerPostsServerService.deletePost(postId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("Error in player posts DELETE", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
