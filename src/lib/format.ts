import type { Lang } from "./i18n";

export function formatAmount(n: number, lang: Lang = "en"): string {
  const s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, lang === "fr" ? " " : ",");
  return n < 0 ? `-${s}` : s;
}

/** "+250,000" for positive, "-250,000" for negative, "0" for zero. */
export function formatSigned(n: number, lang: Lang = "en"): string {
  if (n > 0) return `+${formatAmount(n, lang)}`;
  return formatAmount(n, lang);
}

export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${+(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 1_000) return `${sign}${+(abs / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}k`;
  return `${sign}${abs}`;
}

/** Parses user input like "250 000" or "250,000" into 250000; empty input returns null. */
export function parseAmount(input: string): number | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  return Number(digits);
}

export function balanceTone(n: number): "positive" | "negative" | "zero" {
  if (n > 0) return "positive";
  if (n < 0) return "negative";
  return "zero";
}
