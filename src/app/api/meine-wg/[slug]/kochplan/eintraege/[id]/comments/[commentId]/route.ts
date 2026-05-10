import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

// DELETE /api/meine-wg/[slug]/kochplan/eintraege/[id]/comments/[commentId]
// Eigene Kommentare loeschen.
export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: { slug: string; id: string; commentId: string };
  }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const c = await prisma.wgKochComment.findUnique({
    where: { id: params.commentId },
    include: { eintrag: { select: { wgId: true, id: true } } },
  });
  if (!c || c.eintrag.wgId !== access.wg.id || c.eintrag.id !== params.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  if (c.authorId !== access.user.id) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  await prisma.wgKochComment.delete({ where: { id: c.id } });
  return NextResponse.json({ ok: true });
}
