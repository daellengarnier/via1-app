import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

// DELETE /api/meine-wg/[slug]/kochplan/templates/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const t = await prisma.wgKochTemplate.findUnique({
    where: { id: params.id },
  });
  if (!t || t.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  await prisma.wgKochTemplate.delete({ where: { id: t.id } });
  return NextResponse.json({ ok: true });
}
