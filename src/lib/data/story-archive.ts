import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchMetaRecentStories } from "@/lib/meta/content";
import { archiveStoryAssets } from "@/lib/storage/story-assets";

function isMissingColumn(message: string, column: string) {
  return message.includes(column);
}

export async function getFirstAccountId(): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("accounts")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export type StorySnapshotRow = {
  id: string;
  account_id: string;
  story_id: string;
  media_url: string | null;
  archived_media_url: string | null;
  timestamp: string | null;
  caption: string | null;
  saved_at: string;
};

export async function syncActiveStoriesToSupabase(accountId: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const stories = await fetchMetaRecentStories();

  if (stories.length === 0) return 0;

  const archivedStories = await archiveStoryAssets(accountId, stories);

  const rows = archivedStories.stories.map((story) => ({
    account_id: accountId,
    story_id: story.id,
    media_url: story.mediaUrl,
    archived_media_url: story.archivedMediaUrl ?? null,
    timestamp: story.publishedAt,
    caption: story.caption,
    saved_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("story_snapshots")
    .upsert(rows, { onConflict: "story_id" });

  if (error) {
    if (isMissingColumn(error.message, "archived_media_url")) {
      const fallbackRows = rows.map(({ archived_media_url, ...row }) => row);
      const fallback = await supabase
        .from("story_snapshots")
        .upsert(fallbackRows, { onConflict: "story_id" });

      if (!fallback.error) {
        return fallbackRows.length;
      }
    }

    // Table might not exist yet — warn but don't break the sync
    console.warn("story_snapshots_sync_warning", error.message);
    return 0;
  }

  return rows.length;
}

export async function getStoredStories(accountId: string): Promise<StorySnapshotRow[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("story_snapshots")
    .select("id, account_id, story_id, media_url, archived_media_url, timestamp, caption, saved_at")
    .eq("account_id", accountId)
    .order("timestamp", { ascending: false })
    .limit(50);

  if (error) {
    if (isMissingColumn(error.message, "archived_media_url")) {
      const fallback = await supabase
        .from("story_snapshots")
        .select("id, account_id, story_id, media_url, timestamp, caption, saved_at")
        .eq("account_id", accountId)
        .order("timestamp", { ascending: false })
        .limit(50);

      if (fallback.error) return [];
      return ((fallback.data ?? []) as Array<Omit<StorySnapshotRow, "archived_media_url">>).map((row) => ({
        ...row,
        archived_media_url: null,
      }));
    }

    return [];
  }
  return (data ?? []) as StorySnapshotRow[];
}

export async function insertManualStoryIds(
  accountId: string,
  storyIds: string[],
): Promise<number> {
  const supabase = createSupabaseAdminClient();

  const rows = storyIds.map((storyId) => ({
    account_id: accountId,
    story_id: storyId,
    media_url: null,
    archived_media_url: null,
    timestamp: null,
    caption: null,
    saved_at: new Date().toISOString(),
  }));

  const { error, data } = await supabase
    .from("story_snapshots")
    .upsert(rows, { onConflict: "story_id" })
    .select("id");

  if (error) {
    if (isMissingColumn(error.message, "archived_media_url")) {
      const fallbackRows = rows.map(({ archived_media_url, ...row }) => row);
      const fallback = await supabase
        .from("story_snapshots")
        .upsert(fallbackRows, { onConflict: "story_id" })
        .select("id");

      if (fallback.error) throw new Error(fallback.error.message);
      return fallback.data?.length ?? 0;
    }

    throw new Error(error.message);
  }
  return data?.length ?? 0;
}
