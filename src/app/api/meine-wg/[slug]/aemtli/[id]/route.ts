import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

interface PatchBody {
  title?: string;
  description?: string | null;
  intervalDays?: number;
  active?: boolean;
}

// PATCH /api/meine-wg/[slug]/aemtli/[id] — Aemtli bearbeiten
export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const a = await prisma.wgAemtli.findUnique({ where: { id: params.id } });
  if (!a || a.wgId !== access.wg.id) {
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
  if (body.description !== undefined) {
    data.description = body.description?.trim() || null;
  }
  if (typeof body.intervalDays === "number") {
    data.intervalDays = Math.max(1, Math.min(365, Math.floor(body.intervalDays)));
  }
  if (typeof body.active === "boolean") {
    data.active = body.active;
  }

  await prisma.wgAemtli.update({ where: { id: a.id }, data });
  return NextResponse.json({ ok: true });
}

// DELETE /api/meine-wg/[slug]/aemtli/[id] — Aemtli loeschen
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const a = await prisma.wgAemtli.findUnique({ where: { id: params.id } });
  if (!a || a.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  if (a.mandatory) {
    return NextResponse.json(
      { error: "Verpflichtende Aemtli koennen nicht geloescht werden." },
      { status: 400 }
    );
  }

  await prisma.wgAemtli.delete({ where: { id: a.id } });
  return NextResponse.json({ ok: true });
}
