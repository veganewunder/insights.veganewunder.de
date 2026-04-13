import { createHmac } from "node:crypto";
import { EnvConfigError, getMetaContentEnv } from "@/lib/env";
import { MetaContentItem } from "@/types/insights";

const META_GRAPH_VERSION = "v19.0";

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

export class MetaContentError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "MetaContentError";
    this.status = status;
  }
}

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

function mapMediaTypeLabel(mediaType?: string) {
  if (mediaType === "VIDEO") return "Video";
  if (mediaType === "REEL") return "Reel";
  if (mediaType === "CAROUSEL_ALBUM") return "Carousel";
  return "Beitrag";
}

export async function fetchMetaRecentContent(limit = 6): Promise<MetaContentItem[]> {
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

  return items.map((item) => ({
    id: item.id,
    title: truncateCaption(item.caption),
    caption: item.caption ?? null,
    platformLabel: "Instagram",
    mediaTypeLabel: mapMediaTypeLabel(item.media_type),
    mediaUrl: item.media_type === "VIDEO" || item.media_type === "REEL"
      ? item.thumbnail_url ?? item.media_url ?? null
      : item.media_url ?? item.thumbnail_url ?? null,
    permalink: item.permalink ?? null,
    publishedAt: item.timestamp ?? null,
    likeCount: item.like_count ?? 0,
    commentCount: item.comments_count ?? 0,
  }));
}

export async function fetchMetaRecentStories(): Promise<MetaContentItem[]> {
  const { accessToken, instagramAccountId, appSecret } = getRequiredMetaEnv();
  const appSecretProof = createAppSecretProof(accessToken, appSecret);

  const params = new URLSearchParams({
    fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
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

  return items.map((item) => ({
    id: item.id,
    title: truncateCaption(item.caption),
    caption: item.caption ?? null,
    platformLabel: "Instagram",
    mediaTypeLabel: "Story",
    mediaUrl: item.media_type === "VIDEO"
      ? item.thumbnail_url ?? item.media_url ?? null
      : item.media_url ?? item.thumbnail_url ?? null,
    permalink: item.permalink ?? null,
    publishedAt: item.timestamp ?? null,
    likeCount: 0,
    commentCount: 0,
  }));
}
