import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";
import { notify } from "@/lib/notify";

// POST /api/meine-wg/[slug]/einkauf/[id]/comments
// Push an Ersteller des Eintrags und alle bisherigen Kommentatoren
// (ausser dem aktuellen Autor).
export async function POST(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const item = await prisma.wgEinkauf.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      wgId: true,
      text: true,
      createdById: true,
      comments: { select: { authorId: true } },
    },
  });
  if (!item || item.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = (body?.text ?? "").trim().slice(0, 500);
  if (!text) {
    return NextResponse.json({ error: "Text fehlt" }, { status: 400 });
  }

  const c = await prisma.wgEinkaufComment.create({
    data: { einkaufId: item.id, authorId: access.user.id, text },
  });

  const audience = new Set<string>();
  audience.add(item.createdById);
  for (const cm of item.comments) audience.add(cm.authorId);
  audience.delete(access.user.id);
  if (audience.size > 0) {
    await notify({
      kind: "WG_EINKAUF_COMMENT",
      title: `🛒 ${access.wg.name}: Neuer Kommentar`,
      body: `${access.user.name} zu "${item.text}": ${text.slice(0, 80)}`,
      link: `/meine-wg/${params.slug}/einkauf`,
      audience: Array.from(audience),
    });
  }

  return NextResponse.json({ id: c.id });
}
