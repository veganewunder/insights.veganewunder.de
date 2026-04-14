import { AudienceBreakdownItem } from "@/types/insights";

function toFlagEmoji(input: string) {
  const code = input.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(code)) {
    return null;
  }

  return String.fromCodePoint(
    ...[...code].map((char) => 127397 + char.charCodeAt(0)),
  );
}

function getCountryFlag(item: AudienceBreakdownItem) {
  if (item.key.length === 2) {
    return toFlagEmoji(item.key);
  }

  return toFlagEmoji(item.label);
}

export function AudienceBars({ items }: { items: AudienceBreakdownItem[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="mt-6 space-y-3">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-3">
          <span className="flex w-32 shrink-0 items-center gap-2 text-sm text-ink">
            {getCountryFlag(item) ? <span>{getCountryFlag(item)}</span> : null}
            <span>{item.label}</span>
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-ink"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-sm font-medium text-stone">
            {item.value}%
          </span>
        </div>
      ))}
    </div>
  );
}
