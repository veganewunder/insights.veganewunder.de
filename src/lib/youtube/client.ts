const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

export function buildYouTubeOAuthUrl() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "google-client-id";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/youtube/callback";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_OAUTH_SCOPES.join(" "),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function fetchYouTubeInsights() {
  // Hier spaeter echte Google OAuth Tokens, API Endpunkte und Requests fuer YouTube Data API und Analytics API ergaenzen.
  return { status: "prepared" as const };
}
