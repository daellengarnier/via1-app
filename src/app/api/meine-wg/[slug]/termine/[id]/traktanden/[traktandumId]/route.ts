import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

interface PatchBody {
  title?: string;
  notes?: string | null;
}

// PATCH /api/meine-wg/[slug]/termine/[id]/traktanden/[traktandumId]
export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: { slug: string; id: string; traktandumId: string };
  }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const tr = await prisma.wgTerminTraktandum.findUnique({
    where: { id: params.traktandumId },
    include: { termin: { select: { wgId: true, id: true } } },
  });
  if (!tr || tr.termin.wgId !== access.wg.id || tr.termin.id !== params.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Ungueltiger Body" }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (body.notes !== undefined) {
    data.notes = body.notes?.trim() || null;
  }
  await prisma.wgTerminTraktandum.update({ where: { id: tr.id }, data });
  return NextResponse.json({ ok: true });
}

// DELETE
export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: { slug: string; id: string; traktandumId: string };
  }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const tr = await prisma.wgTerminTraktandum.findUnique({
    where: { id: params.traktandumId },
    include: { termin: { select: { wgId: true, id: true } } },
  });
  if (!tr || tr.termin.wgId !== access.wg.id || tr.termin.id !== params.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  await prisma.wgTerminTraktandum.delete({ where: { id: tr.id } });
  return NextResponse.json({ ok: true });
}
