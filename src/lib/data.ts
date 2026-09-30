import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { entries, ledgerYears, members, yearMembers } from "@/db/schema";
import { nowInCameroon } from "./dates";
import { LANG_COOKIE, YEAR_COOKIE, parseLang, type Lang } from "./i18n";
import type { LedgerData } from "./ledger";

export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return parseLang(store.get(LANG_COOKIE)?.value);
}

/** Creates the ledger year if missing, carrying over the roster of the closest earlier (or later) year. */
export async function ensureYear(year: number) {
  const db = await getDb();
  const exists = await db.select().from(ledgerYears).where(eq(ledgerYears.year, year)).limit(1);
  if (exists.length > 0) return;

  const inserted = await db.insert(ledgerYears).values({ year }).onConflictDoNothing().returning();
  if (inserted.length === 0) return;

  const [earlier] = await db
    .select()
    .from(ledgerYears)
    .where(lt(ledgerYears.year, year))
    .orderBy(desc(ledgerYears.year))
    .limit(1);
  const [later] = earlier
    ? []
    : await db.select().from(ledgerYears).where(gt(ledgerYears.year, year)).orderBy(asc(ledgerYears.year)).limit(1);
  const source = earlier ?? later;
  if (!source) return;

  const roster = await db.select().from(yearMembers).where(eq(yearMembers.year, source.year));
  if (roster.length > 0) {
    await db
      .insert(yearMembers)
      .values(roster.map((r) => ({ year, memberId: r.memberId, position: r.position })))
      .onConflictDoNothing();
  }
}

export const listYears = cache(async (): Promise<number[]> => {
  const db = await getDb();
  const rows = await db.select({ year: ledgerYears.year }).from(ledgerYears).orderBy(desc(ledgerYears.year));
  return rows.map((r) => r.year);
});

export const getSelectedYear = cache(async (): Promise<number> => {
  const current = nowInCameroon().year;
  await ensureYear(current);
  const store = await cookies();
  const requested = Number(store.get(YEAR_COOKIE)?.value);
  if (Number.isInteger(requested) && requested !== current) {
    const years = await listYears();
    if (years.includes(requested)) return requested;
  }
  return current;
});

export const getLedger = cache(async (year: number): Promise<LedgerData> => {
  const db = await getDb();
  const [roster, rows] = await Promise.all([
    db
      .select({ id: members.id, name: members.name, position: yearMembers.position })
      .from(yearMembers)
      .innerJoin(members, eq(members.id, yearMembers.memberId))
      .where(eq(yearMembers.year, year))
      .orderBy(asc(yearMembers.position), asc(members.id)),
    db
      .select({
        memberId: entries.memberId,
        month: entries.month,
        contribution: entries.contribution,
        withdrawal: entries.withdrawal,
      })
      .from(entries)
      .where(eq(entries.year, year)),
  ]);
  const ids = new Set(roster.map((r) => r.id));
  return {
    year,
    today: nowInCameroon(),
    members: roster,
    entries: rows.filter((r) => ids.has(r.memberId)),
  };
});

export async function isMemberInYear(year: number, memberId: number) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(yearMembers)
    .where(and(eq(yearMembers.year, year), eq(yearMembers.memberId, memberId)))
    .limit(1);
  return rows.length > 0;
}
