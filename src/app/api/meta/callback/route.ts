import { NextRequest, NextResponse } from "next/server";
import { exchangeMetaCodeForAccessToken, MetaCallbackError } from "@/lib/meta/client";
import { getMetaCallbackEnv, logMetaEnvPresence } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    logMetaEnvPresence("meta_callback_env_check");
    console.log("meta_callback_redirect_uri", {
      redirectUri: getMetaCallbackEnv().redirectUri,
    });

    const code = request.nextUrl.searchParams.get("code");
    const error = request.nextUrl.searchParams.get("error");
    const errorReason = request.nextUrl.searchParams.get("error_reason");
    const errorDescription = request.nextUrl.searchParams.get("error_description");

    if (!code) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Kein OAuth Code empfangen. Bitte starte den Flow ueber /api/meta/connect und oeffne nicht direkt die Callback URL.",
          debug:
            process.env.NODE_ENV === "development"
              ? {
                  hasCode: false,
                  error,
                  error_reason: errorReason,
                  error_description: errorDescription,
                }
              : undefined,
        },
        { status: 400 },
      );
    }

    const tokenResponse = await exchangeMetaCodeForAccessToken(code);
    const isDevelopment = process.env.NODE_ENV === "development";

    return NextResponse.json({
      status: "prepared",
      provider: "meta",
      message:
        "Meta OAuth Callback erfolgreich verarbeitet. Access Token erhalten und bereit fuer spaetere Speicherung.",
      accessTokenReceived: Boolean(tokenResponse.accessToken),
      // Das offene Token ist nur fuer lokale Entwicklung gedacht, damit es
      // voruebergehend in .env.local als META_ACCESS_TOKEN uebernommen werden kann.
      accessToken: isDevelopment ? tokenResponse.accessToken : undefined,
      expiresIn: tokenResponse.expiresIn,
      debug:
        isDevelopment
          ? {
              hasCode: true,
              error,
              error_reason: errorReason,
              error_description: errorDescription,
            }
          : undefined,
    });
  } catch (error) {
    if (error instanceof MetaCallbackError || error instanceof Error) {
      const status =
        error instanceof MetaCallbackError
          ? error.status
          : error.name === "EnvConfigError"
            ? 500
            : 500;

      return NextResponse.json(
        {
          message: error.message,
        },
        { status },
      );
    }

    console.error("meta_callback_route_error", error);

    return NextResponse.json(
      {
        message: "Meta OAuth Callback konnte nicht verarbeitet werden",
      },
      { status: 500 },
    );
  }
}
