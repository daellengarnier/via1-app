import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";
import { loadHafermilch } from "@/lib/hafermilch";

// DELETE /api/meine-wg/[slug]/hafermilch/orders/[id] — Erfasser:in,
// Kaeufer:in oder Admin.
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const order = await prisma.wgHafermilchOrder.findUnique({
    where: { id: params.id },
  });
  if (!order || order.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  const isAdmin = access.user.roles.includes("ADMIN");
  if (
    order.createdById !== access.user.id &&
    order.boughtById !== access.user.id &&
    !isAdmin
  ) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  await prisma.wgHafermilchOrder.delete({ where: { id: order.id } });
  return NextResponse.json(await loadHafermilch(access.wg.id));
}
