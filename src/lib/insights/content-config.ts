import { ContentType, MetricKey } from "@/types/insights";

export const CONTENT_TYPE_ORDER: ContentType[] = ["reels", "posts", "stories"];
export const DEFAULT_CONTENT_TYPE: ContentType = "reels";

export const CONTENT_TYPE_CONFIG: Record<
  ContentType,
  {
    label: string;
    description: string;
    emptyState: string;
    sectionTitle: string;
    sectionDescription: string;
    primaryMetric: MetricKey;
    secondaryMetric: MetricKey;
    kpiMetrics: MetricKey[];
  }
> = {
  reels: {
    label: "Reels",
    description: "Kurzvideos mit Fokus auf Views und Interaktionen",
    emptyState: "Keine Reels im gewählten Zeitraum verfügbar.",
    sectionTitle: "Reel Performance",
    sectionDescription: "Alle KPI Karten, Verläufe und Inhalte basieren auf Reels.",
    primaryMetric: "views",
    secondaryMetric: "interactions",
    kpiMetrics: ["reach", "impressions", "views", "likes", "comments", "shares", "saves"],
  },
  posts: {
    label: "Posts",
    description: "Feed Beiträge mit Reichweite und Interaktionen",
    emptyState: "Keine Posts im gewählten Zeitraum verfügbar.",
    sectionTitle: "Post Performance",
    sectionDescription: "Alle KPI Karten, Verläufe und Inhalte basieren auf Posts.",
    primaryMetric: "reach",
    secondaryMetric: "interactions",
    kpiMetrics: ["reach", "impressions", "likes", "comments", "shares", "saves"],
  },
  stories: {
    label: "Stories",
    description: "Kurzfristige Story Ausspielung mit Navigation und Replies",
    emptyState: "Keine Stories im gewählten Zeitraum verfügbar.",
    sectionTitle: "Story Performance",
    sectionDescription: "Alle KPI Karten, Verläufe und Inhalte basieren auf Stories.",
    primaryMetric: "reach",
    secondaryMetric: "replies",
    kpiMetrics: ["reach", "impressions", "replies", "exits", "taps_forward", "taps_back"],
  },
};

export function isContentType(value: string | undefined): value is ContentType {
  return value === "reels" || value === "posts" || value === "stories";
}

