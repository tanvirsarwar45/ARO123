export function clampControlValue(rawValue, min, max, step) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return min;
  const increment = Number(step);
  const safeStep = Number.isFinite(increment) && increment > 0 ? increment : 1;
  const snapped = min + Math.round((parsed - min) / safeStep) * safeStep;
  const bounded = Math.max(min, Math.min(max, snapped));
  const precision = Math.min(6, (String(safeStep).split('.')[1] || '').length + 2);
  return Number(bounded.toFixed(precision));
}

export function stepControlValue(current, direction, min, max, step) {
  const base = clampControlValue(current, min, max, step);
  return clampControlValue(base + Math.sign(direction) * step, min, max, step);
}
