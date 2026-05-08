import { NextRequest, NextResponse } from "next/server";
import { getTeamDetail } from "@/lib/services/esportTeamService";
import { logger } from "@/lib/logger";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const teamId = parseInt(id, 10);
    if (isNaN(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const team = await getTeamDetail(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    return NextResponse.json({ team });
  } catch (error) {
    logger.error("Error in esport team detail API", { error });
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}
