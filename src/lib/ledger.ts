import { monthStatus, passedMonths, type MonthStatus } from "./dates";

export type YearMonth = { year: number; month: number };

export type LedgerMember = { id: number; name: string; position: number };
export type LedgerEntry = { memberId: number; month: number; contribution: number | null; withdrawal: number };

export type LedgerData = {
  year: number;
  today: YearMonth;
  members: LedgerMember[];
  entries: LedgerEntry[];
};

export type MemberRow = {
  id: number;
  name: string;
  sn: number;
  /** index 0 = January */
  contributions: (number | null)[];
  withdrawals: number[];
  total: number;
  withdraw: number;
  balance: number;
  paidMonths: number;
  missingMonths: number[];
};

export type MonthSummary = {
  month: number;
  status: MonthStatus;
  contributed: number;
  withdrawn: number;
  paid: number;
  count: number;
  missing: MemberRow[];
};

export const isPaid = (v: number | null | undefined) => v != null && v > 0;

export function buildRows(data: LedgerData): MemberRow[] {
  const passed = passedMonths(data.year, data.today);
  const byMember = new Map<number, LedgerEntry[]>();
  for (const e of data.entries) {
    const list = byMember.get(e.memberId) ?? [];
    list.push(e);
    byMember.set(e.memberId, list);
  }

  return data.members.map((m, i) => {
    const contributions: (number | null)[] = Array(12).fill(null);
    const withdrawals: number[] = Array(12).fill(0);
    for (const e of byMember.get(m.id) ?? []) {
      contributions[e.month - 1] = e.contribution;
      withdrawals[e.month - 1] = e.withdrawal;
    }
    const total = contributions.reduce<number>((s, v) => s + (v ?? 0), 0);
    const withdraw = withdrawals.reduce((s, v) => s + v, 0);
    return {
      id: m.id,
      name: m.name,
      sn: i + 1,
      contributions,
      withdrawals,
      total,
      withdraw,
      balance: total - withdraw,
      paidMonths: passed.filter((mo) => isPaid(contributions[mo - 1])).length,
      missingMonths: passed.filter((mo) => !isPaid(contributions[mo - 1])),
    };
  });
}

export function summarizeMonths(rows: MemberRow[], data: Pick<LedgerData, "year" | "today">): MonthSummary[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const status = monthStatus(data.year, month, data.today);
    const paidRows = rows.filter((r) => isPaid(r.contributions[i]));
    return {
      month,
      status,
      contributed: rows.reduce((s, r) => s + (r.contributions[i] ?? 0), 0),
      withdrawn: rows.reduce((s, r) => s + r.withdrawals[i], 0),
      paid: paidRows.length,
      count: rows.length,
      missing: status === "past" ? rows.filter((r) => !isPaid(r.contributions[i])) : [],
    };
  });
}

export function grandTotals(rows: MemberRow[]) {
  const total = rows.reduce((s, r) => s + r.total, 0);
  const withdraw = rows.reduce((s, r) => s + r.withdraw, 0);
  return { total, withdraw, balance: total - withdraw };
}

export function missingCount(rows: MemberRow[]) {
  return rows.reduce((s, r) => s + r.missingMonths.length, 0);
}
