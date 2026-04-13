import { NextResponse } from "next/server";
import { buildMetaOAuthUrl, MetaOAuthConfigError } from "@/lib/meta/client";
import { getMetaOAuthEnv, logMetaEnvPresence } from "@/lib/env";

export async function GET() {
  try {
    logMetaEnvPresence("meta_connect_env_check");
    console.log("meta_connect_redirect_uri", {
      redirectUri: getMetaOAuthEnv().redirectUri,
    });
    const connectUrl = buildMetaOAuthUrl();

    return NextResponse.redirect(connectUrl);
  } catch (error) {
    if (error instanceof MetaOAuthConfigError) {
      return NextResponse.json(
        {
          message: error.message,
        },
        { status: error.status },
      );
    }

    console.error("meta_connect_route_error", error);

    return NextResponse.json(
      {
        message: "Meta OAuth URL konnte nicht erstellt werden",
      },
      { status: 500 },
    );
  }
}
