import { NextRequest, NextResponse } from "next/server";
import { deleteShareLink, setShareLinkActive, updateShareLinkVisibility } from "@/lib/data/share-links";
import { sanitizeShareVisibility } from "@/lib/share-visibility";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json() as { is_active?: boolean; visibleSections?: unknown };

    if (typeof body.is_active === "boolean") {
      await setShareLinkActive(id, body.is_active);
      return NextResponse.json({ ok: true });
    }

    const link = await updateShareLinkVisibility(id, sanitizeShareVisibility(body.visibleSections));
    return NextResponse.json(link);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fehler beim Aktualisieren";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await deleteShareLink(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fehler beim Löschen";
    return NextResponse.json({ message }, { status: 500 });
  }
}
