import { createHmac } from "node:crypto";
import { EnvConfigError, getMetaInsightsEnv } from "@/lib/env";

const META_GRAPH_VERSION = "v19.0";
const META_INSIGHT_REQUESTS = [
  { responseKey: "reach", apiMetric: "reach" },
  { responseKey: "impressions", apiMetric: "views" },
  { responseKey: "profile_views", apiMetric: "profile_views" },
] as const;

export type MetaInsightMetricName =
  (typeof META_INSIGHT_REQUESTS)[number]["responseKey"];
type MetaApiMetricName = (typeof META_INSIGHT_REQUESTS)[number]["apiMetric"];

type MetaInsightValuePoint = {
  value?: number | null;
  end_time?: string;
};

type MetaInsightTotalValue =
  | number
  | {
      value?: number | null;
    }
  | null;

type MetaInsightApiMetric = {
  name: MetaApiMetricName;
  title?: string;
  period: "day";
  values?: MetaInsightValuePoint[];
  total_value?: MetaInsightTotalValue;
};

type MetaInsightsApiResponse = {
  data?: MetaInsightApiMetric[];
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

export type MetaInsightsSummary = Record<
  MetaInsightMetricName,
  {
    last7: number;
    last30: number;
  }
>;

export type MetaInsightsWindowSummary = Record<MetaInsightMetricName, number>;

type MetaWindowKey = "last7" | "last30";

export class MetaInsightsError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "MetaInsightsError";
    this.status = status;
  }
}

function getRequiredMetaEnv() {
  try {
    const { accessToken, instagramAccountId, appSecret } = getMetaInsightsEnv();

    return {
      accessToken,
      instagramId: instagramAccountId,
      appSecret,
    };
  } catch (error) {
    if (error instanceof EnvConfigError) {
      throw new MetaInsightsError(error.message, error.status);
    }

    throw error;
  }
}

function createAppSecretProof(accessToken: string, appSecret?: string) {
  if (!appSecret) {
    return null;
  }

  return createHmac("sha256", appSecret).update(accessToken).digest("hex");
}

export function sumLastDays(values: number[], days: number) {
  return values.slice(0, days).reduce((sum, value) => sum + value, 0);
}

function buildWindowTimestamps(days: number, offsetDays = 0) {
  const now = new Date();
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0),
  );
  end.setUTCDate(end.getUTCDate() - offsetDays);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);

  return {
    since: Math.floor(start.getTime() / 1000).toString(),
    until: Math.floor(end.getTime() / 1000).toString(),
  };
}

function toMetricValues(values: MetaInsightValuePoint[]) {
  return [...values]
    .sort((a, b) => {
      const aTime = a.end_time ? new Date(a.end_time).getTime() : 0;
      const bTime = b.end_time ? new Date(b.end_time).getTime() : 0;
      return bTime - aTime;
    })
    .map((entry) => entry.value ?? 0);
}

function toMetricTotals(metric?: MetaInsightApiMetric) {
  if (!metric) {
    return [];
  }

  if (metric.values && metric.values.length > 0) {
    return toMetricValues(metric.values);
  }

  if (typeof metric.total_value === "number") {
    return [metric.total_value];
  }

  if (
    metric.total_value &&
    typeof metric.total_value === "object" &&
    typeof metric.total_value.value === "number"
  ) {
    return [metric.total_value.value];
  }

  return [];
}

export function transformMetaInsightsResponse(
  response: MetaInsightsApiResponse,
): MetaInsightsSummary {
  const metrics = response.data ?? [];

  return META_INSIGHT_REQUESTS.reduce<MetaInsightsSummary>((accumulator, metricConfig) => {
    const metric = metrics.find((entry) => entry.name === metricConfig.apiMetric);
    const values = toMetricTotals(metric);

    accumulator[metricConfig.responseKey] = {
      last7: sumLastDays(values, 7),
      last30: sumLastDays(values, 30),
    };

    return accumulator;
  }, {
    reach: { last7: 0, last30: 0 },
    impressions: { last7: 0, last30: 0 },
    profile_views: { last7: 0, last30: 0 },
  });
}

export async function fetchMetaInsightsForWindow(
  days: number,
  offsetDays = 0,
): Promise<MetaInsightsApiResponse> {
  const { accessToken, instagramId, appSecret } = getRequiredMetaEnv();
  const appSecretProof = createAppSecretProof(accessToken, appSecret);
  const { since, until } = buildWindowTimestamps(days, offsetDays);

  const params = new URLSearchParams({
    // Meta v19 akzeptiert fuer diesen Instagram Endpoint kein "impressions".
    // Fuer das bestehende Dashboard-Format wird "views" in den Antwortslot
    // "impressions" gemappt, bis die KPI Benennung im UI vereinheitlicht ist.
    metric: META_INSIGHT_REQUESTS.map((entry) => entry.apiMetric).join(","),
    period: "day",
    metric_type: "total_value",
    since,
    until,
    access_token: accessToken,
  });

  if (appSecretProof) {
    params.set("appsecret_proof", appSecretProof);
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${instagramId}/insights?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as MetaInsightsApiResponse;

  if (!response.ok) {
    const message =
      payload.error?.message ?? "Meta Graph API Anfrage fuer Insights fehlgeschlagen";
    throw new MetaInsightsError(message, response.status);
  }

  return payload;
}

export async function fetchMetaInsightsByWindows() {
  const [last7Response, last30Response] = await Promise.all([
    fetchMetaInsightsForWindow(7),
    fetchMetaInsightsForWindow(30),
  ]);

  return {
    last7Response,
    last30Response,
  };
}

export function transformMetaInsightsWindow(
  response: MetaInsightsApiResponse,
): MetaInsightsWindowSummary {
  return META_INSIGHT_REQUESTS.reduce<MetaInsightsWindowSummary>(
    (accumulator, metricConfig) => {
      const metric = response.data?.find((entry) => entry.name === metricConfig.apiMetric);
      accumulator[metricConfig.responseKey] = getMetricAggregate(metric);
      return accumulator;
    },
    {
      reach: 0,
      impressions: 0,
      profile_views: 0,
    },
  );
}

function getMetricAggregate(metric?: MetaInsightApiMetric) {
  const values = toMetricTotals(metric);
  return values[0] ?? 0;
}

export function transformMetaInsightsWindows(input: {
  last7Response: MetaInsightsApiResponse;
  last30Response: MetaInsightsApiResponse;
}): MetaInsightsSummary {
  return META_INSIGHT_REQUESTS.reduce<MetaInsightsSummary>(
    (accumulator, metricConfig) => {
      const last7Metric = input.last7Response.data?.find(
        (entry) => entry.name === metricConfig.apiMetric,
      );
      const last30Metric = input.last30Response.data?.find(
        (entry) => entry.name === metricConfig.apiMetric,
      );

      accumulator[metricConfig.responseKey] = {
        last7: getMetricAggregate(last7Metric),
        last30: getMetricAggregate(last30Metric),
      };

      return accumulator;
    },
    {
      reach: { last7: 0, last30: 0 },
      impressions: { last7: 0, last30: 0 },
      profile_views: { last7: 0, last30: 0 },
    },
  );
}

export function buildMetaInsightsDebug(response: MetaInsightsApiResponse) {
  return {
    metricCount: response.data?.length ?? 0,
    metrics:
      response.data?.map((metric) => ({
        name: metric.name,
        period: metric.period,
        valuesCount: metric.values?.length ?? 0,
        firstValue: metric.values?.[0]?.value ?? null,
        firstEndTime: metric.values?.[0]?.end_time ?? null,
        totalValue:
          typeof metric.total_value === "number"
            ? metric.total_value
            : metric.total_value?.value ?? null,
      })) ?? [],
  };
}

export function buildMetaInsightsWindowDebug(input: {
  last7Response: MetaInsightsApiResponse;
  last30Response: MetaInsightsApiResponse;
}) {
  return {
    last7: buildMetaInsightsDebug(input.last7Response),
    last30: buildMetaInsightsDebug(input.last30Response),
  };
}
