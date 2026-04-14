import { Platform } from "@/types/platform";

export type RangeKey = "7d" | "30d";
export type PeriodKey = "7d" | "30d" | "daily";
export type ContentType = "reels" | "posts" | "stories";

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
  | "engagement_rate"
  | "likes"
  | "comments"
  | "shares"
  | "saves"
  | "replies"
  | "exits"
  | "taps_forward"
  | "taps_back"
  | "interactions";

export type ShareVisibilityKey =
  | "metric_reach"
  | "metric_impressions"
  | "metric_views"
  | "metric_story_views"
  | "metric_profile_views"
  | "metric_clicks"
  | "metric_watch_time"
  | "metric_avg_view_duration"
  | "audience_countries"
  | "audience_cities"
  | "audience_age_groups"
  | "audience_gender"
  | "timeline"
  | "content_performance"
  | "media_gallery";

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
  contentType: ContentType;
  contentTypeLabel: string;
  title: string;
  caption: string | null;
  platformLabel: string;
  mediaTypeLabel: string;
  mediaUrl: string | null;
  archivedMediaUrl?: string | null;
  permalink: string | null;
  publishedAt: string | null;
  likeCount: number;
  commentCount: number;
  metrics: Partial<Record<MetricKey, number>>;
};

export type ContentInsightsRecord = {
  metrics: KpiCardRecord[];
  timeline: TimelinePoint[];
  content: ContentPerformanceItem[];
  media: MetaContentItem[];
};

export type ClientDashboardRecord = {
  id: string;
  slug: string;
  name: string;
  notes: string;
  accountSummary: string;
  igUsername: string;
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
  contentInsights: Record<RangeKey, Record<ContentType, ContentInsightsRecord>>;
  timeline: Record<RangeKey, TimelinePoint[]>;
  contentPerformance: Record<RangeKey, ContentPerformanceItem[]>;
  mediaGallery: {
    reels: MetaContentItem[];
    posts: MetaContentItem[];
    stories: MetaContentItem[];
  };
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
  media_snapshots: {
    id: string;
    account_id: string;
    media_id: string;
    media_kind: "reel" | "post" | "story";
    content_type: ContentType;
    title: string;
    caption: string | null;
    platform_label: string;
    media_type_label: string;
    media_url: string | null;
    archived_media_url: string | null;
    permalink: string | null;
    published_at: string | null;
    like_count: number;
    comment_count: number;
    metrics_json?: Partial<Record<MetricKey, number>> | null;
    sort_order: number;
    fetched_at: string;
    created_at: string;
  };
  share_links: {
    id: string;
    client_id: string;
    token: string;
    link_name_nullable: string | null;
    recipient_name_nullable: string | null;
    visible_sections_json: ShareVisibilityKey[] | null;
    password_hash_nullable: string | null;
    expires_at_nullable: string | null;
    is_active: boolean;
    created_at: string;
  };
};
