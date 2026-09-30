import { ledgerYears, members, yearMembers } from "./schema";
import { nowInCameroon } from "../lib/dates";
import type { DB } from "./index";

// Roster from "BOBA 80s.pdf" (2024 Njangi Contribution sheet)
export const SEED_MEMBERS = [
  "ASAAH EBENEZAR",
  "CHUNGANG CHISTOPHER",
  "DUGA ERNEST",
  "GHOGOMU MBIMINAH",
  "MANCHO DIVINE",
  "MBA DIVINE",
  "NSOH CHISTOPHER",
  "NYAMNDI BENJAMINE",
  "NYANGA PAUL",
  "TANDA GEORGE",
  "TITA ISAAC",
  "TUMBAN HAGGAI",
];

export async function seed(db: DB) {
  const existing = await db.select({ year: ledgerYears.year }).from(ledgerYears).limit(1);
  if (existing.length > 0) return;

  const { year } = nowInCameroon();
  await db.insert(ledgerYears).values({ year }).onConflictDoNothing();
  const inserted = await db
    .insert(members)
    .values(SEED_MEMBERS.map((name) => ({ name })))
    .returning({ id: members.id });
  await db
    .insert(yearMembers)
    .values(inserted.map((m, i) => ({ year, memberId: m.id, position: i + 1 })));
}
