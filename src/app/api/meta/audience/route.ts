import { NextResponse } from "next/server";
import { fetchMetaAudienceSummary, MetaAudienceError } from "@/lib/meta/audience";

export async function GET() {
  try {
    const audience = await fetchMetaAudienceSummary();

    return NextResponse.json(audience);
  } catch (error) {
    if (error instanceof MetaAudienceError) {
      return NextResponse.json(
        {
          message: error.message,
        },
        { status: error.status },
      );
    }

    console.error("meta_audience_route_error", error);

    return NextResponse.json(
      {
        message: "Meta Audience Daten konnten nicht geladen werden",
      },
      { status: 500 },
    );
  }
}
