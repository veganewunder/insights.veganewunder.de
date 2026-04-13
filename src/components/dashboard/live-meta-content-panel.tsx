import { fetchMetaRecentContent, fetchMetaRecentStories } from "@/lib/meta/content";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { MediaGallery } from "@/components/dashboard/media-gallery";

export async function LiveMetaContentPanel() {
  try {
    const [reelsResult, storiesResult] = await Promise.allSettled([
      fetchMetaRecentContent(),
      fetchMetaRecentStories(),
    ]);

    const reels = reelsResult.status === "fulfilled" ? reelsResult.value : [];
    const stories = storiesResult.status === "fulfilled" ? storiesResult.value : [];

    return (
      <Panel className="p-5">
        <SectionHeading
          title="Reels und Stories"
          description="Aktuelle Inhalte aus deinem verbundenen Instagram Account"
        />
        <MediaGallery reels={reels} stories={stories} />
      </Panel>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta Content konnte nicht geladen werden";

    return (
      <Panel className="p-5">
        <SectionHeading
          title="Reels und Stories"
          description="Der Content Bereich ist aktuell nicht abrufbar."
        />
        <div className="mt-4 rounded-xl border border-line bg-zinc-50 p-4 text-sm text-stone">
          {message}
        </div>
      </Panel>
    );
  }
}
