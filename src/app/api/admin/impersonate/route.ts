import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { encode } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Cookie-Name fuer den next-auth JWT — secure prefix in Production.
function sessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 Tage

interface Body {
  userId?: unknown;
}

// POST /api/admin/impersonate — Admin loggt sich als Ziel-User ein.
// Der Original-Admin wird im JWT als impersonatedBy gespeichert; ueber
// /stop kann der Admin seine eigene Session wiederherstellen.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Nur Admins" }, { status: 403 });
  }
  // Verschachtelte Impersonation verbieten — Admin muss erst stoppen.
  if (session.user.impersonatedBy) {
    return NextResponse.json(
      { error: "Bereits in Impersonation — bitte erst stoppen." },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const targetId = typeof body?.userId === "string" ? body.userId : "";
  if (!targetId) {
    return NextResponse.json({ error: "userId fehlt" }, { status: 400 });
  }
  if (targetId === session.user.id) {
    return NextResponse.json({ error: "Bist schon du." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, email: true, roles: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "NEXTAUTH_SECRET nicht gesetzt" },
      { status: 500 }
    );
  }

  const newToken = await encode({
    secret,
    maxAge: SESSION_MAX_AGE,
    token: {
      sub: target.id,
      name: target.name,
      email: target.email,
      roles: target.roles as string[],
      impersonatedBy: {
        id: session.user.id,
        name: session.user.name,
      },
    },
  });

  cookies().set(sessionCookieName(), newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return NextResponse.json({ ok: true, target: { id: target.id, name: target.name } });
}
