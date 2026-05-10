import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";
import { notify } from "@/lib/notify";

// POST /api/meine-wg/[slug]/kochplan/eintraege/[id]/comments
// Neuer Kommentar zu einem Kochplan-Eintrag (z.B. Pizza-Bestellung).
// Push an: Koch + alle die schon kommentiert oder sich angemeldet haben
// (ausser dem Autor selbst).
export async function POST(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const eintrag = await prisma.wgKochEintrag.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      wgId: true,
      menu: true,
      cookId: true,
      signups: { select: { userId: true } },
      comments: { select: { authorId: true } },
    },
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

  // Audience: Koch + bisherige Signups + bisherige Kommentatoren
  const audienceSet = new Set<string>();
  if (eintrag.cookId) audienceSet.add(eintrag.cookId);
  for (const s of eintrag.signups) audienceSet.add(s.userId);
  for (const cm of eintrag.comments) audienceSet.add(cm.authorId);
  audienceSet.delete(access.user.id);
  if (audienceSet.size > 0) {
    await notify({
      kind: "WG_KOCH_COMMENT",
      title: `💬 ${access.wg.name}: Neuer Kommentar`,
      body: `${access.user.name} zu "${eintrag.menu ?? "Kochplan"}": ${text.slice(0, 80)}`,
      link: `/meine-wg/${params.slug}/kochplan`,
      audience: Array.from(audienceSet),
    });
  }

  return NextResponse.json({ id: c.id });
}
