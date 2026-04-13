import { Platform } from "@/types/platform";

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatPlatformsLabel(platforms: Platform[]) {
  return platforms
    .map((platform) => {
      if (platform === "instagram") return "Instagram";
      if (platform === "facebook") return "Facebook";
      return "YouTube";
    })
    .join(", ");
}
