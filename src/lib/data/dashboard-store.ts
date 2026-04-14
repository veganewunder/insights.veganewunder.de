import { PostgrestError } from "@supabase/supabase-js";
import { fetchLiveDashboardClient } from "@/lib/data/live-dashboard";
import { comparePercent, formatCompactNumber, formatPercent } from "@/lib/insights/comparisons";
import { buildContentInsights, getDefaultContentSlice } from "@/lib/insights/content-insights";
import { getMetricLabel } from "@/lib/insights/metric-labels";
import { formatDateTime } from "@/lib/insights/formatters";
import { fetchMetaRecentContent, fetchMetaRecentStories } from "@/lib/meta/content";
import { syncActiveStoriesToSupabase } from "@/lib/data/story-archive";
import { isSupabaseServerConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { archiveStoryAssets } from "@/lib/storage/story-assets";
import {
  AudienceBreakdownItem,
  ClientDashboardRecord,
  ContentType,
  DatabaseTables,
  KpiCardRecord,
  MetaContentItem,
  MetricKey,
  RangeKey,
} from "@/types/insights";

type AccountRow = DatabaseTables["accounts"];
type ClientRow = DatabaseTables["clients"];
type SnapshotRow = DatabaseTables["insight_snapshots"];
type AudienceRow = DatabaseTables["audience_breakdowns"];
type ShareLinkRow = DatabaseTables["share_links"];
type ContentRow = DatabaseTables["content_snapshots"];
type MediaRow = DatabaseTables["media_snapshots"];

const LIVE_SHARE_TOKEN = "live-meta";

async function fetchIgUsername(platformAccountId: string): Promise<string> {
  try {
    const token = process.env.META_ACCESS_TOKEN;
    if (!token) return "";
    const res = await fetch(
      `https://graph.facebook.com/v22.0/${platformAccountId}?fields=username&access_token=${token}`,
      { cache: "force-cache" },
    );
    const data = await res.json() as { username?: string };
    return data.username ?? "";
  } catch {
    return "";
  }
}
const METRIC_DISPLAY_ORDER: MetricKey[] = [
  "reach",
  "impressions",
  "views",
  "story_views",
  "profile_views",
  "clicks",
  "watch_time",
  "avg_view_duration",
  "subscribers",
  "followers",
  "engagement_rate",
];

function buildDateRange(periodKey: RangeKey) {
  const days = periodKey === "7d" ? 7 : 30;
  const today = new Date();
  const endDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

function asObject(value: SnapshotRow["value_json"]) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function toNumber(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function buildStoredKpiCard(snapshot: SnapshotRow): KpiCardRecord {
  const value = snapshot.value_numeric ?? 0;
  const meta = asObject(snapshot.value_json);
  const previousValue = toNumber(meta?.previous_value);
  const hasPrevious = previousValue > 0;
  const changePercent = hasPrevious ? comparePercent(value, previousValue) : 0;
  const metricKey = snapshot.metric_key as MetricKey;

  return {
    key: metricKey,
    label: snapshot.metric_label || getMetricLabel(metricKey),
    value,
    previousValue,
    displayValue: formatCompactNumber(value),
    changePercent,
    changeLabel: hasPrevious ? formatPercent(changePercent) : "Noch nicht verfuegbar",
    platformAvailabilityLabel: "Verfuegbar fuer Instagram",
  };
}

function buildContentRows(
  client: ClientDashboardRecord,
  accountId: string,
  fetchedAt: string,
): DatabaseTables["content_snapshots"][] {
  return (["7d", "30d"] as const).flatMap((periodKey) =>
    client.contentPerformance[periodKey].map((item, index) => ({
      id: crypto.randomUUID(),
      account_id: accountId,
      period_key: periodKey,
      content_id: item.id,
      title: item.title,
      platform_label: item.platformLabel,
      secondary_label: item.secondaryLabel,
      primary_value: item.primaryValue,
      change_label: item.changeLabel,
      sort_order: index,
      fetched_at: fetchedAt,
      created_at: fetchedAt,
    })),
  );
}

function stripInvalidUnicode(value: string) {
  let sanitized = "";

  for (let index = 0; index < value.length; index += 1) {
    const current = value.charCodeAt(index);

    if (current >= 0xd800 && current <= 0xdbff) {
      const next = value.charCodeAt(index + 1);

      if (next >= 0xdc00 && next <= 0xdfff) {
        sanitized += value[index] + value[index + 1];
        index += 1;
      }

      continue;
    }

    if (current >= 0xdc00 && current <= 0xdfff) {
      continue;
    }

    sanitized += value[index];
  }

  return sanitized;
}

function normalizeText(value: string | null | undefined, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const sanitized = stripInvalidUnicode(value).replace(/\u0000/g, "").trim();
  return sanitized || fallback;
}

function normalizeNullableText(value: string | null | undefined) {
  const sanitized = normalizeText(value);
  return sanitized || null;
}

function toMediaKind(contentType: ContentType): DatabaseTables["media_snapshots"]["media_kind"] {
  if (contentType === "stories") return "story";
  if (contentType === "posts") return "post";
  return "reel";
}

function buildMediaRows(
  items: MetaContentItem[],
  accountId: string,
  fetchedAt: string,
): DatabaseTables["media_snapshots"][] {
  return items.map((item, index) => ({
      id: crypto.randomUUID(),
      account_id: accountId,
      media_id: item.id,
      media_kind: toMediaKind(item.contentType),
      content_type: item.contentType,
      title: normalizeText(item.title, "Ohne Titel"),
      caption: normalizeText(item.caption),
      platform_label: normalizeText(item.platformLabel, "Instagram"),
      media_type_label: normalizeText(item.mediaTypeLabel, item.contentTypeLabel),
      media_url: normalizeNullableText(item.mediaUrl),
      archived_media_url:
        item.contentType === "stories"
          ? normalizeNullableText(item.archivedMediaUrl)
          : null,
      permalink: normalizeNullableText(item.permalink),
      published_at: item.publishedAt,
      like_count: item.likeCount,
      comment_count: item.commentCount,
      metrics_json: item.metrics,
      sort_order: index,
      fetched_at: fetchedAt,
      created_at: fetchedAt,
    }));
}

function getStoryRetentionThreshold(referenceDateIso: string) {
  const threshold = new Date(referenceDateIso);
  threshold.setUTCDate(threshold.getUTCDate() - 30);
  return threshold.toISOString();
}

function mergeStoryItems(
  retainedStories: MetaContentItem[],
  currentStories: MetaContentItem[],
) {
  const byId = new Map<string, MetaContentItem>();

  for (const story of retainedStories) {
    byId.set(story.id, story);
  }

  for (const story of currentStories) {
    byId.set(story.id, story);
  }

  return [...byId.values()].sort((left, right) => {
    const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
    const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

function buildSnapshotRows(
  client: ClientDashboardRecord,
  accountId: string,
  fetchedAt: string,
): DatabaseTables["insight_snapshots"][] {
  return (["7d", "30d"] as const).flatMap((periodKey) => {
    const { startDate, endDate } = buildDateRange(periodKey);

    return client.metrics[periodKey].map((metric) => ({
      id: crypto.randomUUID(),
      account_id: accountId,
      metric_key: metric.key,
      metric_label: metric.label,
      period_key: periodKey,
      value_numeric: metric.value,
      value_json: JSON.parse(
        JSON.stringify({
          previous_value: metric.previousValue,
        }),
      ),
      start_date: startDate,
      end_date: endDate,
      fetched_at: fetchedAt,
      created_at: fetchedAt,
    }));
  });
}

function buildAudienceRows(
  client: ClientDashboardRecord,
  accountId: string,
  fetchedAt: string,
): DatabaseTables["audience_breakdowns"][] {
  const { startDate, endDate } = buildDateRange("30d");
  const audience = client.audience["30d"];

  const groups: Array<{
    breakdownType: DatabaseTables["audience_breakdowns"]["breakdown_type"];
    items: AudienceBreakdownItem[];
  }> = [
    { breakdownType: "country", items: audience.countries },
    { breakdownType: "city", items: audience.cities },
    { breakdownType: "age", items: audience.ageGroups },
    { breakdownType: "gender", items: audience.gender },
  ];

  return groups.flatMap((group) =>
    group.items.map((item) => ({
      id: crypto.randomUUID(),
      account_id: accountId,
      breakdown_type: group.breakdownType,
      dimension_key: item.key,
      dimension_label: item.label,
      value_numeric: item.value,
      start_date: startDate,
      end_date: endDate,
      fetched_at: fetchedAt,
    })),
  );
}

async function ensureStoredClient(
  client: ClientDashboardRecord,
  instagramAccountId: string,
) {
  const supabase = createSupabaseAdminClient();

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .upsert(
      {
        platform: "instagram",
        account_name: client.name,
        platform_account_id: instagramAccountId,
        external_channel_or_page_id: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "platform_account_id" },
    )
    .select("id, platform, account_name, platform_account_id, external_channel_or_page_id, created_at, updated_at")
    .single();

  if (accountError || !account) {
    throw new Error(accountError?.message ?? "Account konnte nicht gespeichert werden");
  }

  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .upsert(
      {
        slug: client.slug,
        name: client.name,
        notes: client.notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    )
    .select("id, slug, name, notes, created_at, updated_at")
    .single();

  if (clientError || !clientRow) {
    throw new Error(clientError?.message ?? "Client konnte nicht gespeichert werden");
  }

  const { error: linkError } = await supabase.from("client_account_links").upsert(
    {
      client_id: clientRow.id,
      account_id: account.id,
    },
    { onConflict: "client_id,account_id" },
  );

  if (linkError) {
    throw new Error(linkError.message);
  }

  const { error: shareError } = await supabase.from("share_links").upsert(
    {
      client_id: clientRow.id,
      token: client.shareToken || LIVE_SHARE_TOKEN,
      password_hash_nullable: null,
      expires_at_nullable: null,
      is_active: true,
    },
    { onConflict: "token" },
  );

  if (shareError) {
    throw new Error(shareError.message);
  }

  return {
    account,
    client: clientRow,
  };
}

function isMissingTable(error: PostgrestError | null) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

function isMissingColumn(error: PostgrestError | null, column: string) {
  return error?.message?.includes(column) ?? false;
}

async function readStoredClientBaseBySlug(slug: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, slug, name, notes, created_at, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  return data;
}

async function readFirstStoredClientBase() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, slug, name, notes, created_at, updated_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  return data;
}

async function readStoredClientBaseByToken(token: string) {
  const supabase = createSupabaseAdminClient();
  const { data: shareLink, error: shareError } = await supabase
    .from("share_links")
    .select("client_id, token, is_active, expires_at_nullable")
    .eq("token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (shareError) {
    if (isMissingTable(shareError)) {
      return null;
    }

    throw new Error(shareError.message);
  }

  if (!shareLink) {
    return null;
  }

  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .select("id, slug, name, notes, created_at, updated_at")
    .eq("id", shareLink.client_id)
    .maybeSingle();

  if (clientError) {
    throw new Error(clientError.message);
  }

  return clientRow;
}

function resolveStoredContentType(row: MediaRow): ContentType {
  // Stories always win
  if (row.content_type === "stories" || row.media_kind === "story") {
    return "stories";
  }

  // Permalink is the most reliable signal — /reel/ = Reel, regardless of what's stored
  if (row.permalink?.includes("/reel/")) {
    return "reels";
  }

  // media_type_label set during fetch
  if (row.media_type_label === "Reel") {
    return "reels";
  }

  if (row.content_type === "reels" || row.media_kind === "reel") {
    return "reels";
  }

  if (row.media_type_label === "Post" || row.media_type_label === "Carousel" || row.media_type_label === "Video") {
    return "posts";
  }

  if (row.content_type === "posts" || row.media_kind === "post") {
    return "posts";
  }

  return "reels";
}

function toMetaContentItems(rows: MediaRow[], contentType: ContentType) {
  return rows
    .filter((row) => resolveStoredContentType(row) === contentType)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((row) => ({
      id: row.media_id,
      contentType,
      contentTypeLabel:
        contentType === "stories" ? "Stories" : contentType === "posts" ? "Posts" : "Reels",
      title: row.title,
      caption: row.caption,
      platformLabel: row.platform_label,
      mediaTypeLabel: row.media_type_label,
      mediaUrl: row.archived_media_url ?? row.media_url,
      archivedMediaUrl: row.archived_media_url,
      permalink: row.permalink,
      publishedAt: row.published_at,
      likeCount: row.like_count,
      commentCount: row.comment_count,
      metrics: {
        likes: row.like_count,
        comments: row.comment_count,
        ...(row.metrics_json ?? {}),
      },
    }));
}

function toAudienceItems(rows: AudienceRow[], breakdownType: AudienceRow["breakdown_type"]) {
  return rows
    .filter((row) => row.breakdown_type === breakdownType)
    .sort((left, right) => right.value_numeric - left.value_numeric)
    .map((row) => ({
      key: row.dimension_key,
      label: row.dimension_label,
      value: row.value_numeric,
    }));
}

async function hydrateStoredClient(clientRow: ClientRow): Promise<ClientDashboardRecord | null> {
  const supabase = createSupabaseAdminClient();

  const { data: linkRows, error: linkError } = await supabase
    .from("client_account_links")
    .select("account_id")
    .eq("client_id", clientRow.id)
    .limit(1);

  if (linkError) {
    throw new Error(linkError.message);
  }

  const accountId = linkRows?.[0]?.account_id;

  if (!accountId) {
    return null;
  }

  const [
    accountResult,
    snapshotResult,
    audienceResult,
    contentResult,
    mediaResult,
    shareResult,
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, platform, account_name, platform_account_id, external_channel_or_page_id, created_at, updated_at")
      .eq("id", accountId)
      .single(),
    supabase
      .from("insight_snapshots")
      .select("id, account_id, metric_key, metric_label, period_key, value_numeric, value_json, start_date, end_date, fetched_at, created_at")
      .eq("account_id", accountId),
    supabase
      .from("audience_breakdowns")
      .select("id, account_id, breakdown_type, dimension_key, dimension_label, value_numeric, start_date, end_date, fetched_at")
      .eq("account_id", accountId),
    supabase
      .from("content_snapshots")
      .select("*")
      .eq("account_id", accountId),
    supabase
      .from("media_snapshots")
      .select("*")
      .eq("account_id", accountId),
    supabase
      .from("share_links")
      .select("id, client_id, token, password_hash_nullable, expires_at_nullable, is_active, created_at")
      .eq("client_id", clientRow.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (accountResult.error) throw new Error(accountResult.error.message);
  if (snapshotResult.error) throw new Error(snapshotResult.error.message);
  if (audienceResult.error && !isMissingTable(audienceResult.error)) {
    throw new Error(audienceResult.error.message);
  }
  if (contentResult.error && !isMissingTable(contentResult.error)) {
    throw new Error(contentResult.error.message);
  }
  if (mediaResult.error && !isMissingTable(mediaResult.error)) {
    throw new Error(mediaResult.error.message);
  }
  if (shareResult.error && !isMissingTable(shareResult.error)) {
    throw new Error(shareResult.error.message);
  }

  const account = accountResult.data as AccountRow;
  const snapshots = (snapshotResult.data ?? []) as SnapshotRow[];
  const audienceRows = (audienceResult.data ?? []) as AudienceRow[];
  const contentRows = (contentResult.data ?? []) as ContentRow[];
  const mediaRows = (mediaResult.data ?? []) as MediaRow[];
  const shareLink = (shareResult.data ?? null) as ShareLinkRow | null;

  if (!account || snapshots.length === 0) {
    return null;
  }

  const metricsByPeriod: Record<RangeKey, KpiCardRecord[]> = {
    "7d": [],
    "30d": [],
  };

  for (const periodKey of ["7d", "30d"] as const) {
    const periodRows = snapshots.filter((row) => row.period_key === periodKey);
    metricsByPeriod[periodKey] = METRIC_DISPLAY_ORDER
      .map((metricKey) => periodRows.find((row) => row.metric_key === metricKey))
      .filter((row): row is SnapshotRow => Boolean(row))
      .map(buildStoredKpiCard);
  }

  const reels = toMetaContentItems(mediaRows, "reels");
  const posts = toMetaContentItems(mediaRows, "posts");
  const stories = toMetaContentItems(mediaRows, "stories");
  const contentInsights = buildContentInsights([...reels, ...posts, ...stories]);
  const defaultLast7Slice = getDefaultContentSlice(contentInsights, "7d");
  const defaultLast30Slice = getDefaultContentSlice(contentInsights, "30d");

  const fetchedAtCandidates = [
    ...snapshots.map((row) => row.fetched_at),
    ...audienceRows.map((row) => row.fetched_at),
    ...contentRows.map((row) => row.fetched_at),
    ...mediaRows.map((row) => row.fetched_at),
  ]
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  const lastSyncedAt = fetchedAtCandidates.length > 0
    ? new Date(Math.max(...fetchedAtCandidates))
    : new Date();

  const audience = {
    countries: toAudienceItems(audienceRows, "country"),
    cities: toAudienceItems(audienceRows, "city"),
    ageGroups: toAudienceItems(audienceRows, "age"),
    gender: toAudienceItems(audienceRows, "gender"),
  };

  return {
    id: clientRow.id,
    slug: clientRow.slug,
    name: clientRow.name,
    notes: clientRow.notes ?? "",
    accountSummary: `${account.account_name} / Instagram ${account.platform_account_id}`,
    igUsername: await fetchIgUsername(account.platform_account_id),
    shareToken: shareLink?.token ?? LIVE_SHARE_TOKEN,
    shareExpiresLabel: shareLink?.expires_at_nullable
      ? formatDateTime(new Date(shareLink.expires_at_nullable))
      : "Unbegrenzt",
    lastSyncedAt,
    platforms: [account.platform],
    metrics: metricsByPeriod,
    audience: {
      "7d": audience,
      "30d": audience,
    },
    contentInsights,
    timeline: {
      "7d": defaultLast7Slice.timeline,
      "30d": defaultLast30Slice.timeline,
    },
    contentPerformance: {
      "7d": defaultLast7Slice.content,
      "30d": defaultLast30Slice.content,
    },
    mediaGallery: {
      reels,
      posts,
      stories,
    },
  };
}

export async function syncLiveDashboardToSupabase() {
  if (!isSupabaseServerConfigured()) {
    throw new Error("Supabase ist serverseitig noch nicht konfiguriert");
  }

  const client = await fetchLiveDashboardClient();
  const instagramAccountId = process.env.META_INSTAGRAM_ACCOUNT_ID;

  if (!instagramAccountId) {
    throw new Error("META_INSTAGRAM_ACCOUNT_ID fehlt");
  }

  const { account } = await ensureStoredClient(client, instagramAccountId);
  const fetchedAt = new Date().toISOString();
  const supabase = createSupabaseAdminClient();
  const [contentItems, storyItems] = await Promise.all([
    fetchMetaRecentContent(30).catch(() => []),
    fetchMetaRecentStories(12).catch(() => []),
  ]);
  const storyRetentionThreshold = getStoryRetentionThreshold(fetchedAt);
  const retainedStoryResult = await supabase
    .from("media_snapshots")
    .select("*")
    .eq("account_id", account.id)
    .eq("media_kind", "story")
    .gte("published_at", storyRetentionThreshold);

  if (retainedStoryResult.error && !isMissingTable(retainedStoryResult.error)) {
    throw new Error(retainedStoryResult.error.message);
  }

  const retainedStoryRows = (retainedStoryResult.data ?? []) as MediaRow[];
  const retainedStoryItems = toMetaContentItems(retainedStoryRows, "stories");
  const mergedStoryItems = mergeStoryItems(retainedStoryItems, storyItems);
  const retainedStoryCount = retainedStoryItems.length;
  const liveStoryCount = storyItems.length;
  const mergedStoryCount = mergedStoryItems.length;

  const [deleteSnapshots, deleteAudience, deleteContent, deleteMedia] = await Promise.all([
    supabase.from("insight_snapshots").delete().eq("account_id", account.id),
    supabase.from("audience_breakdowns").delete().eq("account_id", account.id),
    supabase.from("content_snapshots").delete().eq("account_id", account.id),
    supabase.from("media_snapshots").delete().eq("account_id", account.id),
  ]);

  for (const result of [deleteSnapshots, deleteAudience, deleteContent, deleteMedia]) {
    if (result.error && !isMissingTable(result.error)) {
      throw new Error(result.error.message);
    }
  }

  const snapshotRows = buildSnapshotRows(client, account.id, fetchedAt);
  const audienceRows = buildAudienceRows(client, account.id, fetchedAt);
  const contentRows = buildContentRows(client, account.id, fetchedAt).map((row) => ({
    ...row,
    title: normalizeText(row.title, "Ohne Titel"),
    platform_label: normalizeText(row.platform_label, "Instagram"),
    secondary_label: normalizeText(row.secondary_label, "Keine Zusatzinfo"),
    primary_value: normalizeText(row.primary_value, "0"),
    change_label: normalizeText(row.change_label, "Keine Veraenderung"),
  }));
  const archivedStoriesResult = await archiveStoryAssets(account.id, mergedStoryItems);
  const mediaRows = buildMediaRows(
    [...contentItems, ...archivedStoriesResult.stories],
    account.id,
    fetchedAt,
  );

  const insertSnapshots = await supabase.from("insight_snapshots").insert(snapshotRows);
  if (insertSnapshots.error) {
    throw new Error(`insight_snapshots: ${insertSnapshots.error.message}`);
  }

  if (audienceRows.length > 0) {
    const insertAudience = await supabase.from("audience_breakdowns").insert(audienceRows);
    if (insertAudience.error) {
      throw new Error(`audience_breakdowns: ${insertAudience.error.message}`);
    }
  }

  if (contentRows.length > 0) {
    const insertContent = await supabase.from("content_snapshots").insert(contentRows);
    if (insertContent.error) {
      console.error("content_snapshots_sync_warning", {
        message: insertContent.error.message,
        code: insertContent.error.code,
        details: insertContent.error.details,
        hint: insertContent.error.hint,
      });
    }
  }

  let mediaInsertFailed = false;

  if (mediaRows.length > 0) {
    const insertMedia = await supabase.from("media_snapshots").insert(mediaRows);
    if (insertMedia.error) {
      if (isMissingColumn(insertMedia.error, "archived_media_url")) {
        const fallbackRows = mediaRows.map(({ archived_media_url, ...row }) => row);
        const fallbackInsert = await supabase.from("media_snapshots").insert(fallbackRows);

        if (!fallbackInsert.error) {
          mediaInsertFailed = false;
        } else {
          mediaInsertFailed = true;
        }
      } else {
        mediaInsertFailed = true;
      }

      if (mediaInsertFailed) {
        console.error("media_snapshots_sync_warning", {
          message: insertMedia.error.message,
          code: insertMedia.error.code,
          details: insertMedia.error.details,
          hint: insertMedia.error.hint,
        });
      }
    }
  }

  const storyArchiveCount = await syncActiveStoriesToSupabase(account.id).catch((error) => {
    console.warn(
      "story_archive_sync_warning",
      error instanceof Error ? error.message : "Unbekannter Fehler",
    );
    return 0;
  });

  return {
    accountId: account.id,
    snapshotCount: snapshotRows.length,
    audienceCount: audienceRows.length,
    contentCount: contentRows.length,
    mediaCount: mediaRows.length,
    storyArchiveCount,
    liveStoryCount,
    retainedStoryCount,
    mergedStoryCount,
    archivedStoryAssetCount: archivedStoriesResult.archivedCount,
    reusedArchivedStoryAssetCount: archivedStoriesResult.reusedArchivedCount,
    syncedAt: fetchedAt,
  };
}

export async function getDashboardClient() {
  if (!isSupabaseServerConfigured()) {
    return fetchLiveDashboardClient();
  }

  const storedClient = await readFirstStoredClientBase();

  if (storedClient) {
    const hydrated = await hydrateStoredClient(storedClient);
    if (hydrated) {
      return hydrated;
    }
  }

  return fetchLiveDashboardClient();
}

export async function getDashboardClientBySlug(slug: string) {
  if (!isSupabaseServerConfigured()) {
    const liveClient = await fetchLiveDashboardClient();
    return liveClient.slug === slug ? liveClient : null;
  }

  const storedClient = await readStoredClientBaseBySlug(slug);

  if (storedClient) {
    const hydrated = await hydrateStoredClient(storedClient);
    if (hydrated) {
      return hydrated;
    }
  }

  const liveClient = await fetchLiveDashboardClient();
  return liveClient.slug === slug ? liveClient : null;
}

export async function getDashboardClientByShareToken(token: string) {
  if (!isSupabaseServerConfigured()) {
    const liveClient = await fetchLiveDashboardClient();
    return liveClient.shareToken === token ? liveClient : null;
  }

  const storedClient = await readStoredClientBaseByToken(token);

  if (storedClient) {
    const hydrated = await hydrateStoredClient(storedClient);
    if (hydrated) {
      return hydrated;
    }
  }

  const liveClient = await fetchLiveDashboardClient();
  return liveClient.shareToken === token ? liveClient : null;
}
