import { passedMonths } from "./dates";
import type { MemberRow, MonthSummary, YearMonth } from "./ledger";

export type Analysis = ReturnType<typeof analyze>;

export function analyze(rows: MemberRow[], months: MonthSummary[], year: number, today: YearMonth) {
  const passed = passedMonths(year, today);
  const expectedCells = passed.length * rows.length;
  const paidCells = rows.reduce((s, r) => s + r.paidMonths, 0);
  const total = rows.reduce((s, r) => s + r.total, 0);
  const withdraw = rows.reduce((s, r) => s + r.withdraw, 0);

  const activeMonths = months.filter((m) => m.contributed > 0).length;
  const monthsForAverage = Math.max(passed.length, activeMonths);
  const best = months.reduce<MonthSummary | null>((b, m) => (m.contributed > (b?.contributed ?? 0) ? m : b), null);
  const top = rows.reduce<MemberRow | null>((b, r) => (r.total > (b?.total ?? 0) ? r : b), null);

  let running = 0;
  const cumulative = months.map((m) => {
    running += m.contributed - m.withdrawn;
    return { month: m.month, balance: running };
  });

  const memberStats = rows.map((r) => ({
    ...r,
    rate: passed.length ? (r.paidMonths / passed.length) * 100 : null,
    share: total ? (r.total / total) * 100 : 0,
  }));

  return {
    passedCount: passed.length,
    total,
    withdraw,
    balance: total - withdraw,
    collectionRate: expectedCells ? (paidCells / expectedCells) * 100 : null,
    avgMonthly: monthsForAverage ? total / monthsForAverage : 0,
    best,
    top,
    cumulative,
    memberStats,
  };
}
