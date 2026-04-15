import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/users/[id]/reset-password — Passwort-Reset-Token erzeugen
// Generiert einen neuen setupToken und setzt passwordSet=false, sodass der
// User via /setup/[token] ein neues Passwort setzen kann.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(session.user.roles || []).includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Neuen Token generieren (URL-safe, ~32 Zeichen)
  const token = randomBytes(24).toString("base64url");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      setupToken: token,
      passwordSet: false,
      password: null,
    },
  });

  return NextResponse.json({
    token,
    // Der Admin kopiert diesen relativen Pfad und haengt ihn an die
    // Basis-URL (z.B. https://app.felsenau.org) an.
    path: `/setup/${token}`,
  });
}
