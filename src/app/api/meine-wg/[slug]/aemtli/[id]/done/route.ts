import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

interface DoneBody {
  notes?: string | null;
  userId?: string; // optional: erledigt fuer einen anderen User
}

// POST /api/meine-wg/[slug]/aemtli/[id]/done — Aemtli als erledigt markieren
export async function POST(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const a = await prisma.wgAemtli.findUnique({ where: { id: params.id } });
  if (!a || a.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as DoneBody | null;
  const notes =
    typeof body?.notes === "string" ? body.notes.trim().slice(0, 200) || null : null;
  const userId =
    typeof body?.userId === "string" && body.userId ? body.userId : access.user.id;

  // Sanity-Check: userId muss in der WG sein
  const userInWg = await prisma.user.findFirst({
    where: { id: userId, room: { wgId: access.wg.id } },
    select: { id: true },
  });
  if (!userInWg) {
    return NextResponse.json(
      { error: "User ist nicht in dieser WG." },
      { status: 400 }
    );
  }

  await prisma.wgAemtliErledigung.create({
    data: { aemtliId: a.id, userId, notes },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/meine-wg/[slug]/aemtli/[id]/done?erledigungId=xxx — Letzte zurueck
export async function DELETE(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const a = await prisma.wgAemtli.findUnique({ where: { id: params.id } });
  if (!a || a.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const url = new URL(req.url);
  const erledigungId = url.searchParams.get("erledigungId");

  if (erledigungId) {
    await prisma.wgAemtliErledigung.deleteMany({
      where: { id: erledigungId, aemtliId: a.id },
    });
  } else {
    // Letzte Erledigung loeschen
    const last = await prisma.wgAemtliErledigung.findFirst({
      where: { aemtliId: a.id },
      orderBy: { doneAt: "desc" },
      select: { id: true },
    });
    if (last) {
      await prisma.wgAemtliErledigung.delete({ where: { id: last.id } });
    }
  }

  return NextResponse.json({ ok: true });
}
