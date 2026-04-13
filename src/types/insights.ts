import { Platform } from "@/types/platform";

export type RangeKey = "7d" | "30d";
export type PeriodKey = "7d" | "30d" | "daily";

export type MetricKey =
  | "reach"
  | "impressions"
  | "views"
  | "story_views"
  | "profile_views"
  | "clicks"
  | "watch_time"
  | "avg_view_duration"
  | "audience_country"
  | "audience_age"
  | "subscribers"
  | "followers"
  | "engagement_rate";

export type KpiCardRecord = {
  key: MetricKey;
  label: string;
  value: number;
  previousValue: number;
  displayValue: string;
  changePercent: number;
  changeLabel: string;
  platformAvailabilityLabel: string;
};

export type AudienceBreakdownItem = {
  key: string;
  label: string;
  value: number;
};

export type TimelinePoint = {
  label: string;
  value: number;
  displayValue: string;
};

export type ContentPerformanceItem = {
  id: string;
  title: string;
  platformLabel: string;
  secondaryLabel: string;
  primaryValue: string;
  changeLabel: string;
};

export type MetaContentItem = {
  id: string;
  title: string;
  caption: string | null;
  platformLabel: string;
  mediaTypeLabel: string;
  mediaUrl: string | null;
  permalink: string | null;
  publishedAt: string | null;
  likeCount: number;
  commentCount: number;
};

export type ClientDashboardRecord = {
  id: string;
  slug: string;
  name: string;
  notes: string;
  accountSummary: string;
  shareToken: string;
  shareExpiresLabel: string;
  lastSyncedAt: Date;
  platforms: Platform[];
  metrics: Record<RangeKey, KpiCardRecord[]>;
  audience: Record<
    RangeKey,
    {
      countries: AudienceBreakdownItem[];
      cities: AudienceBreakdownItem[];
      ageGroups: AudienceBreakdownItem[];
      gender: AudienceBreakdownItem[];
    }
  >;
  timeline: Record<RangeKey, TimelinePoint[]>;
  contentPerformance: Record<RangeKey, ContentPerformanceItem[]>;
};

export type DatabaseTables = {
  accounts: {
    id: string;
    platform: Platform;
    account_name: string;
    platform_account_id: string;
    external_channel_or_page_id: string | null;
    created_at: string;
    updated_at: string;
  };
  oauth_tokens: {
    id: string;
    account_id: string;
    access_token_encrypted: string;
    refresh_token_encrypted: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
  };
  clients: {
    id: string;
    slug: string;
    name: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  client_account_links: {
    id: string;
    client_id: string;
    account_id: string;
  };
  insight_snapshots: {
    id: string;
    account_id: string;
    metric_key: MetricKey;
    metric_label: string;
    period_key: PeriodKey;
    value_numeric: number | null;
    value_json: Record<string, unknown> | null;
    start_date: string;
    end_date: string;
    fetched_at: string;
    created_at: string;
  };
  audience_breakdowns: {
    id: string;
    account_id: string;
    breakdown_type: "country" | "city" | "age" | "gender" | "age_gender";
    dimension_key: string;
    dimension_label: string;
    value_numeric: number;
    start_date: string;
    end_date: string;
    fetched_at: string;
  };
  content_snapshots: {
    id: string;
    account_id: string;
    period_key: RangeKey;
    content_id: string;
    title: string;
    platform_label: string;
    secondary_label: string;
    primary_value: string;
    change_label: string;
    sort_order: number;
    fetched_at: string;
    created_at: string;
  };
  share_links: {
    id: string;
    client_id: string;
    token: string;
    password_hash_nullable: string | null;
    expires_at_nullable: string | null;
    is_active: boolean;
    created_at: string;
  };
};
