"use server";

import { and, asc, eq, inArray, or, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { entries, ledgerYears, members, yearMembers } from "@/db/schema";
import { ensureYear, isMemberInYear, MAX_YEAR, MIN_YEAR } from "@/lib/data";
import { LANG_COOKIE, YEAR_COOKIE, type DictKey } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: DictKey };

const ONE_YEAR = 60 * 60 * 24 * 365;
const yearSchema = z.number().int().min(MIN_YEAR).max(MAX_YEAR);
const idSchema = z.number().int().positive();
const nameSchema = z.string().trim().min(1).max(80);
const amountSchema = z.number().int().min(0).max(1_000_000_000);

function done(): ActionResult {
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setLangAction(lang: "en" | "fr") {
  const store = await cookies();
  store.set(LANG_COOKIE, lang === "fr" ? "fr" : "en", { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  revalidatePath("/", "layout");
}

export async function setYearAction(year: number): Promise<ActionResult> {
  await requireUser();
  const parsed = yearSchema.safeParse(year);
  if (!parsed.success) return { ok: false, error: "errGeneric" };
  const db = await getDb();
  const exists = await db.select().from(ledgerYears).where(eq(ledgerYears.year, parsed.data)).limit(1);
  if (exists.length === 0) return { ok: false, error: "errGeneric" };
  const store = await cookies();
  store.set(YEAR_COOKIE, String(parsed.data), { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  return done();
}

export async function createYearAction(year: number): Promise<ActionResult> {
  await requireUser();
  const parsed = yearSchema.safeParse(year);
  if (!parsed.success) return { ok: false, error: "errGeneric" };
  await ensureYear(parsed.data);
  const store = await cookies();
  store.set(YEAR_COOKIE, String(parsed.data), { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  return done();
}

const saveSchema = z.object({
  year: yearSchema,
  cells: z
    .array(
      z.object({
        memberId: idSchema,
        month: z.number().int().min(1).max(12),
        contribution: amountSchema.nullable(),
        withdrawal: amountSchema,
      }),
    )
    .min(1)
    .max(1000),
});

export async function saveEntriesAction(input: z.infer<typeof saveSchema>): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errGeneric" };
  const { year, cells } = parsed.data;

  const db = await getDb();
  const memberIds = [...new Set(cells.map((c) => c.memberId))];
  const roster = await db
    .select({ memberId: yearMembers.memberId })
    .from(yearMembers)
    .where(and(eq(yearMembers.year, year), inArray(yearMembers.memberId, memberIds)));
  if (roster.length !== memberIds.length) return { ok: false, error: "errGeneric" };

  const toUpsert = cells.filter((c) => c.contribution !== null || c.withdrawal > 0);
  const toDelete = cells.filter((c) => c.contribution === null && c.withdrawal === 0);

  if (toUpsert.length > 0) {
    await db
      .insert(entries)
      .values(toUpsert.map((c) => ({ ...c, year, updatedBy: user.uid })))
      .onConflictDoUpdate({
        target: [entries.memberId, entries.year, entries.month],
        set: {
          contribution: sql`excluded.contribution`,
          withdrawal: sql`excluded.withdrawal`,
          updatedBy: sql`excluded.updated_by`,
          updatedAt: sql`now()`,
        },
      });
  }
  if (toDelete.length > 0) {
    await db
      .delete(entries)
      .where(
        and(
          eq(entries.year, year),
          or(...toDelete.map((c) => and(eq(entries.memberId, c.memberId), eq(entries.month, c.month)))),
        ),
      );
  }
  return done();
}

export async function addMemberAction(year: number, name: string): Promise<ActionResult> {
  await requireUser();
  const y = yearSchema.safeParse(year);
  const n = nameSchema.safeParse(name);
  if (!y.success || !n.success) return { ok: false, error: "errRequired" };

  await ensureYear(y.data);
  const db = await getDb();
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${yearMembers.position}), 0)` })
    .from(yearMembers)
    .where(eq(yearMembers.year, y.data));
  const [member] = await db.insert(members).values({ name: n.data }).returning({ id: members.id });
  await db.insert(yearMembers).values({ year: y.data, memberId: member.id, position: Number(max) + 1 });
  return done();
}

export async function renameMemberAction(memberId: number, name: string): Promise<ActionResult> {
  await requireUser();
  const id = idSchema.safeParse(memberId);
  const n = nameSchema.safeParse(name);
  if (!id.success || !n.success) return { ok: false, error: "errRequired" };
  const db = await getDb();
  await db.update(members).set({ name: n.data }).where(eq(members.id, id.data));
  return done();
}

export async function removeMemberAction(year: number, memberId: number): Promise<ActionResult> {
  await requireUser();
  const y = yearSchema.safeParse(year);
  const id = idSchema.safeParse(memberId);
  if (!y.success || !id.success) return { ok: false, error: "errGeneric" };

  const db = await getDb();
  await db.delete(entries).where(and(eq(entries.year, y.data), eq(entries.memberId, id.data)));
  await db.delete(yearMembers).where(and(eq(yearMembers.year, y.data), eq(yearMembers.memberId, id.data)));

  const stillUsed = await db.select().from(yearMembers).where(eq(yearMembers.memberId, id.data)).limit(1);
  if (stillUsed.length === 0) await db.delete(members).where(eq(members.id, id.data));
  return done();
}

export async function moveMemberAction(year: number, memberId: number, direction: "up" | "down"): Promise<ActionResult> {
  await requireUser();
  const y = yearSchema.safeParse(year);
  const id = idSchema.safeParse(memberId);
  if (!y.success || !id.success || !(await isMemberInYear(y.data, id.data))) return { ok: false, error: "errGeneric" };

  const db = await getDb();
  const roster = await db
    .select()
    .from(yearMembers)
    .where(eq(yearMembers.year, y.data))
    .orderBy(asc(yearMembers.position), asc(yearMembers.memberId));
  const index = roster.findIndex((r) => r.memberId === id.data);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= roster.length) return { ok: true };

  const order = roster.map((r) => r.memberId);
  [order[index], order[swapWith]] = [order[swapWith], order[index]];
  // Rewrite positions sequentially so gaps or duplicates from older edits are normalised
  await Promise.all(
    order.map((mid, i) =>
      db
        .update(yearMembers)
        .set({ position: i + 1 })
        .where(and(eq(yearMembers.year, y.data), eq(yearMembers.memberId, mid))),
    ),
  );
  return done();
}
