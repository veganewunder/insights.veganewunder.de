import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      {
        status: "error",
        message: "Kein OAuth Code empfangen",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    status: "prepared",
    provider: "youtube",
    message:
      "Google OAuth Callback empfangen. Token Austausch fuer YouTube Data API und Analytics API wird spaeter angebunden.",
    codePreview: `${code.slice(0, 6)}...`,
  });
}
