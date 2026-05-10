import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { getWgMemberUserIds, requireWgAccess } from "@/lib/wg-access";

// POST /api/meine-wg/[slug]/termine/[id]/comments
export async function POST(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const t = await prisma.wgTermin.findUnique({
    where: { id: params.id },
    select: { id: true, wgId: true, title: true },
  });
  if (!t || t.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = (body?.text ?? "").trim().slice(0, 2000);
  if (!text) {
    return NextResponse.json({ error: "Text fehlt" }, { status: 400 });
  }

  const c = await prisma.wgTerminComment.create({
    data: { terminId: t.id, authorId: access.user.id, text },
  });

  // Push an WG-Member ausser Author
  const memberIds = await getWgMemberUserIds(access.wg.id);
  if (memberIds.length > 0) {
    await notify({
      kind: "WG_TERMIN_COMMENT",
      title: `💬 ${access.wg.name}: ${t.title}`,
      body: `${access.user.name}: ${text.slice(0, 80)}`,
      link: `/meine-wg/${params.slug}/termine/${t.id}`,
      audience: memberIds,
      excludeUserId: access.user.id,
    });
  }

  return NextResponse.json({ id: c.id });
}
