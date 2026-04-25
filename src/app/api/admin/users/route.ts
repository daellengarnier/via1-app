import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users — Liste aller User mit Status (nur Admins)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(session.user.roles || []).includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: [{ passwordSet: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      fullName: true,
      email: true,
      roles: true,
      passwordSet: true,
      setupToken: true,
      createdAt: true,
      updatedAt: true,
      room: {
        select: {
          keyNumber: true,
          wg: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      fullName: u.fullName ?? "",
      email: u.email,
      roles: u.roles,
      passwordSet: u.passwordSet,
      hasSetupToken: !!u.setupToken,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      wgName: u.room?.wg.name ?? null,
      roomKey: u.room?.keyNumber ?? null,
    }))
  );
}

// POST /api/admin/users — neuen User anlegen (nur Admins)
// Body: { name, email } — erzeugt User mit setupToken, passwordSet=false
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(session.user.roles || []).includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { name?: unknown; email?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name und E-Mail sind erforderlich." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Ungültige E-Mail-Adresse." },
      { status: 400 }
    );
  }

  // Existiert schon?
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      {
        error: `Diese E-Mail ist bereits vergeben (${existing.name}).`,
      },
      { status: 409 }
    );
  }

  const token = randomBytes(24).toString("base64url");
  const created = await prisma.user.create({
    data: {
      name,
      email,
      roles: [Role.USER],
      setupToken: token,
      passwordSet: false,
    },
  });

  return NextResponse.json({
    id: created.id,
    name: created.name,
    email: created.email,
    token,
    path: `/setup/${token}`,
  });
}
