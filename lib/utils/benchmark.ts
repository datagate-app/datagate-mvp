export function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;

  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);

  if (lo === hi) return sorted[lo];

  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

export function summarize(values: number[]) {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);

  return {
    n: v.length,
    p25: percentile(v, 0.25),
    p50: percentile(v, 0.5),
    p75: percentile(v, 0.75),
  };
}