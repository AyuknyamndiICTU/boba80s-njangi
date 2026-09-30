import path from "node:path";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { seed } from "./seed";

export type DB = NeonHttpDatabase<typeof schema>;

const g = globalThis as unknown as { __bobaDb?: Promise<DB> };

async function create(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    return drizzle({ client: neon(url), schema });
  }
  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is not set. Add your Neon connection string in Vercel project settings.");
  }

  // Local development: embedded Postgres stored in ./.pglite, migrated and seeded automatically
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite(path.join(process.cwd(), ".pglite"));
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  const typed = db as unknown as DB;
  await seed(typed);
  return typed;
}

export function getDb(): Promise<DB> {
  if (!g.__bobaDb) {
    g.__bobaDb = create().catch((err) => {
      g.__bobaDb = undefined;
      throw err;
    });
  }
  return g.__bobaDb;
}
