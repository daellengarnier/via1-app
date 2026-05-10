import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

// GET /api/meine-wg/[slug]/aemtli/history — letzte 50 Erledigungen
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const entries = await prisma.wgAemtliErledigung.findMany({
    where: { aemtli: { wgId: access.wg.id } },
    include: {
      aemtli: { select: { id: true, title: true } },
      user: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { doneAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    entries.map((e) => ({
      id: e.id,
      doneAt: e.doneAt.toISOString(),
      notes: e.notes,
      aemtli: e.aemtli,
      user: e.user,
    }))
  );
}
