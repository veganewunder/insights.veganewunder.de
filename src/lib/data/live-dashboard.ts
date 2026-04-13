import { fetchMetaPagesWithInstagramAccounts } from "@/lib/meta/account";
import { fetchMetaAudienceSummary } from "@/lib/meta/audience";
import { fetchMetaRecentContent, fetchMetaRecentStories } from "@/lib/meta/content";
import { buildContentInsights, getDefaultContentSlice } from "@/lib/insights/content-insights";
import {
  fetchMetaInsightsForWindow,
  transformMetaInsightsWindow,
} from "@/lib/meta/insights";
import { comparePercent, formatCompactNumber, formatPercent } from "@/lib/insights/comparisons";
import { getMetricLabel } from "@/lib/insights/metric-labels";
import {
  AudienceBreakdownItem,
  ClientDashboardRecord,
  KpiCardRecord,
} from "@/types/insights";

const LIVE_SHARE_TOKEN = "live-meta";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildKpiCard(
  key: KpiCardRecord["key"],
  value: number,
  previousValue: number | null,
): KpiCardRecord {
  const hasPrevious = previousValue !== null && previousValue > 0;
  const changePercent = hasPrevious ? comparePercent(value, previousValue) : 0;

  return {
    key,
    label: getMetricLabel(key),
    value,
    previousValue: previousValue ?? 0,
    displayValue: formatCompactNumber(value),
    changePercent,
    changeLabel: hasPrevious ? formatPercent(changePercent) : "Noch nicht verfuegbar",
    platformAvailabilityLabel: "Verfuegbar fuer Instagram",
  };
}

const emptyAudience: {
  countries: AudienceBreakdownItem[];
  cities: AudienceBreakdownItem[];
  ageGroups: AudienceBreakdownItem[];
  gender: AudienceBreakdownItem[];
} = {
  countries: [],
  cities: [],
  ageGroups: [],
  gender: [],
};

export async function getLiveDashboardClient(): Promise<ClientDashboardRecord> {
  const [accountPages, last7Response, previous7Response, last30Response, previous30Response, recentContent, recentStories, audienceSummary] =
    await Promise.all([
      fetchMetaPagesWithInstagramAccounts(),
      fetchMetaInsightsForWindow(7),
      fetchMetaInsightsForWindow(7, 7),
      fetchMetaInsightsForWindow(30),
      fetchMetaInsightsForWindow(30, 30),
      fetchMetaRecentContent(30),
      fetchMetaRecentStories(12).catch(() => []),
      fetchMetaAudienceSummary().catch(() => emptyAudience),
    ]);

  const configuredInstagramId = process.env.META_INSTAGRAM_ACCOUNT_ID;
  const matchedPage =
    accountPages.find(
      (page) => page.instagramBusinessAccountId === configuredInstagramId,
    ) ?? accountPages.find((page) => page.hasInstagramBusinessAccount);

  const clientName = matchedPage?.pageName ?? "Instagram Business Account";
  const slug = slugify(clientName) || "instagram-business-account";

  const last7 = transformMetaInsightsWindow(last7Response);
  const previous7 = transformMetaInsightsWindow(previous7Response);
  const last30 = transformMetaInsightsWindow(last30Response);
  const previous30 = transformMetaInsightsWindow(previous30Response);
  const allContent = [...recentContent, ...recentStories];
  const contentInsights = buildContentInsights(allContent);
  const defaultLast7Slice = getDefaultContentSlice(contentInsights, "7d");
  const defaultLast30Slice = getDefaultContentSlice(contentInsights, "30d");
  const posts = recentContent.filter((item) => item.contentType === "posts");
  const reels = recentContent.filter((item) => item.contentType === "reels");

  return {
    id: "live-meta-client",
    slug,
    name: clientName,
    notes: "Live Daten aus dem verbundenen Instagram Business Account",
    accountSummary: `Instagram Business Account ${configuredInstagramId ?? ""}`.trim(),
    igUsername: "",
    shareToken: LIVE_SHARE_TOKEN,
    shareExpiresLabel: "Unbegrenzt",
    lastSyncedAt: new Date(),
    platforms: ["instagram"],
    metrics: {
      "7d": [
        buildKpiCard("reach", last7.reach, previous7.reach),
        buildKpiCard("impressions", last7.impressions, previous7.impressions),
        buildKpiCard("profile_views", last7.profile_views, previous7.profile_views),
      ],
      "30d": [
        buildKpiCard("reach", last30.reach, previous30.reach),
        buildKpiCard("impressions", last30.impressions, previous30.impressions),
        buildKpiCard("profile_views", last30.profile_views, previous30.profile_views),
      ],
    },
    audience: {
      "7d": audienceSummary,
      "30d": audienceSummary,
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
      stories: recentStories,
    },
  };
}

export async function getLiveClientBySlug(slug: string) {
  const client = await getLiveDashboardClient();
  return client.slug === slug ? client : null;
}

export async function getLiveClientByShareToken(token: string) {
  const client = await getLiveDashboardClient();
  return client.shareToken === token ? client : null;
}

export async function fetchLiveDashboardClient() {
  return getLiveDashboardClient();
}
