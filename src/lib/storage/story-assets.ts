import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MetaContentItem } from "@/types/insights";

const STORY_ARCHIVE_BUCKET = "story-archives";

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function getExtensionFromContentType(contentType: string | null) {
  if (!contentType) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("quicktime")) return "mov";
  return "jpg";
}

async function ensureBucket() {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.createBucket(STORY_ARCHIVE_BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024,
  });

  if (
    error &&
    !error.message.toLowerCase().includes("already exists") &&
    !error.message.toLowerCase().includes("duplicate")
  ) {
    throw new Error(error.message);
  }
}

export async function archiveStoryAssets(
  accountId: string,
  stories: MetaContentItem[],
) {
  await ensureBucket();

  const supabase = createSupabaseAdminClient();
  let archivedCount = 0;
  let reusedArchivedCount = 0;

  const archivedStories = await Promise.all(
    stories.map(async (story) => {
      if (story.archivedMediaUrl) {
        reusedArchivedCount += 1;
        return story;
      }

      if (!story.mediaUrl) {
        return story;
      }

      try {
        const response = await fetch(story.mediaUrl, { cache: "no-store" });
        if (!response.ok) {
          return story;
        }

        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get("content-type");
        const extension = getExtensionFromContentType(contentType);
        const publishedDate = story.publishedAt ? story.publishedAt.slice(0, 10) : "unknown-date";
        const filePath = `${sanitizePathSegment(accountId)}/${publishedDate}/${sanitizePathSegment(story.id)}.${extension}`;

        const upload = await supabase.storage
          .from(STORY_ARCHIVE_BUCKET)
          .upload(filePath, arrayBuffer, {
            upsert: true,
            contentType: contentType ?? undefined,
          });

        if (upload.error) {
          return story;
        }

        const { data } = supabase.storage.from(STORY_ARCHIVE_BUCKET).getPublicUrl(filePath);
        archivedCount += 1;

        return {
          ...story,
          archivedMediaUrl: data.publicUrl || story.archivedMediaUrl || story.mediaUrl,
        };
      } catch {
        return story;
      }
    }),
  );

  return {
    stories: archivedStories,
    archivedCount,
    reusedArchivedCount,
  };
}
