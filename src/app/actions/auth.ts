"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import type { DictKey } from "@/lib/i18n";
import { createSession, deleteSession } from "@/lib/session";

export type AuthState = { error?: DictKey } | undefined;

// Compared against when the account does not exist so response time does not reveal it
let dummyHash: Promise<string> | undefined;

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function sameSecret(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  password: z.string().min(1).max(200),
});

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "errRequired" };

  const db = await getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.identifier, normalizeIdentifier(parsed.data.identifier)))
    .limit(1);
  dummyHash ??= hash("not-a-real-password", 12);
  const ok = await compare(parsed.data.password, user?.passwordHash ?? (await dummyHash));
  if (!user || !ok) return { error: "errInvalidCredentials" };

  await createSession({ uid: user.id, name: user.name });
  redirect("/");
}

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  identifier: z.string().trim().min(3).max(120),
  password: z.string().max(200),
  accessCode: z.string().trim().min(1).max(100),
});

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const expectedCode = process.env.SIGNUP_ACCESS_CODE?.trim();
  if (!expectedCode) return { error: "errSignupDisabled" };

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    accessCode: formData.get("accessCode"),
  });
  if (!parsed.success) return { error: "errRequired" };
  if (parsed.data.password.length < 8) return { error: "errPasswordShort" };
  if (!sameSecret(parsed.data.accessCode, expectedCode)) return { error: "errBadAccessCode" };

  const identifier = normalizeIdentifier(parsed.data.identifier);
  const db = await getDb();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.identifier, identifier)).limit(1);
  if (existing.length > 0) return { error: "errIdentifierTaken" };

  const passwordHash = await hash(parsed.data.password, 12);
  const [user] = await db
    .insert(users)
    .values({ name: parsed.data.name, identifier, passwordHash })
    .onConflictDoNothing()
    .returning({ id: users.id, name: users.name });
  if (!user) return { error: "errIdentifierTaken" };

  await createSession({ uid: user.id, name: user.name });
  redirect("/");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
