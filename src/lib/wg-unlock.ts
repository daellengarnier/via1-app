import { createHmac, timingSafeEqual } from "crypto";

// Cookie fuer den "Meine WG"-Bereich. HMAC-signiert mit
// NEXTAUTH_SECRET. Speichert pro User (uid) welche WG-IDs entsperrt
// sind und wann das ablaeuft.

const COOKIE_NAME = "via1-wg-unlock";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface WgUnlockPayload {
  uid: string;
  wgs: string[];
  exp: number;
}

function getSecret(): string {
  return process.env.NEXTAUTH_SECRET ?? "";
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export const WG_UNLOCK_COOKIE_NAME = COOKIE_NAME;
export const WG_UNLOCK_TTL_SECONDS = Math.floor(TTL_MS / 1000);

export function encodeWgUnlock(payload: WgUnlockPayload): string {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = sign(b64);
  return `${b64}.${sig}`;
}

export function decodeWgUnlock(value: string | undefined | null): WgUnlockPayload | null {
  if (!value) return null;
  const dot = value.indexOf(".");
  if (dot < 0) return null;
  const b64 = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!b64 || !sig) return null;
  if (!safeEqual(sign(b64), sig)) return null;
  try {
    const json = Buffer.from(b64, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as Partial<WgUnlockPayload>;
    if (
      typeof payload.uid !== "string" ||
      !Array.isArray(payload.wgs) ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }
    if (payload.exp < Date.now()) return null;
    return {
      uid: payload.uid,
      wgs: payload.wgs.filter((w): w is string => typeof w === "string"),
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function buildUnlockedSet(
  current: WgUnlockPayload | null,
  userId: string,
  wgIdToAdd: string
): WgUnlockPayload {
  const existing = current && current.uid === userId ? current.wgs : [];
  const wgs = Array.from(new Set([...existing, wgIdToAdd]));
  return { uid: userId, wgs, exp: Date.now() + TTL_MS };
}

// Slugify fuer WG-Namen → URL-Pfad. "Family-WG" → "family-wg",
// "Bonzennest" → "bonzennest". Reicht fuer unsere 6 WGs.
export function wgSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
