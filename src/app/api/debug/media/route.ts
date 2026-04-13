import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdminClient();

  // Try inserting a row with metrics_json to test if column works
  const testId = crypto.randomUUID();
  const testRow = {
    id: testId,
    account_id: "1407d135-f602-4d2c-b9aa-0d98f5f9e85e",
    media_id: "test_metrics_json",
    media_kind: "reel" as const,
    content_type: "reels",
    title: "Test",
    platform_label: "Instagram",
    media_type_label: "Reel",
    like_count: 0,
    comment_count: 0,
    metrics_json: { views: 12345, reach: 9999 },
    sort_order: 0,
    fetched_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  const insertResult = await supabase.from("media_snapshots").insert([testRow]);
  await supabase.from("media_snapshots").delete().eq("media_id", "test_metrics_json");

  // Read an actual row and show metrics_json
  const { data } = await supabase
    .from("media_snapshots")
    .select("media_id, content_type, metrics_json, like_count")
    .eq("content_type", "reels")
    .limit(3);

  return NextResponse.json({
    insertError: insertResult.error?.message ?? null,
    sampleRows: data,
  });
}
