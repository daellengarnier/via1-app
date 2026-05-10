import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

// DELETE /api/meine-wg/[slug]/einkauf/[id]/comments/[commentId]
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

  const c = await prisma.wgEinkaufComment.findUnique({
    where: { id: params.commentId },
    include: { einkauf: { select: { wgId: true, id: true } } },
  });
  if (!c || c.einkauf.wgId !== access.wg.id || c.einkauf.id !== params.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  if (c.authorId !== access.user.id) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  await prisma.wgEinkaufComment.delete({ where: { id: c.id } });
  return NextResponse.json({ ok: true });
}
