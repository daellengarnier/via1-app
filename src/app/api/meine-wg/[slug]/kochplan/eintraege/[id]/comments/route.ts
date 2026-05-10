import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

// POST /api/meine-wg/[slug]/kochplan/eintraege/[id]/comments
// Neuer Kommentar zu einem Kochplan-Eintrag (z.B. Pizza-Bestellung).
export async function POST(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const eintrag = await prisma.wgKochEintrag.findUnique({
    where: { id: params.id },
    select: { id: true, wgId: true },
  });
  if (!eintrag || eintrag.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = (body?.text ?? "").trim().slice(0, 500);
  if (!text) {
    return NextResponse.json({ error: "Text fehlt" }, { status: 400 });
  }

  const c = await prisma.wgKochComment.create({
    data: { eintragId: eintrag.id, authorId: access.user.id, text },
  });
  return NextResponse.json({ id: c.id });
}
