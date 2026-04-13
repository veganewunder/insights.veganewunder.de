import { EnvConfigError, getMetaCallbackEnv, getMetaOAuthEnv } from "@/lib/env";

const META_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_manage_insights",
  "business_management",
];

export function getMetaOAuthConfig() {
  const { appId, redirectUri } = getMetaOAuthEnv();
  return {
    appId,
    redirectUri,
  };
}

export function buildMetaOAuthUrl() {
  const { appId, redirectUri } = getMetaOAuthConfig();
  const baseUrl = "https://www.facebook.com/v22.0/dialog/oauth";

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: META_OAUTH_SCOPES.join(","),
    response_type: "code",
  });

  return `${baseUrl}?${params.toString()}`;
}

export async function fetchMetaInsights() {
  // Hier spaeter echte API Credentials, Access Tokens und HTTP Requests zur Meta Graph API ergaenzen.
  return { status: "prepared" as const };
}

type MetaTokenExchangeResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

export class MetaCallbackError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "MetaCallbackError";
    this.status = status;
  }
}

export async function exchangeMetaCodeForAccessToken(code: string) {
  const { appId, appSecret, redirectUri } = getMetaCallbackEnv();

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const url = `https://graph.facebook.com/v22.0/oauth/access_token?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as MetaTokenExchangeResponse;

  if (!response.ok || !payload.access_token) {
    const message =
      payload.error?.message ?? "Meta OAuth Token Austausch fehlgeschlagen";
    throw new MetaCallbackError(message, response.status || 500);
  }

  return {
    accessToken: payload.access_token,
    tokenType: payload.token_type ?? "bearer",
    expiresIn: payload.expires_in ?? null,
  };
}

export { EnvConfigError as MetaOAuthConfigError };
