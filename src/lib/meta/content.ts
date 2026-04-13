import { createHmac } from "node:crypto";
import { EnvConfigError, getMetaContentEnv } from "@/lib/env";
import { fetchStoryInsights } from "@/lib/meta/story-insights";
import { MetaContentError } from "@/lib/meta/errors";
import { ContentType, MetaContentItem, MetricKey } from "@/types/insights";

const META_GRAPH_VERSION = "v22.0";

type MetaMediaResponse = {
  data?: Array<{
    id: string;
    caption?: string;
    media_type?: string;
    media_url?: string;
    thumbnail_url?: string;
    permalink?: string;
    timestamp?: string;
    like_count?: number;
    comments_count?: number;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

type MetaInsightResponse = {
  data?: Array<{
    name: string;
    values?: Array<{ value?: number }>;
    total_value?: {
      value?: number;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

function createAppSecretProof(accessToken: string, appSecret?: string) {
  if (!appSecret) {
    return null;
  }

  return createHmac("sha256", appSecret).update(accessToken).digest("hex");
}

function getRequiredMetaEnv() {
  try {
    return getMetaContentEnv();
  } catch (error) {
    if (error instanceof EnvConfigError) {
      throw new MetaContentError(error.message, error.status);
    }

    throw error;
  }
}

function truncateCaption(caption?: string) {
  if (!caption) {
    return "Ohne Caption";
  }

  return caption.length > 120 ? `${caption.slice(0, 117)}...` : caption;
}

function getContentType(mediaType?: string, permalink?: string): ContentType {
  if (mediaType === "REEL") {
    return "reels";
  }
  // In v22, Reels are returned with media_type "VIDEO" — use permalink as fallback
  if (mediaType === "VIDEO" && permalink?.includes("/reel/")) {
    return "reels";
  }
  return "posts";
}

function mapMediaTypeLabel(mediaType?: string, permalink?: string) {
  if (mediaType === "REEL") return "Reel";
  if (mediaType === "VIDEO") return permalink?.includes("/reel/") ? "Reel" : "Video";
  if (mediaType === "CAROUSEL_ALBUM") return "Carousel";
  return "Post";
}

function getContentTypeLabel(contentType: ContentType) {
  if (contentType === "stories") return "Stories";
  if (contentType === "posts") return "Posts";
  return "Reels";
}

function getMetricCandidates(contentType: ContentType): Array<{
  queryMetric: string;
  targetKey: MetricKey;
}> {
  if (contentType === "reels") {
    return [
      { queryMetric: "views", targetKey: "views" },
      { queryMetric: "reach", targetKey: "reach" },
      { queryMetric: "shares", targetKey: "shares" },
      { queryMetric: "saved", targetKey: "saves" },
      { queryMetric: "ig_reels_aggregated_all_plays_count", targetKey: "interactions" },
    ];
  }

  return [
    { queryMetric: "reach", targetKey: "reach" },
    { queryMetric: "shares", targetKey: "shares" },
    { queryMetric: "saved", targetKey: "saves" },
  ];
}

async function fetchInsightMetric(
  mediaId: string,
  queryMetric: string,
  accessToken: string,
  appSecretProof: string | null,
) {
  const params = new URLSearchParams({
    metric: queryMetric,
    access_token: accessToken,
  });

  if (appSecretProof) {
    params.set("appsecret_proof", appSecretProof);
  }

  const response = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${mediaId}/insights?${params.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as MetaInsightResponse;

  if (!response.ok) {
    return null;
  }

  const metric = payload.data?.[0];
  if (!metric) {
    return 0;
  }

  return metric.total_value?.value ?? metric.values?.[0]?.value ?? 0;
}

async function fetchMediaMetrics(
  mediaId: string,
  contentType: ContentType,
  accessToken: string,
  appSecretProof: string | null,
) {
  const metrics: Partial<Record<MetricKey, number>> = {};

  for (const candidate of getMetricCandidates(contentType)) {
    const value = await fetchInsightMetric(
      mediaId,
      candidate.queryMetric,
      accessToken,
      appSecretProof,
    );

    if (typeof value === "number") {
      metrics[candidate.targetKey] = value;
    }
  }

  return metrics;
}

export async function fetchMetaRecentContent(limit = 24): Promise<MetaContentItem[]> {
  const { accessToken, instagramAccountId, appSecret } = getRequiredMetaEnv();
  const appSecretProof = createAppSecretProof(accessToken, appSecret);

  const params = new URLSearchParams({
    fields:
      "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
    limit: String(limit),
    access_token: accessToken,
  });

  if (appSecretProof) {
    params.set("appsecret_proof", appSecretProof);
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${instagramAccountId}/media?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as MetaMediaResponse;

  if (!response.ok) {
    throw new MetaContentError(
      payload.error?.message ?? "Meta Content konnte nicht geladen werden",
      response.status,
    );
  }

  const items = payload.data ?? [];

  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      const contentType = getContentType(item.media_type, item.permalink);
      const mediaMetrics: Partial<Record<MetricKey, number>> = await fetchMediaMetrics(
        item.id,
        contentType,
        accessToken,
        appSecretProof,
      ).catch(() => ({} as Partial<Record<MetricKey, number>>));

      const metrics: Partial<Record<MetricKey, number>> = {
        reach: mediaMetrics.reach ?? 0,
        impressions: mediaMetrics.impressions ?? 0,
        views: mediaMetrics.views ?? 0,
        likes: item.like_count ?? 0,
        comments: item.comments_count ?? 0,
        shares: mediaMetrics.shares ?? 0,
        saves: mediaMetrics.saves ?? 0,
        interactions:
          (item.like_count ?? 0) +
          (item.comments_count ?? 0) +
          (mediaMetrics.shares ?? 0) +
          (mediaMetrics.saves ?? 0),
      };

      return {
        id: item.id,
        contentType,
        contentTypeLabel: getContentTypeLabel(contentType),
        title: truncateCaption(item.caption),
        caption: item.caption ?? null,
        platformLabel: "Instagram",
        mediaTypeLabel: mapMediaTypeLabel(item.media_type, item.permalink),
        mediaUrl:
          item.media_type === "VIDEO" || item.media_type === "REEL"
            ? item.thumbnail_url ?? item.media_url ?? null
            : item.media_url ?? item.thumbnail_url ?? null,
        permalink: item.permalink ?? null,
        publishedAt: item.timestamp ?? null,
        likeCount: item.like_count ?? 0,
        commentCount: item.comments_count ?? 0,
        metrics,
      } satisfies MetaContentItem;
    }),
  );

  return enrichedItems;
}

export async function fetchMetaRecentStories(limit = 12): Promise<MetaContentItem[]> {
  const { accessToken, instagramAccountId, appSecret } = getRequiredMetaEnv();
  const appSecretProof = createAppSecretProof(accessToken, appSecret);

  const params = new URLSearchParams({
    fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
    limit: String(limit),
    access_token: accessToken,
  });

  if (appSecretProof) {
    params.set("appsecret_proof", appSecretProof);
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${instagramAccountId}/stories?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as MetaMediaResponse;

  if (!response.ok) {
    throw new MetaContentError(
      payload.error?.message ?? "Stories konnten nicht geladen werden",
      response.status,
    );
  }

  const items = payload.data ?? [];

  const storyItems = await Promise.all(
    items.map(async (item) => {
      const insights = await fetchStoryInsights(item.id).catch(() => null);

      return {
        id: item.id,
        contentType: "stories",
        contentTypeLabel: getContentTypeLabel("stories"),
        title: truncateCaption(item.caption),
        caption: item.caption ?? null,
        platformLabel: "Instagram",
        mediaTypeLabel: "Story",
        mediaUrl:
          item.media_type === "VIDEO"
            ? item.thumbnail_url ?? item.media_url ?? null
            : item.media_url ?? item.thumbnail_url ?? null,
        permalink: item.permalink ?? null,
        publishedAt: item.timestamp ?? null,
        likeCount: 0,
        commentCount: 0,
        metrics: {
          reach: insights?.reach ?? 0,
          impressions: insights?.views ?? 0,
          replies: insights?.replies ?? 0,
          exits: insights?.tapExit ?? 0,
          taps_forward: insights?.tapForward ?? 0,
          taps_back: insights?.tapBack ?? 0,
          views: insights?.views ?? 0,
          shares: insights?.shares ?? 0,
          interactions: insights?.totalInteractions ?? 0,
        },
      } satisfies MetaContentItem;
    }),
  );

  return storyItems;
}

export { MetaContentError };
