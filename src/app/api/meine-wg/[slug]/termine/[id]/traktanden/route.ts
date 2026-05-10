import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

interface CreateBody {
  title?: string;
  notes?: string | null;
}

// POST /api/meine-wg/[slug]/termine/[id]/traktanden
export async function POST(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const t = await prisma.wgTermin.findUnique({ where: { id: params.id } });
  if (!t || t.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  const title = (body?.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Titel fehlt" }, { status: 400 });
  }
  const max = await prisma.wgTerminTraktandum.findFirst({
    where: { terminId: t.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (max?.order ?? -1) + 1;

  const tr = await prisma.wgTerminTraktandum.create({
    data: {
      terminId: t.id,
      title,
      notes: body?.notes?.trim() || null,
      order,
    },
  });
  return NextResponse.json({ id: tr.id });
}
