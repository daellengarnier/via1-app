import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { requireWgAccess } from "@/lib/wg-access";

// POST /api/meine-wg/[slug]/pinnwand/[id]/comments
export async function POST(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const n = await prisma.wgPinnwandNote.findUnique({
    where: { id: params.id },
    select: { id: true, wgId: true, authorId: true, text: true },
  });
  if (!n || n.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = (body?.text ?? "").trim().slice(0, 500);
  if (!text) {
    return NextResponse.json({ error: "Text fehlt" }, { status: 400 });
  }

  const c = await prisma.wgPinnwandComment.create({
    data: { noteId: n.id, authorId: access.user.id, text },
  });

  // Push: nur an Note-Author, falls nicht selbst kommentiert
  if (n.authorId !== access.user.id) {
    await notify({
      kind: "WG_PINNWAND_COMMENT",
      title: `💬 ${access.wg.name}: Kommentar zu deinem Post-It`,
      body: `${access.user.name}: ${text.slice(0, 80)}`,
      link: `/meine-wg/${params.slug}/pinnwand`,
      audience: [n.authorId],
    });
  }

  return NextResponse.json({ id: c.id });
}
