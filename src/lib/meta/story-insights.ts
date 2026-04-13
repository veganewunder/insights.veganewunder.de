import { createHmac } from "node:crypto";
import { getMetaContentEnv, EnvConfigError } from "@/lib/env";
import { MetaContentError } from "@/lib/meta/content";

const META_GRAPH_VERSION = "v22.0";

export type StoryInsightsData = {
  mediaId: string;
  mediaUrl: string | null;
  publishedAt: string | null;
  caption: string | null;
  // Übersicht
  views: number;
  reach: number;
  totalInteractions: number;
  profileActivity: number;
  // Interaktionen
  replies: number;
  shares: number;
  // Navigation breakdown
  navigationTotal: number;
  tapForward: number;
  tapBack: number;
  tapExit: number;
  swipeForward: number;
  // Profilaktivitäten breakdown
  profileVisits: number;
  bioLinkClicked: number;
  follows: number;
};

type MetaInsightValue = {
  value: number;
  end_time?: string;
};

type MetaBreakdownResult = {
  dimension_values: string[];
  value: number;
};

type MetaInsightMetric = {
  name: string;
  period: string;
  values?: MetaInsightValue[];
  value?: number;
  total_value?: {
    value: number;
    breakdowns?: Array<{
      dimension_keys: string[];
      results: MetaBreakdownResult[];
    }>;
  };
};

type MetaInsightsResponse = {
  data?: MetaInsightMetric[];
  error?: { message?: string; type?: string; code?: number };
};

type MetaMediaDetailResponse = {
  id?: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp?: string;
  caption?: string;
  media_type?: string;
  error?: { message?: string };
};

function createAppSecretProof(accessToken: string, appSecret?: string) {
  if (!appSecret) return null;
  return createHmac("sha256", appSecret).update(accessToken).digest("hex");
}

function getRequiredEnv() {
  try {
    return getMetaContentEnv();
  } catch (error) {
    if (error instanceof EnvConfigError) {
      throw new MetaContentError(error.message, error.status);
    }
    throw error;
  }
}

function extractMetricValue(data: MetaInsightMetric[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const metric of data) {
    if (metric.value !== undefined) {
      result[metric.name] = metric.value;
    } else if (metric.values && metric.values.length > 0) {
      result[metric.name] = metric.values[0].value ?? 0;
    } else {
      result[metric.name] = 0;
    }
  }
  return result;
}

function extractBreakdown(data: MetaInsightMetric[], metricName: string): Record<string, number> {
  const metric = data.find((m) => m.name === metricName);
  if (!metric?.total_value?.breakdowns?.[0]?.results) return {};
  const result: Record<string, number> = {};
  for (const r of metric.total_value.breakdowns[0].results) {
    const key = r.dimension_values[0];
    if (key) result[key] = r.value;
  }
  return result;
}

export async function fetchStoryInsights(mediaId: string): Promise<StoryInsightsData> {
  const { accessToken, appSecret } = getRequiredEnv();
  const appSecretProof = createAppSecretProof(accessToken, appSecret);

  const buildParams = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ access_token: accessToken, ...extra });
    if (appSecretProof) p.set("appsecret_proof", appSecretProof);
    return p;
  };

  const base = `https://graph.facebook.com/${META_GRAPH_VERSION}/${mediaId}`;
  const opts = { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" } as const;

  const [mainRes, navRes, profileRes, mediaRes] = await Promise.all([
    fetch(`${base}/insights?${buildParams({ metric: "views,reach,replies,total_interactions,shares,profile_visits,profile_activity,follows" })}`, opts),
    fetch(`${base}/insights?${buildParams({ metric: "navigation", breakdown: "story_navigation_action_type" })}`, opts),
    fetch(`${base}/insights?${buildParams({ metric: "profile_activity", breakdown: "action_type" })}`, opts),
    fetch(`${base}?${buildParams({ fields: "id,media_url,thumbnail_url,timestamp,caption,media_type" })}`, opts),
  ]);

  const mainPayload = (await mainRes.json()) as MetaInsightsResponse;
  const navPayload = navRes.ok ? ((await navRes.json()) as MetaInsightsResponse) : { data: [] };
  const profilePayload = profileRes.ok ? ((await profileRes.json()) as MetaInsightsResponse) : { data: [] };
  const mediaPayload = (await mediaRes.json()) as MetaMediaDetailResponse;

  if (!mainRes.ok) {
    throw new MetaContentError(
      mainPayload.error?.message ?? "Story Insights konnten nicht geladen werden",
      mainRes.status,
    );
  }

  const metrics = extractMetricValue(mainPayload.data ?? []);
  const navBreakdown = extractBreakdown(navPayload.data ?? [], "navigation");
  const profileBreakdown = extractBreakdown(profilePayload.data ?? [], "profile_activity");

  const navTotal =
    navPayload.data?.[0]?.total_value?.value ??
    navPayload.data?.[0]?.values?.[0]?.value ?? 0;

  const mediaUrl =
    mediaPayload.media_type === "VIDEO"
      ? (mediaPayload.thumbnail_url ?? mediaPayload.media_url ?? null)
      : (mediaPayload.media_url ?? mediaPayload.thumbnail_url ?? null);

  return {
    mediaId,
    mediaUrl,
    publishedAt: mediaPayload.timestamp ?? null,
    caption: mediaPayload.caption ?? null,
    views: metrics.views ?? 0,
    reach: metrics.reach ?? 0,
    totalInteractions: metrics.total_interactions ?? 0,
    profileActivity: metrics.profile_activity ?? 0,
    replies: metrics.replies ?? 0,
    shares: metrics.shares ?? 0,
    navigationTotal: navTotal,
    tapForward: navBreakdown.tap_forward ?? 0,
    tapBack: navBreakdown.tap_back ?? 0,
    tapExit: navBreakdown.tap_exit ?? 0,
    swipeForward: navBreakdown.swipe_forward ?? 0,
    profileVisits: metrics.profile_visits ?? 0,
    bioLinkClicked: profileBreakdown.bio_link_clicked ?? 0,
    follows: metrics.follows ?? 0,
  };
}
