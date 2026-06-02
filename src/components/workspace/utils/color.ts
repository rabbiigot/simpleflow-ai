export const DEFAULT_COLUMN_COLORS = [
  "#64748b",
  "#3b82f6",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

export const PRESET_COLUMN_COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#a855f7",
  "#64748b",
];

export function toPastelBackground(hex: string, alpha = 0.08) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return "rgba(148,163,184,0.08)";
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Returns true when the tinted column header background is light enough that text should be dark. */
export function isLightColor(hex: string, tintAmount = 0.14): boolean {
  const tinted = tintHex(hex, tintAmount, "white");
  const normalized = tinted.replace("#", "");
  if (normalized.length !== 6) return false;
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  // Relative luminance (WCAG formula)
  const lum =
    0.2126 * (r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4) +
    0.7152 * (g <= 0.03928 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4) +
    0.0722 * (b <= 0.03928 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4);
  return lum > 0.45;
}

export function tintHex(hex: string, amount: number, target: "white" | "black") {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const t = target === "white" ? 255 : 0;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const blend = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v + (t - v) * amount)));
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(blend(r))}${toHex(blend(g))}${toHex(blend(b))}`;
}
