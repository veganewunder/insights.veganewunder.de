import { NextRequest, NextResponse } from "next/server";
import { createShareLink, getFirstClientId } from "@/lib/data/share-links";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { clientId?: string };
    const clientId = body.clientId ?? await getFirstClientId();

    if (!clientId) {
      return NextResponse.json({ message: "Kein Client gefunden" }, { status: 404 });
    }

    const link = await createShareLink(clientId);
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fehler beim Erstellen";
    return NextResponse.json({ message }, { status: 500 });
  }
}
