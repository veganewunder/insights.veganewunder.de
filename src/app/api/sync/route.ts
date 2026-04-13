import { NextRequest, NextResponse } from "next/server";
import { syncLiveDashboardToSupabase } from "@/lib/data/dashboard-store";

async function handleSync(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const syncResult = await syncLiveDashboardToSupabase();

    return NextResponse.json({
      status: "success",
      syncedAt: syncResult.syncedAt,
      message: "Serverseitiger Sync erfolgreich gespeichert",
      details: syncResult,
    });
  } catch (error) {
    console.error("sync_route_error", error);

    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Sync konnte nicht gespeichert werden",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}
