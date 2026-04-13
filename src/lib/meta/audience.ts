import { createHmac } from "node:crypto";
import { EnvConfigError, getMetaInsightsEnv } from "@/lib/env";
import { AudienceBreakdownItem } from "@/types/insights";

const META_GRAPH_VERSION = "v19.0";
const DEFAULT_LIMIT = 8;

type MetaAudienceBreakdown = {
  dimension_keys?: string[];
  results?: MetaAudienceResult[];
};

type MetaAudienceResult = {
  dimension_values?: string[];
  value?: number | null;
  total_value?: number | { value?: number | null } | null;
};

type MetaAudienceMetric = {
  name?: string;
  period?: string;
  total_value?:
    | number
    | {
        breakdowns?: MetaAudienceBreakdown[];
        value?: number | null;
      }
    | null;
};

type MetaAudienceResponse = {
  data?: MetaAudienceMetric[];
  error?: {
    message?: string;
  };
};

type MetaAudienceBreakdownKey = "country" | "city" | "age" | "age_gender" | "gender";

export type MetaAudienceSummary = {
  countries: AudienceBreakdownItem[];
  cities: AudienceBreakdownItem[];
  ageGroups: AudienceBreakdownItem[];
  gender: AudienceBreakdownItem[];
};

export class MetaAudienceError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "MetaAudienceError";
    this.status = status;
  }
}

function getAudienceEnv() {
  try {
    const { accessToken, instagramAccountId, appSecret } = getMetaInsightsEnv();

    return {
      accessToken,
      instagramId: instagramAccountId,
      appSecret,
    };
  } catch (error) {
    if (error instanceof EnvConfigError) {
      throw new MetaAudienceError(error.message, error.status);
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

function readNumericValue(result: MetaAudienceResult) {
  if (typeof result.value === "number") {
    return result.value;
  }

  if (typeof result.total_value === "number") {
    return result.total_value;
  }

  if (
    result.total_value &&
    typeof result.total_value === "object" &&
    typeof result.total_value.value === "number"
  ) {
    return result.total_value.value;
  }

  return 0;
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const COUNTRY_NAMES: Record<string, string> = {
  DE: "Deutschland", AT: "Österreich", CH: "Schweiz", US: "USA", GB: "Großbritannien",
  FR: "Frankreich", IT: "Italien", ES: "Spanien", NL: "Niederlande", BE: "Belgien",
  PL: "Polen", SE: "Schweden", NO: "Norwegen", DK: "Dänemark", FI: "Finnland",
  PT: "Portugal", GR: "Griechenland", CZ: "Tschechien", HU: "Ungarn", RO: "Rumänien",
  TR: "Türkei", RU: "Russland", UA: "Ukraine", AU: "Australien", CA: "Kanada",
  BR: "Brasilien", MX: "Mexiko", AR: "Argentinien", JP: "Japan", CN: "China",
  KR: "Südkorea", IN: "Indien", ZA: "Südafrika", SG: "Singapur", AE: "VAE",
  LU: "Luxemburg", LI: "Liechtenstein", HR: "Kroatien", SK: "Slowakei", SI: "Slowenien",
};

function formatCountryLabel(value: string) {
  const code = value.toUpperCase();
  return COUNTRY_NAMES[code] ?? code;
}

function formatCityLabel(value: string) {
  // "Berlin, Berlin" → "Berlin" / "Munich, Bayern" → "München" — take only the part before the comma
  const cityPart = value.split(",")[0].trim();
  return toTitleCase(cityPart.replace(/_/g, " "));
}

function formatGenderLabel(value: string) {
  const map: Record<string, string> = { M: "Männer", F: "Frauen", U: "Keine Angabe" };
  return map[value.toUpperCase()] ?? value;
}

function extractAgeLabel(value: string) {
  const ageMatch = value.match(/(13-17|18-24|25-34|35-44|45-54|55-64|65\+)/);
  return ageMatch?.[1] ?? value.toUpperCase();
}

function normalizeBreakdownRows(
  metric: MetaAudienceMetric | undefined,
  breakdownKey: MetaAudienceBreakdownKey,
) {
  const totalValue =
    metric?.total_value && typeof metric.total_value === "object" ? metric.total_value : null;
  const breakdowns = totalValue?.breakdowns ?? [];
  const matchingBreakdown =
    breakdowns.find((entry) => entry.dimension_keys?.includes(breakdownKey)) ?? breakdowns[0];
  const results = matchingBreakdown?.results ?? [];

  return results
    .map((result) => {
      const rawLabel = result.dimension_values?.[0] ?? "";
      const value = readNumericValue(result);

      if (!rawLabel || value <= 0) {
        return null;
      }

      if (breakdownKey === "gender") {
        return {
          key: rawLabel.toLowerCase(),
          label: formatGenderLabel(rawLabel),
          value,
        } satisfies AudienceBreakdownItem;
      }

      if (breakdownKey === "country") {
        return {
          key: rawLabel.toLowerCase(),
          label: formatCountryLabel(rawLabel),
          value,
        } satisfies AudienceBreakdownItem;
      }

      if (breakdownKey === "city") {
        return {
          key: rawLabel.toLowerCase(),
          label: formatCityLabel(rawLabel),
          value,
        } satisfies AudienceBreakdownItem;
      }

      return {
        key: extractAgeLabel(rawLabel),
        label: extractAgeLabel(rawLabel),
        value,
      } satisfies AudienceBreakdownItem;
    })
    .filter((item): item is AudienceBreakdownItem => Boolean(item));
}

function aggregateAgeGroups(items: AudienceBreakdownItem[]) {
  const totals = new Map<string, number>();

  for (const item of items) {
    totals.set(item.label, (totals.get(item.label) ?? 0) + item.value);
  }

  return [...totals.entries()]
    .map(([label, value]) => ({
      key: label,
      label,
      value,
    }))
    .sort((left, right) => right.value - left.value);
}

function limitAudience(items: AudienceBreakdownItem[], limit = DEFAULT_LIMIT) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const alreadyPercentages = total >= 99 && total <= 101;

  return [...items]
    .sort((left, right) => right.value - left.value)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      value: Math.round((alreadyPercentages ? item.value : (item.value / Math.max(total, 1)) * 100) * 10) / 10,
    }));
}

async function fetchAudienceBreakdown(
  breakdown: MetaAudienceBreakdownKey,
): Promise<MetaAudienceResponse> {
  const { accessToken, instagramId, appSecret } = getAudienceEnv();
  const appSecretProof = createAppSecretProof(accessToken, appSecret);

  const params = new URLSearchParams({
    metric: "follower_demographics",
    period: "lifetime",
    metric_type: "total_value",
    breakdown,
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

  const payload = (await response.json()) as MetaAudienceResponse;

  if (!response.ok) {
    throw new MetaAudienceError(
      payload.error?.message ?? "Meta Audience Daten konnten nicht geladen werden",
      response.status,
    );
  }

  return payload;
}

async function fetchAgeGroups() {
  try {
    const ageResponse = await fetchAudienceBreakdown("age");
    return limitAudience(
      normalizeBreakdownRows(ageResponse.data?.[0], "age"),
    );
  } catch (error) {
    if (!(error instanceof MetaAudienceError) || error.status < 400 || error.status >= 500) {
      throw error;
    }

    const ageGenderResponse = await fetchAudienceBreakdown("age_gender");
    return limitAudience(
      aggregateAgeGroups(normalizeBreakdownRows(ageGenderResponse.data?.[0], "age_gender")),
    );
  }
}

export async function fetchMetaAudienceSummary(): Promise<MetaAudienceSummary> {
  const [countriesResponse, citiesResponse, ageGroups, genderResponse] = await Promise.all([
    fetchAudienceBreakdown("country"),
    fetchAudienceBreakdown("city"),
    fetchAgeGroups(),
    fetchAudienceBreakdown("gender").catch(() => null),
  ]);

  const rawGender = genderResponse
    ? normalizeBreakdownRows(genderResponse.data?.[0], "gender").filter(
        (item) => item.key !== "u",
      )
    : [];

  // Recalculate percentages excluding "Unknown" (U), matching Instagram app behaviour
  const genderTotal = rawGender.reduce((sum, item) => sum + item.value, 0);
  const gender = rawGender.map((item) => ({
    ...item,
    value: Math.round((item.value / Math.max(genderTotal, 1)) * 1000) / 10,
  }));

  return {
    countries: limitAudience(normalizeBreakdownRows(countriesResponse.data?.[0], "country")),
    cities: limitAudience(normalizeBreakdownRows(citiesResponse.data?.[0], "city")),
    ageGroups,
    gender,
  };
}
