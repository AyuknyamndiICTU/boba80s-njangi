const TIME_ZONE = "Africa/Douala";

export function nowInCameroon(date = new Date()): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month") };
}

/** Months (1-12) of `year` that have fully ended, relative to `today`. */
export function passedMonths(year: number, today: { year: number; month: number }): number[] {
  if (year < today.year) return Array.from({ length: 12 }, (_, i) => i + 1);
  if (year > today.year) return [];
  return Array.from({ length: today.month - 1 }, (_, i) => i + 1);
}

export type MonthStatus = "past" | "current" | "upcoming";

export function monthStatus(year: number, month: number, today: { year: number; month: number }): MonthStatus {
  if (year < today.year || (year === today.year && month < today.month)) return "past";
  if (year === today.year && month === today.month) return "current";
  return "upcoming";
}
