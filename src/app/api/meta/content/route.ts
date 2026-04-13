import { NextRequest, NextResponse } from "next/server";
import { fetchMetaRecentContent, MetaContentError } from "@/lib/meta/content";

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 6;
    const items = await fetchMetaRecentContent(Number.isFinite(limit) ? limit : 6);

    return NextResponse.json({
      items,
    });
  } catch (error) {
    if (error instanceof MetaContentError) {
      return NextResponse.json(
        {
          message: error.message,
        },
        { status: error.status },
      );
    }

    console.error("meta_content_route_error", error);

    return NextResponse.json(
      {
        message: "Meta Content konnte nicht geladen werden",
      },
      { status: 500 },
    );
  }
}
