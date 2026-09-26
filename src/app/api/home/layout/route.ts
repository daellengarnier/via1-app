import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeHomeLayout } from "@/lib/home-layout";

export const dynamic = "force-dynamic";

// GET /api/home/layout — eigene Home-Anordnung (normalisiert, mit
// Defaults fuer alles, was nicht gespeichert ist).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { homeLayout: true },
  });
  return NextResponse.json(normalizeHomeLayout(me?.homeLayout));
}

// PUT /api/home/layout — Anordnung speichern. Body = HomeLayout.
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const layout = normalizeHomeLayout(body);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { homeLayout: layout as unknown as Prisma.InputJsonValue },
  });
  return NextResponse.json(layout);
}

// DELETE /api/home/layout — zurueck auf Standard.
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { homeLayout: Prisma.JsonNull },
  });
  return NextResponse.json(normalizeHomeLayout(null));
}
