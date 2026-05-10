import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  WG_UNLOCK_COOKIE_NAME,
  WG_UNLOCK_TTL_SECONDS,
  buildUnlockedSet,
  decodeWgUnlock,
  encodeWgUnlock,
  wgSlug,
} from "@/lib/wg-unlock";

// POST /api/meine-wg/[slug]/unlock
// Body: { password: string }
// Prueft Passwort gegen Wg.passwordHash, setzt bei Erfolg den
// Unlock-Cookie (HMAC-signiert, 30 Tage, an User-ID gebunden).
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Phase 0: nur Admins haben Zugriff bis das Feature reif ist
  if (!(session.user.roles ?? []).includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allWgs = await prisma.wg.findMany({
    select: { id: true, name: true, passwordHash: true },
  });
  const wg = allWgs.find((w) => wgSlug(w.name) === params.slug);
  if (!wg) {
    return NextResponse.json({ error: "WG nicht gefunden." }, { status: 404 });
  }
  if (!wg.passwordHash) {
    return NextResponse.json(
      { error: "Fuer diese WG ist noch kein Passwort gesetzt." },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => null)) as
    | { password?: unknown }
    | null;
  const password =
    body && typeof body.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json(
      { error: "Passwort fehlt." },
      { status: 400 }
    );
  }

  const ok = await bcrypt.compare(password, wg.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Falsches Passwort." },
      { status: 403 }
    );
  }

  const cookieStore = cookies();
  const existing = decodeWgUnlock(
    cookieStore.get(WG_UNLOCK_COOKIE_NAME)?.value
  );
  const next = buildUnlockedSet(existing, session.user.id, wg.id);
  cookieStore.set(WG_UNLOCK_COOKIE_NAME, encodeWgUnlock(next), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: WG_UNLOCK_TTL_SECONDS,
    path: "/",
  });

  return NextResponse.json({ ok: true, wgId: wg.id });
}
