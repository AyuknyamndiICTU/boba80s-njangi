import { config } from "dotenv";
import path from "node:path";

config({ path: [".env.local", ".env"], quiet: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.VERCEL) {
      throw new Error("DATABASE_URL is not set. Add your Neon connection string in Vercel project settings.");
    }
    console.log("[migrate] No DATABASE_URL - local PGlite database migrates automatically on first request.");
    return;
  }
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const { migrate } = await import("drizzle-orm/neon-http/migrator");
  const schema = await import("../src/db/schema");
  const { seed } = await import("../src/db/seed");

  const db = drizzle({ client: neon(url), schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await seed(db);
  console.log("[migrate] Database is up to date.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
