import { KpiCardRecord, ShareVisibilityKey } from "@/types/insights";

export const DEFAULT_SHARE_VISIBILITY: ShareVisibilityKey[] = [
  "metric_reach",
  "metric_impressions",
  "metric_profile_views",
  "audience_countries",
  "audience_cities",
  "audience_age_groups",
  "audience_gender",
  "timeline",
  "content_performance",
  "media_gallery",
];

const LEGACY_SHARE_VISIBILITY_V1: ShareVisibilityKey[] = [
  "metric_reach",
  "metric_impressions",
  "metric_profile_views",
  "audience_countries",
  "audience_cities",
  "audience_age_groups",
  "timeline",
  "content_performance",
];

const LEGACY_SHARE_VISIBILITY_V2: ShareVisibilityKey[] = [
  "metric_reach",
  "metric_impressions",
  "metric_profile_views",
  "audience_countries",
  "audience_cities",
  "audience_age_groups",
  "timeline",
  "content_performance",
  "media_gallery",
];

export const SHARE_VISIBILITY_OPTIONS: Array<{
  key: ShareVisibilityKey;
  label: string;
  description: string;
}> = [
  { key: "metric_reach", label: "Reichweite", description: "Zeigt die KPI Reichweite." },
  { key: "metric_impressions", label: "Impressionen", description: "Zeigt Impressionen oder Views." },
  { key: "metric_views", label: "Views", description: "Zeigt Video Views." },
  { key: "metric_story_views", label: "Story Views", description: "Zeigt Story Views." },
  { key: "metric_profile_views", label: "Profilaufrufe", description: "Zeigt Profilaufrufe." },
  { key: "metric_clicks", label: "Klicks", description: "Zeigt Link Klicks." },
  { key: "metric_watch_time", label: "Watchtime", description: "Zeigt Watchtime." },
  { key: "metric_avg_view_duration", label: "View Dauer", description: "Zeigt durchschnittliche View Dauer." },
  { key: "audience_countries", label: "Länder", description: "Zeigt Länderverteilung." },
  { key: "audience_cities", label: "Städte", description: "Zeigt Städteverteilung." },
  { key: "audience_age_groups", label: "Altersgruppen", description: "Zeigt Altersgruppen." },
  { key: "audience_gender", label: "Geschlecht", description: "Zeigt Geschlechterverteilung." },
  { key: "timeline", label: "Verlauf", description: "Zeigt Verlauf und Zeitachse." },
  { key: "content_performance", label: "Top Inhalte", description: "Zeigt Content Performance." },
  { key: "media_gallery", label: "Reels und Stories", description: "Zeigt visuelle Reel und Story Karten." },
];

const KPI_TO_VISIBILITY: Partial<Record<KpiCardRecord["key"], ShareVisibilityKey>> = {
  reach: "metric_reach",
  impressions: "metric_impressions",
  views: "metric_views",
  story_views: "metric_story_views",
  profile_views: "metric_profile_views",
  clicks: "metric_clicks",
  watch_time: "metric_watch_time",
  avg_view_duration: "metric_avg_view_duration",
};

export function getVisibilityForMetric(metricKey: KpiCardRecord["key"]) {
  return KPI_TO_VISIBILITY[metricKey] ?? null;
}

export function sanitizeShareVisibility(input: unknown): ShareVisibilityKey[] {
  if (!Array.isArray(input)) {
    return [...DEFAULT_SHARE_VISIBILITY];
  }

  const allowed = new Set(SHARE_VISIBILITY_OPTIONS.map((item) => item.key));
  const filtered = input.filter(
    (item): item is ShareVisibilityKey => typeof item === "string" && allowed.has(item as ShareVisibilityKey),
  );

  if (filtered.length === 0) {
    return [...DEFAULT_SHARE_VISIBILITY];
  }

  const matchesLegacyV1 =
    filtered.length === LEGACY_SHARE_VISIBILITY_V1.length &&
    LEGACY_SHARE_VISIBILITY_V1.every((key) => filtered.includes(key));

  if (matchesLegacyV1) {
    return [...filtered, "audience_gender", "media_gallery"];
  }

  const matchesLegacyV2 =
    filtered.length === LEGACY_SHARE_VISIBILITY_V2.length &&
    LEGACY_SHARE_VISIBILITY_V2.every((key) => filtered.includes(key));

  if (matchesLegacyV2) {
    return [...filtered, "audience_gender"];
  }

  return filtered;
}

export function hasShareAccess(visibleSections: ShareVisibilityKey[], key: ShareVisibilityKey) {
  return visibleSections.includes(key);
}
