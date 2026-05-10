import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

// POST /api/meine-wg/[slug]/einkauf/[id]/comments
export async function POST(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const item = await prisma.wgEinkauf.findUnique({
    where: { id: params.id },
    select: { id: true, wgId: true },
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

  return NextResponse.json({ id: c.id });
}
