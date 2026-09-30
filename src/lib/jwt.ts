import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "boba_session";
export const SESSION_DAYS = 30;

export type SessionPayload = { uid: number; name: string };

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 16 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.uid !== "number" || typeof payload.name !== "string") return null;
    return { uid: payload.uid, name: payload.name };
  } catch {
    return null;
  }
}
