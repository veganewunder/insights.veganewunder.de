import { NextRequest, NextResponse } from "next/server";
import { insertManualStoryIds, getStoredStories, getFirstAccountId } from "@/lib/data/story-archive";

export async function GET() {
  try {
    const accountId = await getFirstAccountId();
    if (!accountId) return NextResponse.json({ stories: [] });
    const stories = await getStoredStories(accountId);
    return NextResponse.json({ stories });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Fehler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { storyIds: string[] };
    if (!Array.isArray(body.storyIds) || body.storyIds.length === 0) {
      return NextResponse.json({ message: "Keine Story IDs übergeben" }, { status: 400 });
    }

    const accountId = await getFirstAccountId();
    if (!accountId) return NextResponse.json({ message: "Kein Account gefunden" }, { status: 404 });

    const count = await insertManualStoryIds(accountId, body.storyIds);
    return NextResponse.json({ inserted: count });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Fehler" }, { status: 500 });
  }
}
