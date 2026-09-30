import {
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // Email or phone number, normalised (lowercase, no spaces)
  identifier: text("identifier").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ledgerYears = pgTable("ledger_years", {
  year: integer("year").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const yearMembers = pgTable(
  "year_members",
  {
    year: integer("year")
      .notNull()
      .references(() => ledgerYears.year, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.year, t.memberId] })],
);

export const entries = pgTable(
  "entries",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    // null = nothing entered for that month
    contribution: integer("contribution"),
    withdrawal: integer("withdrawal").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    updatedBy: integer("updated_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [uniqueIndex("entries_member_year_month").on(t.memberId, t.year, t.month)],
);
