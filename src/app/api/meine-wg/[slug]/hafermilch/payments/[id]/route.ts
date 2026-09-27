import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";
import { loadHafermilch } from "@/lib/hafermilch";

// DELETE /api/meine-wg/[slug]/hafermilch/payments/[id] — Zahler:in,
// Empfaenger:in oder Admin (z.B. bei Fehleintrag).
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const payment = await prisma.wgHafermilchPayment.findUnique({
    where: { id: params.id },
  });
  if (!payment || payment.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  const isAdmin = access.user.roles.includes("ADMIN");
  if (
    payment.fromId !== access.user.id &&
    payment.toId !== access.user.id &&
    !isAdmin
  ) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  await prisma.wgHafermilchPayment.delete({ where: { id: payment.id } });
  return NextResponse.json(await loadHafermilch(access.wg.id));
}
