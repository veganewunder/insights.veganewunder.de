import { NextRequest, NextResponse } from "next/server";
import { createShareLink, getFirstClientId } from "@/lib/data/share-links";
import { syncLiveDashboardToSupabase } from "@/lib/data/dashboard-store";
import { sanitizeShareVisibility } from "@/lib/share-visibility";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      clientId?: string;
      visibleSections?: unknown;
      linkName?: string | null;
      recipientName?: string | null;
    };
    const clientId = body.clientId ?? await getFirstClientId();

    if (!clientId) {
      return NextResponse.json({ message: "Kein Client gefunden" }, { status: 404 });
    }

    await syncLiveDashboardToSupabase().catch((error) => {
      console.warn(
        "share_link_sync_warning",
        error instanceof Error ? error.message : "Unbekannter Sync-Fehler",
      );
    });

    const link = await createShareLink(
      clientId,
      body.linkName ?? null,
      body.recipientName ?? null,
      sanitizeShareVisibility(body.visibleSections),
    );
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fehler beim Erstellen";
    return NextResponse.json({ message }, { status: 500 });
  }
}
