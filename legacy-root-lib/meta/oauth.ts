const META_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_manage_insights",
  "business_management",
];

export function buildMetaOAuthUrl() {
  const appId = process.env.META_APP_ID ?? "meta-app-id";
  const redirectUri = process.env.META_REDIRECT_URI ?? "http://localhost:3000/api/meta/callback";
  const baseUrl = "https://www.facebook.com/v22.0/dialog/oauth";

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: META_OAUTH_SCOPES.join(","),
    response_type: "code",
  });

  return `${baseUrl}?${params.toString()}`;
}
