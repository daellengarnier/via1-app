import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/damages/[id] — Schaden als behoben markieren (resolved=true/false)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    resolved?: unknown;
    description?: unknown;
    severity?: unknown;
  };

  const data: Record<string, unknown> = {};
  if (typeof body.resolved === "boolean") {
    data.resolvedAt = body.resolved ? new Date() : null;
  }
  if (typeof body.description === "string") {
    data.description = body.description;
  }
  if (
    body.severity === "klein" ||
    body.severity === "mittel" ||
    body.severity === "gross"
  ) {
    data.severity = body.severity;
  }

  const updated = await prisma.roomDamage.update({
    where: { id: params.id },
    data,
    include: {
      reportedBy: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({
    id: updated.id,
    description: updated.description,
    severity: updated.severity,
    reportedAt: updated.reportedAt.toISOString(),
    resolvedAt: updated.resolvedAt?.toISOString() ?? null,
    reportedBy: updated.reportedBy?.name ?? null,
    reportedById: updated.reportedById,
  });
}

// DELETE /api/damages/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const damage = await prisma.roomDamage.findUnique({
    where: { id: params.id },
  });
  if (!damage) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (damage.reportedById !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.roomDamage.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
