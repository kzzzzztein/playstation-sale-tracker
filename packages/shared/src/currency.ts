/**
 * Currency conversion helpers.
 *
 * Prices are ALWAYS stored in their original regional currency (see
 * supabase/migrations). PHP amounts are derived at read time using the
 * latest row in `exchange_rates`, never persisted as the source of truth.
 */

export function convertToPhp(amount: number, phpRate: number | null | undefined): number | null {
  if (phpRate === null || phpRate === undefined || Number.isNaN(phpRate)) return null;
  return roundToCents(amount * phpRate);
}

export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateDiscountPercentage(original: number, sale: number | null): number {
  if (sale === null || sale >= original || original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}

const CURRENCY_FORMATTERS: Record<string, Intl.NumberFormat> = {};

export function formatCurrency(amount: number, currency: string): string {
  if (!CURRENCY_FORMATTERS[currency]) {
    CURRENCY_FORMATTERS[currency] = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return CURRENCY_FORMATTERS[currency]!.format(amount);
}

export function formatPhp(amount: number | null): string {
  if (amount === null) return "≈ ₱—";
  return `≈ ₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
