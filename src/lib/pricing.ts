/**
 * Multi-country plan pricing (per user / seat), mirrored from the API.
 * Prices are shown in the selected currency; checkout settles in PHP.
 */
export type Currency = "PHP" | "USD" | "EUR";

export const PLAN_PRICING: Record<
  string,
  Partial<Record<Currency, { monthly: number; yearly: number }>>
> = {
  PRO: {
    PHP: { monthly: 499, yearly: 4990 },
    USD: { monthly: 12, yearly: 120 },
    EUR: { monthly: 11, yearly: 110 },
  },
  TEAM: {
    PHP: { monthly: 1399, yearly: 13990 },
    USD: { monthly: 39, yearly: 390 },
    EUR: { monthly: 36, yearly: 360 },
  },
};

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
};

export const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "PHP", label: "🇵🇭 Philippines (₱)" },
  { value: "USD", label: "🇺🇸 United States ($)" },
  { value: "EUR", label: "🇪🇺 Europe (€)" },
];

const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
]);

export function currencyForCountry(country?: string): Currency {
  const c = (country || "").trim().toUpperCase();
  if (c === "PH" || c === "PHILIPPINES") return "PHP";
  if (EU_COUNTRIES.has(c)) return "EUR";
  return "USD";
}

export function planPrice(
  tier: string,
  currency: Currency,
  cycle: "monthly" | "yearly",
): number | null {
  return PLAN_PRICING[tier]?.[currency]?.[cycle] ?? null;
}

/** Formatted price string for a tier, e.g. "₱499". Returns "Free" for FREE. */
export function formatPlanPrice(
  tier: string,
  currency: Currency,
  cycle: "monthly" | "yearly",
): string {
  if (tier === "FREE") return "Free";
  const price = planPrice(tier, currency, cycle);
  if (price == null) return "—";
  return `${CURRENCY_SYMBOL[currency]}${price.toLocaleString()}`;
}
