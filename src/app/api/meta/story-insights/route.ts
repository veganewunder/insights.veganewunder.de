import { NextRequest, NextResponse } from "next/server";
import { fetchStoryInsights } from "@/lib/meta/story-insights";
import { MetaContentError } from "@/lib/meta/content";

export async function GET(request: NextRequest) {
  const mediaId = request.nextUrl.searchParams.get("id");

  if (!mediaId) {
    return NextResponse.json({ message: "Keine Story ID angegeben" }, { status: 400 });
  }

  try {
    const insights = await fetchStoryInsights(mediaId);
    return NextResponse.json(insights);
  } catch (error) {
    if (error instanceof MetaContentError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("story_insights_route_error", error);
    return NextResponse.json(
      { message: "Story Insights konnten nicht geladen werden" },
      { status: 500 },
    );
  }
}
