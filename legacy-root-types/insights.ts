export type RangeKey = "7d" | "30d";

export type KpiMetric = {
  label: string;
  value: number;
  changePercent: number;
  changeLabel: string;
};

export type KpiMetricSet = {
  reach: KpiMetric;
  impressions: KpiMetric;
  storyViews: KpiMetric;
  linkClicks: KpiMetric;
};

export type AudienceBreakdownItem = {
  key: string;
  label: string;
  value: number;
};

export type StoryPoint = {
  label: string;
  value: number;
};

export type TopContentItem = {
  id: string;
  title: string;
  label: string;
  value: number;
};

export type InsightPermissionKey =
  | "reach"
  | "impressions"
  | "storyViews"
  | "linkClicks"
  | "audienceCountries"
  | "audienceAgeGroups"
  | "topContent";

export type ClientDashboardRecord = {
  id: string;
  slug: string;
  name: string;
  platform: string;
  accountName: string;
  sector?: string;
  shareToken: string;
  shareExpiresLabel: string;
  lastSyncedAt: Date;
  visibleInsightKeys: InsightPermissionKey[];
  metrics: Record<RangeKey, KpiMetricSet>;
  audience: {
    countries: AudienceBreakdownItem[];
    ageGroups: AudienceBreakdownItem[];
  };
  storyTimeline: Record<RangeKey, StoryPoint[]>;
  topContent: TopContentItem[];
};

export type ClientAccessRole = "admin" | "manager" | "viewer";

export type InternalProfile = {
  id: string;
  fullName: string;
  email: string;
  defaultRole: ClientAccessRole;
};

export type ClientAccessAssignment = {
  profileId: string;
  role: ClientAccessRole;
};

export type AdminClientRecord = {
  id: string;
  name: string;
  slug: string;
  notes: string;
  linkedAccounts: string[];
  assignments: ClientAccessAssignment[];
  visibleInsightKeys: InsightPermissionKey[];
};

export type DatabaseTables = {
  accounts: {
    id: string;
    platform: "instagram" | "facebook";
    account_name: string;
    platform_account_id: string;
    connected_page_id: string | null;
    created_at: string;
    updated_at: string;
  };
  oauth_tokens: {
    id: string;
    account_id: string;
    access_token_encrypted: string;
    refresh_meta_optional: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
  };
  clients: {
    id: string;
    slug: string;
    name: string;
    notes: string | null;
    is_active: boolean;
    visible_insight_keys: InsightPermissionKey[];
    created_at: string;
    updated_at: string;
  };
  profiles: {
    id: string;
    full_name: string;
    email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  client_account_links: {
    id: string;
    client_id: string;
    account_id: string;
  };
  user_client_roles: {
    id: string;
    profile_id: string;
    client_id: string;
    role: ClientAccessRole;
    created_at: string;
    updated_at: string;
  };
  insight_snapshots: {
    id: string;
    account_id: string;
    metric_key: string;
    metric_label: string;
    period_key: "7d" | "30d" | "daily";
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
    breakdown_type: "country" | "age" | "gender" | "age_gender";
    dimension_key: string;
    dimension_label: string;
    value_numeric: number;
    start_date: string;
    end_date: string;
    fetched_at: string;
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
