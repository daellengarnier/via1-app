import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";
import { isValidColor } from "@/lib/wg-pinnwand-colors";

interface PatchBody {
  text?: string;
  color?: string;
}

// PATCH /api/meine-wg/[slug]/pinnwand/[id]
export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const n = await prisma.wgPinnwandNote.findUnique({ where: { id: params.id } });
  if (!n || n.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  if (n.authorId !== access.user.id) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Ungueltiger Body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.text === "string") {
    const t = body.text.trim().slice(0, 500);
    if (t) data.text = t;
  }
  if (isValidColor(body.color)) {
    data.color = body.color;
  }

  await prisma.wgPinnwandNote.update({ where: { id: n.id }, data });
  return NextResponse.json({ ok: true });
}

// DELETE /api/meine-wg/[slug]/pinnwand/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const n = await prisma.wgPinnwandNote.findUnique({ where: { id: params.id } });
  if (!n || n.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  if (n.authorId !== access.user.id) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  await prisma.wgPinnwandNote.delete({ where: { id: n.id } });
  return NextResponse.json({ ok: true });
}
