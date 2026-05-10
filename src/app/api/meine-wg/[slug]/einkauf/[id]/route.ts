import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

interface PatchBody {
  text?: string;
  done?: boolean;
}

// PATCH /api/meine-wg/[slug]/einkauf/[id] — Text aendern oder erledigt-Toggle
export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const item = await prisma.wgEinkauf.findUnique({ where: { id: params.id } });
  if (!item || item.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Ungueltiger Body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.text === "string") {
    const t = body.text.trim().slice(0, 200);
    if (t) data.text = t;
  }
  if (typeof body.done === "boolean") {
    data.done = body.done;
    data.doneAt = body.done ? new Date() : null;
    data.doneById = body.done ? access.user.id : null;
  }

  await prisma.wgEinkauf.update({ where: { id: item.id }, data });
  return NextResponse.json({ ok: true });
}

// DELETE /api/meine-wg/[slug]/einkauf/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const item = await prisma.wgEinkauf.findUnique({ where: { id: params.id } });
  if (!item || item.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  await prisma.wgEinkauf.delete({ where: { id: item.id } });
  return NextResponse.json({ ok: true });
}
