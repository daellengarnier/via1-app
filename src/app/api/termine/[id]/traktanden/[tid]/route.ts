import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/termine/[id]/traktanden/[tid] — Notizen/Titel bearbeiten
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; tid: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const traktandum = await prisma.traktandum.findUnique({
    where: { id: params.tid },
  });
  if (!traktandum || traktandum.terminId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as { title?: unknown; notes?: unknown };
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim() !== "") {
    data.title = body.title.trim();
  }
  if (typeof body.notes === "string") {
    data.notes = body.notes;
  }

  const updated = await prisma.traktandum.update({
    where: { id: params.tid },
    data,
    include: { createdBy: true },
  });

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    notes: updated.notes,
    order: updated.order,
    createdBy: updated.createdBy.name,
  });
}

// DELETE /api/termine/[id]/traktanden/[tid]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; tid: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const traktandum = await prisma.traktandum.findUnique({
    where: { id: params.tid },
  });
  if (!traktandum || traktandum.terminId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.traktandum.delete({ where: { id: params.tid } });
  return NextResponse.json({ ok: true });
}
