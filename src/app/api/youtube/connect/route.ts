import { NextResponse } from "next/server";
import { buildYouTubeOAuthUrl } from "@/lib/youtube/client";

export async function GET() {
  return NextResponse.json({
    status: "prepared",
    provider: "youtube",
    connectUrl: buildYouTubeOAuthUrl(),
    message: "Google OAuth fuer YouTube vorbereitet",
  });
}
