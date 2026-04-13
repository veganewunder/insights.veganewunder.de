export function comparePercent(current: number, previous: number) {
  if (!previous) {
    return 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("de-DE", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })}%`;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("de-DE", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10000 ? 1 : 0,
  }).format(value);
}
