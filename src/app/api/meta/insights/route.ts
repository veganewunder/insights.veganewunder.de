import { NextResponse } from "next/server";
import {
  buildMetaInsightsWindowDebug,
  fetchMetaInsightsByWindows,
  MetaInsightsError,
  transformMetaInsightsWindows,
} from "@/lib/meta/insights";

export async function GET() {
  try {
    const rawInsights = await fetchMetaInsightsByWindows();
    const summary = transformMetaInsightsWindows(rawInsights);

    return NextResponse.json({
      ...summary,
      debug:
        process.env.NODE_ENV === "development"
          ? buildMetaInsightsWindowDebug(rawInsights)
          : undefined,
    });
  } catch (error) {
    if (error instanceof MetaInsightsError) {
      return NextResponse.json(
        {
          message: error.message,
        },
        { status: error.status },
      );
    }

    console.error("meta_insights_route_error", error);

    return NextResponse.json(
      {
        message: "Meta Insights konnten nicht geladen werden",
      },
      { status: 500 },
    );
  }
}
