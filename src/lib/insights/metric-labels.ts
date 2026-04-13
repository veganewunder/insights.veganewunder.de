import { MetricKey } from "@/types/insights";

const metricLabels: Record<MetricKey, string> = {
  reach: "Reichweite",
  impressions: "Impressionen",
  views: "Views",
  story_views: "Story Views",
  profile_views: "Profilaufrufe",
  clicks: "Link Klicks",
  watch_time: "Watchtime",
  avg_view_duration: "Durchschnittliche View Dauer",
  audience_country: "Top Laender",
  audience_age: "Altersgruppen",
  subscribers: "Abonnenten",
  followers: "Follower",
  engagement_rate: "Engagement Rate",
  likes: "Likes",
  comments: "Kommentare",
  shares: "Shares",
  saves: "Saves",
  replies: "Replies",
  exits: "Exits",
  taps_forward: "Weiter Taps",
  taps_back: "Zurueck Taps",
  interactions: "Interaktionen",
};

export function getMetricLabel(metricKey: MetricKey) {
  return metricLabels[metricKey];
}
