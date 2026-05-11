import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { encode } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function sessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

// POST /api/admin/impersonate/stop — Impersonation beenden.
// Liest impersonatedBy aus dem aktuellen JWT und stellt fuer den
// Original-Admin eine saubere Session her.
export async function POST() {
  const session = await getServerSession(authOptions);
  const original = session?.user?.impersonatedBy;
  if (!original) {
    return NextResponse.json(
      { error: "Keine aktive Impersonation." },
      { status: 400 }
    );
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: original.id },
    select: { id: true, name: true, email: true, roles: true },
  });
  if (!adminUser) {
    return NextResponse.json(
      { error: "Original-Admin nicht mehr in DB." },
      { status: 404 }
    );
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
      sub: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      roles: adminUser.roles as string[],
    },
  });

  cookies().set(sessionCookieName(), newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return NextResponse.json({ ok: true });
}
