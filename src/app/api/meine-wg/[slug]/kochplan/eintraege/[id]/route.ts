import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";
import { parseIsoDate } from "@/lib/wg-koch-day";

interface PatchBody {
  date?: string;
  time?: string | null;
  title?: string;
  description?: string | null;
  cookId?: string | null;
  selfCook?: boolean;
  clearCook?: boolean;
}

// PATCH /api/meine-wg/[slug]/kochplan/eintraege/[id]
export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const eintrag = await prisma.wgKochEintrag.findUnique({
    where: { id: params.id },
  });
  if (!eintrag || eintrag.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Ungueltiger Body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (t) data.title = t;
  }
  if (body.date) {
    const parsed = parseIsoDate(body.date);
    if (parsed) data.date = parsed;
  }
  if (body.time !== undefined) {
    data.time = body.time ? body.time.trim().slice(0, 5) : null;
  }
  if (body.description !== undefined) {
    data.description = body.description?.trim() || null;
  }
  if (body.clearCook) {
    data.cookId = null;
  } else if (body.selfCook) {
    data.cookId = access.user.id;
  } else if (body.cookId !== undefined) {
    data.cookId = body.cookId || null;
  }

  await prisma.wgKochEintrag.update({
    where: { id: eintrag.id },
    data,
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/meine-wg/[slug]/kochplan/eintraege/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const eintrag = await prisma.wgKochEintrag.findUnique({
    where: { id: params.id },
  });
  if (!eintrag || eintrag.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  await prisma.wgKochEintrag.delete({ where: { id: eintrag.id } });
  return NextResponse.json({ ok: true });
}
