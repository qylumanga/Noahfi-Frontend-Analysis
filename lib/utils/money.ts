import type { PricingQuote } from "@/lib/types";

export const PRICE_USD = 100;

export const MARKETS: Record<string, { currency: string; taxRate: number; taxName: string; fx: number }> = {
  CA: { currency: "CAD", taxRate: 0.13, taxName: "HST", fx: 1.36 },
  US: { currency: "USD", taxRate: 0, taxName: "Tax", fx: 1 },
  GB: { currency: "GBP", taxRate: 0.2, taxName: "VAT", fx: 0.78 },
  EU: { currency: "EUR", taxRate: 0.2, taxName: "VAT", fx: 0.92 },
  IN: { currency: "INR", taxRate: 0.18, taxName: "GST", fx: 83.5 },
  NG: { currency: "NGN", taxRate: 0.075, taxName: "VAT", fx: 1550 },
  PH: { currency: "PHP", taxRate: 0.12, taxName: "VAT", fx: 56 },
  MX: { currency: "MXN", taxRate: 0.16, taxName: "IVA", fx: 17.2 },
  BR: { currency: "BRL", taxRate: 0.17, taxName: "Tax", fx: 5.4 },
};

export const MARKET_OPTIONS = [
  { code: "CA", label: "Canada" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "EU", label: "European Union" },
  { code: "IN", label: "India" },
  { code: "NG", label: "Nigeria" },
  { code: "PH", label: "Philippines" },
  { code: "MX", label: "Mexico" },
  { code: "BR", label: "Brazil" },
];

export function quoteFor(country: string): PricingQuote {
  const market = MARKETS[country] ?? MARKETS.CA;
  const taxUsd = Math.round(PRICE_USD * market.taxRate * 100) / 100;
  const totalUsd = Math.round((PRICE_USD + taxUsd) * 100) / 100;
  return {
    country: MARKETS[country] ? country : "CA",
    baseUsd: PRICE_USD,
    taxName: market.taxName,
    taxRate: market.taxRate,
    taxUsd,
    totalUsd,
    currency: market.currency,
    fx: market.fx,
    totalLocal: Math.round(totalUsd * market.fx * 100) / 100,
  };
}

export function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}
