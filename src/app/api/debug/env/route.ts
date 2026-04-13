import { NextResponse } from "next/server";
import { getMetaEnvPresence } from "@/lib/env";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        message: "Nicht verfuegbar",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(getMetaEnvPresence());
}
