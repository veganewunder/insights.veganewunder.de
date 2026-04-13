import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, validateAdminCredentials } from "@/lib/auth/admin";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return NextResponse.json({ message: "E Mail und Passwort sind erforderlich" }, { status: 400 });
    }

    if (!validateAdminCredentials(body.email, body.password)) {
      return NextResponse.json({ message: "Login fehlgeschlagen" }, { status: 401 });
    }

    await createAdminSession(body.email);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login fehlgeschlagen";
    return NextResponse.json({ message }, { status: 500 });
  }
}
