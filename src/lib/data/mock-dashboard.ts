import {
  AudienceBreakdownItem,
  ClientDashboardRecord,
  ContentInsightsRecord,
  ContentPerformanceItem,
  ContentType,
  KpiCardRecord,
  TimelinePoint,
} from "@/types/insights";
import { comparePercent, formatCompactNumber, formatPercent } from "@/lib/insights/comparisons";
import { getMetricLabel } from "@/lib/insights/metric-labels";
import { Platform } from "@/types/platform";

function buildKpi(
  key: KpiCardRecord["key"],
  value: number,
  previous: number,
  platforms: Platform[],
): KpiCardRecord {
  return {
    key,
    label: getMetricLabel(key),
    value,
    previousValue: previous,
    displayValue: formatCompactNumber(value),
    changePercent: comparePercent(value, previous),
    changeLabel: formatPercent(comparePercent(value, previous)),
    platformAvailabilityLabel: `Verfuegbar fuer ${platforms.join(", ")}`,
  };
}

function buildAudience(items: Array<[string, string, number]>): AudienceBreakdownItem[] {
  return items.map(([key, label, value]) => ({ key, label, value }));
}

function buildTimeline(labels: string[], values: number[]): TimelinePoint[] {
  return labels.map((label, index) => ({
    label,
    value: values[index] ?? 0,
    displayValue: formatCompactNumber(values[index] ?? 0),
  }));
}

function buildContent(
  items: Array<{
    id: string;
    title: string;
    platformLabel: string;
    secondaryLabel: string;
    primaryValue: string;
    changeLabel: string;
  }>,
): ContentPerformanceItem[] {
  return items;
}

const timelineLabels7d = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const timelineLabels30d = ["W1", "W2", "W3", "W4"];

function buildEmptyContentInsightsRecord(): ContentInsightsRecord {
  return {
    metrics: [],
    timeline: [],
    content: [],
    media: [],
  };
}

function buildEmptyContentInsights(): ClientDashboardRecord["contentInsights"] {
  const createByType = () =>
    ({
      reels: buildEmptyContentInsightsRecord(),
      posts: buildEmptyContentInsightsRecord(),
      stories: buildEmptyContentInsightsRecord(),
    }) as Record<ContentType, ContentInsightsRecord>;

  return {
    "7d": createByType(),
    "30d": createByType(),
  };
}

export const clients: ClientDashboardRecord[] = [
  {
    id: "client_1",
    slug: "kaufland",
    name: "Kaufland",
    notes: "Retail Kunde mit Meta und YouTube Reporting",
    accountSummary: "Instagram Hauptprofil, Facebook Brand Page, YouTube Kanal",
    igUsername: "kaufland",
    shareToken: "kf93share",
    shareExpiresLabel: "30.06.2026",
    lastSyncedAt: new Date("2026-04-13T10:40:00+02:00"),
    platforms: ["instagram", "facebook", "youtube"],
    metrics: {
      "7d": [
        buildKpi("reach", 184300, 151200, ["instagram", "facebook"]),
        buildKpi("impressions", 514800, 452000, ["instagram", "facebook", "youtube"]),
        buildKpi("views", 262400, 231000, ["youtube"]),
        buildKpi("story_views", 42100, 37600, ["instagram", "facebook"]),
        buildKpi("clicks", 2310, 1980, ["instagram", "facebook"]),
        buildKpi("watch_time", 128400, 109900, ["youtube"]),
      ],
      "30d": [
        buildKpi("reach", 731200, 648900, ["instagram", "facebook"]),
        buildKpi("impressions", 1982000, 1760000, ["instagram", "facebook", "youtube"]),
        buildKpi("views", 1042000, 936000, ["youtube"]),
        buildKpi("story_views", 166200, 149400, ["instagram", "facebook"]),
        buildKpi("clicks", 9010, 8020, ["instagram", "facebook"]),
        buildKpi("watch_time", 511800, 465100, ["youtube"]),
      ],
    },
    audience: {
      "7d": {
        countries: buildAudience([
          ["de", "Deutschland", 57],
          ["at", "Oesterreich", 14],
          ["ch", "Schweiz", 12],
          ["pl", "Polen", 9],
          ["nl", "Niederlande", 8],
        ]),
        cities: buildAudience([
          ["berlin", "Berlin", 18],
          ["hamburg", "Hamburg", 14],
          ["munich", "Munich", 12],
          ["vienna", "Vienna", 10],
          ["cologne", "Cologne", 8],
        ]),
        ageGroups: buildAudience([
          ["18_24", "18 bis 24", 18],
          ["25_34", "25 bis 34", 36],
          ["35_44", "35 bis 44", 24],
          ["45_54", "45 bis 54", 14],
          ["55_plus", "55 plus", 8],
        ]),
        gender: buildAudience([
          ["f", "Frauen", 78],
          ["m", "Männer", 20],
          ["u", "Keine Angabe", 2],
        ]),
      },
      "30d": {
        countries: buildAudience([
          ["de", "Deutschland", 58],
          ["at", "Oesterreich", 13],
          ["ch", "Schweiz", 11],
          ["pl", "Polen", 10],
          ["nl", "Niederlande", 8],
        ]),
        cities: buildAudience([
          ["berlin", "Berlin", 19],
          ["hamburg", "Hamburg", 14],
          ["munich", "Munich", 11],
          ["vienna", "Vienna", 10],
          ["cologne", "Cologne", 8],
        ]),
        ageGroups: buildAudience([
          ["18_24", "18 bis 24", 17],
          ["25_34", "25 bis 34", 37],
          ["35_44", "35 bis 44", 24],
          ["45_54", "45 bis 54", 14],
          ["55_plus", "55 plus", 8],
        ]),
        gender: buildAudience([
          ["f", "Frauen", 78],
          ["m", "Männer", 20],
          ["u", "Keine Angabe", 2],
        ]),
      },
    },
    contentInsights: buildEmptyContentInsights(),
    timeline: {
      "7d": buildTimeline(timelineLabels7d, [29200, 33100, 34700, 36200, 38100, 40300, 44800]),
      "30d": buildTimeline(timelineLabels30d, [231000, 248000, 257000, 306000]),
    },
    contentPerformance: {
      "7d": buildContent([
        {
          id: "ct_1",
          title: "Fruehlingskampagne Reel",
          platformLabel: "Instagram",
          secondaryLabel: "Meiste Reichweite",
          primaryValue: "162.100",
          changeLabel: "+21%",
        },
        {
          id: "ct_2",
          title: "Angebote der Woche",
          platformLabel: "YouTube",
          secondaryLabel: "Meiste Views",
          primaryValue: "94.800",
          changeLabel: "+16%",
        },
      ]),
      "30d": buildContent([
        {
          id: "ct_3",
          title: "Ostermenue Video",
          platformLabel: "YouTube",
          secondaryLabel: "Meiste Watchtime",
          primaryValue: "251.400",
          changeLabel: "+19%",
        },
        {
          id: "ct_4",
          title: "Story Wochenangebote",
          platformLabel: "Instagram",
          secondaryLabel: "Meiste Story Views",
          primaryValue: "66.200",
          changeLabel: "+14%",
        },
      ]),
    },
    mediaGallery: {
      reels: [],
      posts: [],
      stories: [],
    },
  },
  {
    id: "client_2",
    slug: "edeka",
    name: "Edeka",
    notes: "Meta fokussiertes Dashboard fuer Kampagnen und Storys",
    accountSummary: "Instagram Kampagnenprofil, Facebook Community Page",
    igUsername: "edeka",
    shareToken: "ed72share",
    shareExpiresLabel: "15.07.2026",
    lastSyncedAt: new Date("2026-04-13T09:55:00+02:00"),
    platforms: ["instagram", "facebook"],
    metrics: {
      "7d": [
        buildKpi("reach", 91200, 85300, ["instagram", "facebook"]),
        buildKpi("impressions", 244800, 228300, ["instagram", "facebook"]),
        buildKpi("story_views", 29800, 27100, ["instagram", "facebook"]),
        buildKpi("clicks", 1180, 1090, ["instagram", "facebook"]),
      ],
      "30d": [
        buildKpi("reach", 372100, 341000, ["instagram", "facebook"]),
        buildKpi("impressions", 984300, 911200, ["instagram", "facebook"]),
        buildKpi("story_views", 121400, 110300, ["instagram", "facebook"]),
        buildKpi("clicks", 4960, 4540, ["instagram", "facebook"]),
      ],
    },
    audience: {
      "7d": {
        countries: buildAudience([
          ["de", "Deutschland", 63],
          ["at", "Oesterreich", 12],
          ["ch", "Schweiz", 9],
          ["lu", "Luxemburg", 8],
          ["it", "Italien", 8],
        ]),
        cities: buildAudience([
          ["berlin", "Berlin", 16],
          ["frankfurt", "Frankfurt", 14],
          ["hamburg", "Hamburg", 12],
          ["vienna", "Vienna", 9],
          ["zurich", "Zurich", 7],
        ]),
        ageGroups: buildAudience([
          ["18_24", "18 bis 24", 16],
          ["25_34", "25 bis 34", 31],
          ["35_44", "35 bis 44", 29],
          ["45_54", "45 bis 54", 17],
          ["55_plus", "55 plus", 7],
        ]),
        gender: buildAudience([["f", "Frauen", 76], ["m", "Männer", 22], ["u", "Keine Angabe", 2]]),
      },
      "30d": {
        countries: buildAudience([
          ["de", "Deutschland", 62],
          ["at", "Oesterreich", 13],
          ["ch", "Schweiz", 9],
          ["lu", "Luxemburg", 8],
          ["it", "Italien", 8],
        ]),
        cities: buildAudience([
          ["berlin", "Berlin", 15],
          ["frankfurt", "Frankfurt", 14],
          ["hamburg", "Hamburg", 12],
          ["vienna", "Vienna", 10],
          ["zurich", "Zurich", 7],
        ]),
        ageGroups: buildAudience([
          ["18_24", "18 bis 24", 15],
          ["25_34", "25 bis 34", 32],
          ["35_44", "35 bis 44", 29],
          ["45_54", "45 bis 54", 17],
          ["55_plus", "55 plus", 7],
        ]),
        gender: buildAudience([["f", "Frauen", 76], ["m", "Männer", 22], ["u", "Keine Angabe", 2]]),
      },
    },
    contentInsights: buildEmptyContentInsights(),
    timeline: {
      "7d": buildTimeline(timelineLabels7d, [3900, 4050, 4220, 4310, 4470, 4540, 4910]),
      "30d": buildTimeline(timelineLabels30d, [28100, 29400, 30200, 33700]),
    },
    contentPerformance: {
      "7d": buildContent([
        {
          id: "ct_5",
          title: "Story Marktaktion",
          platformLabel: "Instagram",
          secondaryLabel: "Meiste Story Views",
          primaryValue: "12.100",
          changeLabel: "+9%",
        },
        {
          id: "ct_6",
          title: "Saisonaler Rezept Post",
          platformLabel: "Facebook",
          secondaryLabel: "Meiste Impressionen",
          primaryValue: "48.200",
          changeLabel: "+7%",
        },
      ]),
      "30d": buildContent([
        {
          id: "ct_7",
          title: "Fruehlingsaktion Reel",
          platformLabel: "Instagram",
          secondaryLabel: "Meiste Reichweite",
          primaryValue: "91.300",
          changeLabel: "+11%",
        },
        {
          id: "ct_8",
          title: "Community Story Serie",
          platformLabel: "Facebook",
          secondaryLabel: "Meiste Klicks",
          primaryValue: "2.010",
          changeLabel: "+8%",
        },
      ]),
    },
    mediaGallery: {
      reels: [],
      posts: [],
      stories: [],
    },
  },
  {
    id: "client_3",
    slug: "naturata",
    name: "Naturata",
    notes: "YouTube und Meta Mix fuer Brand Awareness und Video Performance",
    accountSummary: "Instagram Brandprofil, YouTube Kanal",
    igUsername: "naturata",
    shareToken: "nt55share",
    shareExpiresLabel: "10.08.2026",
    lastSyncedAt: new Date("2026-04-13T08:45:00+02:00"),
    platforms: ["instagram", "youtube"],
    metrics: {
      "7d": [
        buildKpi("reach", 42800, 39700, ["instagram"]),
        buildKpi("impressions", 133900, 124100, ["instagram", "youtube"]),
        buildKpi("views", 82100, 74800, ["youtube"]),
        buildKpi("clicks", 690, 612, ["instagram"]),
        buildKpi("watch_time", 48100, 44000, ["youtube"]),
        buildKpi("avg_view_duration", 312, 286, ["youtube"]),
      ],
      "30d": [
        buildKpi("reach", 171500, 155100, ["instagram"]),
        buildKpi("impressions", 529100, 483600, ["instagram", "youtube"]),
        buildKpi("views", 324800, 299100, ["youtube"]),
        buildKpi("clicks", 2810, 2520, ["instagram"]),
        buildKpi("watch_time", 182400, 166300, ["youtube"]),
        buildKpi("avg_view_duration", 318, 292, ["youtube"]),
      ],
    },
    audience: {
      "7d": {
        countries: buildAudience([
          ["de", "Deutschland", 54],
          ["at", "Oesterreich", 14],
          ["ch", "Schweiz", 13],
          ["fr", "Frankreich", 10],
          ["nl", "Niederlande", 9],
        ]),
        cities: buildAudience([
          ["berlin", "Berlin", 13],
          ["munich", "Munich", 11],
          ["vienna", "Vienna", 10],
          ["zurich", "Zurich", 9],
          ["paris", "Paris", 7],
        ]),
        ageGroups: buildAudience([
          ["18_24", "18 bis 24", 12],
          ["25_34", "25 bis 34", 34],
          ["35_44", "35 bis 44", 29],
          ["45_54", "45 bis 54", 17],
          ["55_plus", "55 plus", 8],
        ]),
        gender: buildAudience([["f", "Frauen", 74], ["m", "Männer", 24], ["u", "Keine Angabe", 2]]),
      },
      "30d": {
        countries: buildAudience([
          ["de", "Deutschland", 55],
          ["at", "Oesterreich", 13],
          ["ch", "Schweiz", 13],
          ["fr", "Frankreich", 10],
          ["nl", "Niederlande", 9],
        ]),
        cities: buildAudience([
          ["berlin", "Berlin", 13],
          ["munich", "Munich", 11],
          ["vienna", "Vienna", 10],
          ["zurich", "Zurich", 9],
          ["paris", "Paris", 7],
        ]),
        ageGroups: buildAudience([
          ["18_24", "18 bis 24", 12],
          ["25_34", "25 bis 34", 35],
          ["35_44", "35 bis 44", 28],
          ["45_54", "45 bis 54", 17],
          ["55_plus", "55 plus", 8],
        ]),
        gender: buildAudience([["f", "Frauen", 74], ["m", "Männer", 24], ["u", "Keine Angabe", 2]]),
      },
    },
    contentInsights: buildEmptyContentInsights(),
    timeline: {
      "7d": buildTimeline(timelineLabels7d, [9800, 10200, 10800, 11500, 11900, 12700, 13200]),
      "30d": buildTimeline(timelineLabels30d, [74400, 78100, 81200, 91100]),
    },
    contentPerformance: {
      "7d": buildContent([
        {
          id: "ct_9",
          title: "Bio Kueche Video",
          platformLabel: "YouTube",
          secondaryLabel: "Meiste Views",
          primaryValue: "42.300",
          changeLabel: "+13%",
        },
        {
          id: "ct_10",
          title: "Story Produktwelt",
          platformLabel: "Instagram",
          secondaryLabel: "Meiste Klicks",
          primaryValue: "880",
          changeLabel: "+10%",
        },
      ]),
      "30d": buildContent([
        {
          id: "ct_11",
          title: "Brand Story Episode",
          platformLabel: "YouTube",
          secondaryLabel: "Meiste Watchtime",
          primaryValue: "98.400",
          changeLabel: "+15%",
        },
        {
          id: "ct_12",
          title: "Rezeptserie Reel",
          platformLabel: "Instagram",
          secondaryLabel: "Meiste Reichweite",
          primaryValue: "31.200",
          changeLabel: "+9%",
        },
      ]),
    },
    mediaGallery: {
      reels: [],
      posts: [],
      stories: [],
    },
  },
];

export function getClientBySlug(slug: string) {
  return clients.find((client) => client.slug === slug);
}

export function getClientByShareToken(token: string) {
  return clients.find((client) => client.shareToken === token);
}
