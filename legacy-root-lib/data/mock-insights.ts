import {
  AdminClientRecord,
  ClientDashboardRecord,
  InsightPermissionKey,
  InternalProfile,
} from "@/types/insights";
import { buildMetric, buildStorySeries } from "@/lib/format/kpi";

export const insightPermissionOptions: Array<{
  key: InsightPermissionKey;
  label: string;
  description: string;
}> = [
  {
    key: "reach",
    label: "Reichweite",
    description: "Zeigt KPI-Karten fuer Reichweite",
  },
  {
    key: "impressions",
    label: "Impressionen",
    description: "Zeigt KPI-Karten fuer Impressionen",
  },
  {
    key: "storyViews",
    label: "Story Views",
    description: "Zeigt KPI und Story-Verlauf",
  },
  {
    key: "linkClicks",
    label: "Link-Klicks",
    description: "Zeigt Profil-Link-Taps und Vergleichswerte",
  },
  {
    key: "audienceCountries",
    label: "Top-Laender",
    description: "Zeigt Laenderverteilung der Audience",
  },
  {
    key: "audienceAgeGroups",
    label: "Altersgruppen",
    description: "Zeigt Altersverteilung der Audience",
  },
  {
    key: "topContent",
    label: "Top Content",
    description: "Zeigt die besten Posts oder Story-Elemente",
  },
];

export const clients: ClientDashboardRecord[] = [
  {
    id: "client_1",
    slug: "kaufland",
    name: "Kaufland",
    platform: "Instagram und Facebook",
    accountName: "Kaufland Social DACH",
    sector: "Retail",
    shareToken: "kf9a2p",
    shareExpiresLabel: "30.06.2026",
    lastSyncedAt: new Date("2026-04-13T10:20:00+02:00"),
    visibleInsightKeys: [
      "reach",
      "impressions",
      "storyViews",
      "linkClicks",
      "audienceCountries",
      "audienceAgeGroups",
      "topContent",
    ],
    metrics: {
      "7d": {
        reach: buildMetric("Reichweite", 148210, 18),
        impressions: buildMetric("Impressionen", 429450, 12),
        storyViews: buildMetric("Story Views", 48320, 24),
        linkClicks: buildMetric("Link-Klicks", 1942, 11),
      },
      "30d": {
        reach: buildMetric("Reichweite", 694300, 26),
        impressions: buildMetric("Impressionen", 1512880, 19),
        storyViews: buildMetric("Story Views", 171640, 33),
        linkClicks: buildMetric("Link-Klicks", 8108, 14),
      },
    },
    audience: {
      countries: [
        { key: "de", label: "Deutschland", value: 58 },
        { key: "at", label: "Oesterreich", value: 16 },
        { key: "ch", label: "Schweiz", value: 11 },
        { key: "nl", label: "Niederlande", value: 8 },
        { key: "be", label: "Belgien", value: 7 },
      ],
      ageGroups: [
        { key: "18_24", label: "18 bis 24", value: 22 },
        { key: "25_34", label: "25 bis 34", value: 41 },
        { key: "35_44", label: "35 bis 44", value: 23 },
        { key: "45_54", label: "45 bis 54", value: 10 },
        { key: "55_plus", label: "55 plus", value: 4 },
      ],
    },
    storyTimeline: {
      "7d": buildStorySeries(["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], [5100, 5340, 5460, 5580, 5710, 5890, 6240]),
      "30d": buildStorySeries(
        ["W1", "W2", "W3", "W4"],
        [36480, 37890, 38220, 39050],
      ),
    },
    topContent: [
      { id: "tc_1", title: "Osterkampagne Reel", label: "Meiste Reichweite", value: 162100 },
      { id: "tc_2", title: "Story Wochenangebote", label: "Meiste Story Views", value: 29420 },
    ],
  },
  {
    id: "client_2",
    slug: "edeka",
    name: "Edeka",
    platform: "Instagram",
    accountName: "Edeka Kampagnenprofil",
    sector: "Retail",
    shareToken: "ed3m7x",
    shareExpiresLabel: "15.07.2026",
    lastSyncedAt: new Date("2026-04-13T09:45:00+02:00"),
    visibleInsightKeys: [
      "reach",
      "impressions",
      "linkClicks",
      "audienceCountries",
    ],
    metrics: {
      "7d": {
        reach: buildMetric("Reichweite", 31120, 9),
        impressions: buildMetric("Impressionen", 88420, 7),
        storyViews: buildMetric("Story Views", 9640, -4),
        linkClicks: buildMetric("Link-Klicks", 611, 5),
      },
      "30d": {
        reach: buildMetric("Reichweite", 128920, 13),
        impressions: buildMetric("Impressionen", 358910, 10),
        storyViews: buildMetric("Story Views", 39840, 6),
        linkClicks: buildMetric("Link-Klicks", 2518, 8),
      },
    },
    audience: {
      countries: [
        { key: "de", label: "Deutschland", value: 63 },
        { key: "at", label: "Oesterreich", value: 12 },
        { key: "ch", label: "Schweiz", value: 9 },
        { key: "lu", label: "Luxemburg", value: 8 },
        { key: "it", label: "Italien", value: 8 },
      ],
      ageGroups: [
        { key: "18_24", label: "18 bis 24", value: 14 },
        { key: "25_34", label: "25 bis 34", value: 28 },
        { key: "35_44", label: "35 bis 44", value: 31 },
        { key: "45_54", label: "45 bis 54", value: 19 },
        { key: "55_plus", label: "55 plus", value: 8 },
      ],
    },
    storyTimeline: {
      "7d": buildStorySeries(["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], [1410, 1360, 1520, 1280, 1330, 1250, 1490]),
      "30d": buildStorySeries(
        ["W1", "W2", "W3", "W4"],
        [9650, 9240, 10130, 10820],
      ),
    },
    topContent: [
      { id: "tc_3", title: "Fruehlingsrezept Video", label: "Meiste Impressionen", value: 78200 },
      { id: "tc_4", title: "Story Marktaktion", label: "Meiste Link-Klicks", value: 1210 },
    ],
  },
  {
    id: "client_3",
    slug: "naturata",
    name: "Naturata",
    platform: "Instagram und Facebook",
    accountName: "Naturata Brand Accounts",
    sector: "Bio Lebensmittel",
    shareToken: "nt7p4q",
    shareExpiresLabel: "10.08.2026",
    lastSyncedAt: new Date("2026-04-13T08:55:00+02:00"),
    visibleInsightKeys: [
      "reach",
      "storyViews",
      "linkClicks",
      "audienceAgeGroups",
      "topContent",
    ],
    metrics: {
      "7d": {
        reach: buildMetric("Reichweite", 22640, 7),
        impressions: buildMetric("Impressionen", 64110, 10),
        storyViews: buildMetric("Story Views", 11890, 13),
        linkClicks: buildMetric("Link-Klicks", 488, 4),
      },
      "30d": {
        reach: buildMetric("Reichweite", 91220, 11),
        impressions: buildMetric("Impressionen", 251870, 15),
        storyViews: buildMetric("Story Views", 46380, 18),
        linkClicks: buildMetric("Link-Klicks", 1814, 6),
      },
    },
    audience: {
      countries: [
        { key: "de", label: "Deutschland", value: 54 },
        { key: "at", label: "Oesterreich", value: 14 },
        { key: "ch", label: "Schweiz", value: 13 },
        { key: "fr", label: "Frankreich", value: 10 },
        { key: "nl", label: "Niederlande", value: 9 },
      ],
      ageGroups: [
        { key: "18_24", label: "18 bis 24", value: 11 },
        { key: "25_34", label: "25 bis 34", value: 34 },
        { key: "35_44", label: "35 bis 44", value: 29 },
        { key: "45_54", label: "45 bis 54", value: 18 },
        { key: "55_plus", label: "55 plus", value: 8 },
      ],
    },
    storyTimeline: {
      "7d": buildStorySeries(["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], [1510, 1620, 1580, 1710, 1750, 1820, 1900]),
      "30d": buildStorySeries(["W1", "W2", "W3", "W4"], [11040, 11420, 11780, 12140]),
    },
    topContent: [
      { id: "tc_5", title: "Bio Fruehstueck Reel", label: "Meiste Reichweite", value: 42880 },
      { id: "tc_6", title: "Story Produktwelt", label: "Meiste Story Views", value: 8820 },
    ],
  },
];

export const internalProfiles: InternalProfile[] = [
  {
    id: "profile_1",
    fullName: "Chris Admin",
    email: "chris@veganewunder.de",
    defaultRole: "admin",
  },
  {
    id: "profile_2",
    fullName: "Anna Account",
    email: "anna@veganewunder.de",
    defaultRole: "manager",
  },
  {
    id: "profile_3",
    fullName: "Mara Reporting",
    email: "mara@veganewunder.de",
    defaultRole: "viewer",
  },
];

export const adminClients: AdminClientRecord[] = [
  {
    id: "admin_client_1",
    name: "Kaufland",
    slug: "kaufland",
    notes: "Retail Hauptkunde mit mehreren Kanaelen und Freigabelinks fuer Kampagnenreports.",
    linkedAccounts: ["Instagram Hauptprofil", "Facebook Brand Page"],
    visibleInsightKeys: [
      "reach",
      "impressions",
      "storyViews",
      "linkClicks",
      "audienceCountries",
      "audienceAgeGroups",
      "topContent",
    ],
    assignments: [
      { profileId: "profile_1", role: "admin" },
      { profileId: "profile_2", role: "manager" },
    ],
  },
  {
    id: "admin_client_2",
    name: "Edeka",
    slug: "edeka",
    notes: "Kampagnenreporting fuer saisonale Aktionen und Reichweitenvergleiche.",
    linkedAccounts: ["Instagram Kampagnenprofil"],
    visibleInsightKeys: [
      "reach",
      "impressions",
      "linkClicks",
      "audienceCountries",
    ],
    assignments: [
      { profileId: "profile_1", role: "admin" },
      { profileId: "profile_3", role: "viewer" },
    ],
  },
  {
    id: "admin_client_3",
    name: "Naturata",
    slug: "naturata",
    notes: "Bio Markenreporting fuer Social Performance und Story Insights.",
    linkedAccounts: ["Instagram Brandprofil", "Facebook Community Page"],
    visibleInsightKeys: [
      "reach",
      "storyViews",
      "linkClicks",
      "audienceAgeGroups",
      "topContent",
    ],
    assignments: [
      { profileId: "profile_1", role: "admin" },
      { profileId: "profile_2", role: "manager" },
      { profileId: "profile_3", role: "viewer" },
    ],
  },
];
