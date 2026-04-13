import { clients } from "@/lib/data/mock-insights";

export type PreparedSyncPayload = {
  accountId: string;
  accountName: string;
  platform: string;
  suggestedWindows: Array<"7d" | "30d">;
};

export async function collectPreparedSyncPayload(): Promise<PreparedSyncPayload[]> {
  return clients.map((client) => ({
    accountId: client.id,
    accountName: client.accountName,
    platform: client.platform,
    suggestedWindows: ["7d", "30d"],
  }));
}
